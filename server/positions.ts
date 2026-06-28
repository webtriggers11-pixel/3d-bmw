import "server-only";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { redis } from "@/lib/redis";
import { bus, NAME_EVENT, type NameEvent } from "@/lib/events";
import { eligibleAnchorKeys } from "@/lib/placement";
import type { NameSize } from "@/app/generated/prisma/enums";

const RESERVE_MINUTES = 10;
const PENDING_TTL_SEC = 15 * 60;

export type PendingDonation = {
  positionId: string;
  carId: string;
  carIndex: number;
  name: string;
  country?: string;
  message?: string;
  amount: number; // paise
  size: NameSize;
};

/** The lowest-index car still accepting names. */
export async function getActiveCar() {
  return prisma.car.findFirst({
    where: { status: "ACTIVE" },
    orderBy: { index: "asc" },
  });
}

/**
 * Atomically grab a free anchor on a car and reserve it for RESERVE_MINUTES.
 * The anchor is restricted to the zones the paid `size` is eligible for, and the
 * best-available (most prominent) free spot in that set is chosen — see
 * lib/placement.ts. `FOR UPDATE SKIP LOCKED` ensures concurrent buyers never get
 * the same spot. Returns the reserved position id, or null if no eligible spot
 * is free (the caller decides whether to nudge the donor to a higher tier).
 */
export async function reserveFreePosition(
  carId: string,
  size: NameSize,
): Promise<string | null> {
  const keys = eligibleAnchorKeys(size); // ordered best → worst
  if (keys.length === 0) return null;

  // ORDER BY prominence: lower rank = more prominent = picked first.
  const orderCase = Prisma.join(
    keys.map((k, i) => Prisma.sql`WHEN ${k} THEN ${i}`),
    " ",
  );

  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT id FROM "Position"
      WHERE "carId" = ${carId}
        AND "occupied" = false
        AND ("reservedUntil" IS NULL OR "reservedUntil" < now())
        AND "anchorKey" IN (${Prisma.join(keys)})
      ORDER BY CASE "anchorKey" ${orderCase} ELSE 999 END
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    `);
    if (rows.length === 0) return null;
    const id = rows[0]!.id;
    await tx.position.update({
      where: { id },
      data: { reservedUntil: new Date(Date.now() + RESERVE_MINUTES * 60_000) },
    });
    return id;
  });
}

/** True if the car has any free (unoccupied, unreserved) anchor in any zone. */
export async function hasFreePositions(carId: string): Promise<boolean> {
  const count = await prisma.position.count({
    where: {
      carId,
      occupied: false,
      OR: [{ reservedUntil: null }, { reservedUntil: { lt: new Date() } }],
    },
  });
  return count > 0;
}

/** Release a reservation (e.g. if order creation fails). */
export async function releaseReservation(positionId: string): Promise<void> {
  await prisma.position
    .update({ where: { id: positionId }, data: { reservedUntil: null } })
    .catch(() => {});
}

export async function storePending(orderId: string, ctx: PendingDonation): Promise<void> {
  await redis.set(`pending:${orderId}`, JSON.stringify(ctx), "EX", PENDING_TTL_SEC);
}

/**
 * Finalize a paid donation: mark the position occupied, create the Donation,
 * flip the Payment to PAID, mark the car FULL if it just filled, and broadcast
 * the new name. Idempotent — a missing pending key means it was already done.
 *
 * Signature verification is the CALLER's responsibility (webhook / payment
 * signature). This function is the source of truth for allocation.
 */
export async function finalizePaidDonation(
  orderId: string,
  paymentId: string,
  signature: string | null,
): Promise<{ ok: boolean; reason?: string }> {
  const raw = await redis.get(`pending:${orderId}`);
  if (!raw) return { ok: false, reason: "no-pending-or-already-processed" };
  const ctx = JSON.parse(raw) as PendingDonation;

  try {
    await prisma.$transaction(async (tx) => {
      const pos = await tx.position.findUnique({ where: { id: ctx.positionId } });
      if (!pos || pos.occupied) throw new Error("position-taken");

      await tx.position.update({
        where: { id: pos.id },
        data: { occupied: true, reservedUntil: null },
      });

      const payment = await tx.payment.update({
        where: { orderId },
        data: { status: "PAID", paymentId, signature },
      });

      await tx.donation.create({
        data: {
          name: ctx.name,
          country: ctx.country ?? null,
          message: ctx.message ?? null,
          amount: ctx.amount,
          currency: "INR",
          size: ctx.size,
          moderation: "APPROVED",
          paymentStatus: "PAID",
          carId: ctx.carId,
          positionId: pos.id,
          paymentId: payment.id,
        },
      });

      const remaining = await tx.position.count({
        where: { carId: ctx.carId, occupied: false },
      });
      if (remaining === 0) {
        await tx.car.update({ where: { id: ctx.carId }, data: { status: "FULL" } });
      }
    });
  } catch (err) {
    return { ok: false, reason: err instanceof Error ? err.message : "tx-failed" };
  }

  await redis.del(`pending:${orderId}`);
  const event: NameEvent = { type: "new-name", carIndex: ctx.carIndex, name: ctx.name };
  bus.emit(NAME_EVENT, event);
  return { ok: true };
}
