import type { NextRequest } from "next/server";
import { amountToSize } from "@/lib/sizing";
import { upgradeHint } from "@/lib/placement";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { getActiveCar, hasFreePositions } from "@/server/positions";
import { pickCandidate } from "@/server/placement";
import type { PreviewPlacement } from "@/types";

// Live placement preview — never cache.
export const dynamic = "force-dynamic";

/**
 * GET /api/placement/preview?amountPaise=<int>
 *
 * Computes where a name *would* land for a given contribution, WITHOUT reserving
 * anything. Mirrors create-order's allocation + upgrade-nudge logic so the live
 * preview matches the real outcome. Read-only and rate-limited.
 */
export async function GET(req: NextRequest) {
  const ip = clientIp(req);
  const rl = await rateLimit(`preview:${ip}`, 30, 60);
  if (!rl.ok) {
    return Response.json({ error: "Too many requests." }, { status: 429 });
  }

  const raw = Number(req.nextUrl.searchParams.get("amountPaise"));
  if (!Number.isFinite(raw) || raw < 0) {
    return Response.json({ error: "Invalid amount." }, { status: 400 });
  }
  const amount = Math.floor(raw);
  const size = amountToSize(amount);

  const car = await getActiveCar();
  if (!car) {
    const body: PreviewPlacement = {
      size,
      zone: null,
      zoneLabel: null,
      blocked: true,
      upgradeHint: "No car is currently accepting names.",
      anchor: null,
    };
    return Response.json(body);
  }

  const candidate = await pickCandidate(car.id, size);
  if (candidate) {
    const body: PreviewPlacement = {
      size,
      zone: candidate.zone,
      zoneLabel: candidate.zoneLabel,
      blocked: false,
      anchor: candidate.anchor,
    };
    return Response.json(body);
  }

  // No eligible spot free — same decision as create-order.
  const hint = upgradeHint(size);
  const higherRoom = await hasFreePositions(car.id);
  const body: PreviewPlacement = {
    size,
    zone: null,
    zoneLabel: null,
    blocked: true,
    upgradeHint: hint && higherRoom ? hint : "All spots on this car are taken.",
    anchor: null,
  };
  return Response.json(body);
}
