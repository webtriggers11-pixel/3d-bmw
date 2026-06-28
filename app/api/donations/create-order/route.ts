import type { NextRequest } from "next/server";
import { env, razorpayConfigured } from "@/lib/env";
import { donationSchema } from "@/lib/donation-schema";
import { sanitizeText, moderate } from "@/lib/moderation";
import { amountToSize } from "@/lib/sizing";
import { upgradeHint } from "@/lib/placement";
import { getRazorpay } from "@/lib/razorpay";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import {
  getActiveCar,
  reserveFreePosition,
  releaseReservation,
  hasFreePositions,
  storePending,
} from "@/server/positions";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const SIMULATE = !razorpayConfigured && process.env.NODE_ENV !== "production";

export async function POST(req: NextRequest) {
  // Rate limit: 10 order attempts per minute per IP.
  const ip = clientIp(req);
  const rl = await rateLimit(`create-order:${ip}`, 10, 60);
  if (!rl.ok) {
    return Response.json({ error: "Too many attempts. Slow down." }, { status: 429 });
  }

  if (!razorpayConfigured && !SIMULATE) {
    return Response.json({ error: "Payments are not configured." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = donationSchema(env.MIN_CONTRIBUTION_PAISE).safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input." },
      { status: 400 },
    );
  }

  const name = sanitizeText(parsed.data.name);
  const message = parsed.data.message ? sanitizeText(parsed.data.message) : undefined;
  const country = parsed.data.country ? sanitizeText(parsed.data.country) : undefined;
  const amount = parsed.data.amountPaise;

  if (!name) {
    return Response.json({ error: "Name is required." }, { status: 400 });
  }

  const mod = moderate(name, message);
  if (!mod.ok) {
    return Response.json({ error: mod.reason }, { status: 400 });
  }

  const car = await getActiveCar();
  if (!car) {
    return Response.json({ error: "No active car available." }, { status: 503 });
  }

  const size = amountToSize(amount);

  const positionId = await reserveFreePosition(car.id, size);
  if (!positionId) {
    // No eligible spot for this tier. If higher zones still have room, nudge the
    // donor to upgrade; otherwise the whole car is genuinely full.
    const hint = upgradeHint(size);
    if (hint && (await hasFreePositions(car.id))) {
      return Response.json({ error: hint }, { status: 409 });
    }
    return Response.json(
      { error: "All spots on this car are taken. Try again shortly." },
      { status: 409 },
    );
  }

  try {
    let orderId: string;
    if (SIMULATE) {
      orderId = `sim_${crypto.randomUUID()}`;
    } else {
      const order = await getRazorpay().orders.create({
        amount,
        currency: "INR",
        receipt: positionId,
      });
      orderId = order.id;
    }

    await prisma.payment.create({
      data: { provider: "RAZORPAY", orderId, amount, currency: "INR", status: "PENDING" },
    });

    await storePending(orderId, {
      positionId,
      carId: car.id,
      carIndex: car.index,
      name,
      country,
      message,
      amount,
      size,
    });

    return Response.json({
      orderId,
      amount,
      currency: "INR",
      keyId: env.RAZORPAY_KEY_ID,
      simulate: SIMULATE,
      size,
    });
  } catch (err) {
    await releaseReservation(positionId);
    console.error("create-order failed:", err);
    return Response.json({ error: "Could not start payment." }, { status: 500 });
  }
}
