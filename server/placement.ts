import "server-only";
import { prisma } from "@/lib/prisma";
import { SIZE_SCALE } from "@/lib/sizing";
import { eligibleAnchorKeys, ZONE_BY_ANCHOR, ZONE_LABEL } from "@/lib/placement";
import { DEFAULT_ANCHORS } from "@/lib/anchors";
import type { NameSize } from "@/app/generated/prisma/enums";
import type { PreviewAnchor, Vec3, Zone } from "@/types";

/** Anchor label by key (e.g. "front-door-left" → "Front Door"). */
const LABEL_BY_KEY: Record<string, string> = Object.fromEntries(
  DEFAULT_ANCHORS.map((a) => [a.anchorKey, a.label]),
);

export type Candidate = {
  anchor: PreviewAnchor;
  zone: Zone;
  zoneLabel: string;
};

type PositionRow = {
  anchorKey: string;
  coordinates: unknown;
  rotation: unknown;
  scale: number;
};

/** Build a Candidate from a position row + size (shared by preview + reservation). */
function buildCandidate(pos: PositionRow, size: NameSize): Candidate {
  const zone = ZONE_BY_ANCHOR[pos.anchorKey]!;
  return {
    zone,
    zoneLabel: ZONE_LABEL[zone],
    anchor: {
      anchorKey: pos.anchorKey,
      label: LABEL_BY_KEY[pos.anchorKey] ?? pos.anchorKey,
      coordinates: pos.coordinates as Vec3,
      rotation: pos.rotation as Vec3,
      scale: SIZE_SCALE[size] * pos.scale,
    },
  };
}

/**
 * Placement for a SPECIFIC (already-reserved) position — used at checkout so the
 * donor sees the exact spot they're paying for, plus when the hold expires.
 */
export async function placementForPosition(
  positionId: string,
  size: NameSize,
): Promise<(Candidate & { reservedUntil: Date | null }) | null> {
  const pos = await prisma.position.findUnique({
    where: { id: positionId },
    select: {
      anchorKey: true,
      coordinates: true,
      rotation: true,
      scale: true,
      reservedUntil: true,
    },
  });
  if (!pos) return null;
  return { ...buildCandidate(pos, size), reservedUntil: pos.reservedUntil };
}

/**
 * The best available free anchor for a size on a car, WITHOUT reserving anything.
 * Mirrors the zone/prominence rules of reserveFreePosition so the preview matches
 * where the name will actually land. Returns null when no eligible spot is free.
 * Geometry (coordinates/rotation/scale) is identical to how a committed name
 * renders — see server/cars.ts.
 */
export async function pickCandidate(
  carId: string,
  size: NameSize,
): Promise<Candidate | null> {
  const keys = eligibleAnchorKeys(size); // best → worst
  if (keys.length === 0) return null;

  const free = await prisma.position.findMany({
    where: {
      carId,
      occupied: false,
      anchorKey: { in: keys },
      OR: [{ reservedUntil: null }, { reservedUntil: { lt: new Date() } }],
    },
    select: { anchorKey: true, coordinates: true, rotation: true, scale: true },
  });
  if (free.length === 0) return null;

  // Most prominent free spot wins (keys are already ordered best-first).
  const rank = new Map(keys.map((k, i) => [k, i]));
  free.sort((a, b) => rank.get(a.anchorKey)! - rank.get(b.anchorKey)!);
  return buildCandidate(free[0]!, size);
}
