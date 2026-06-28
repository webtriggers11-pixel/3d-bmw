import type { NameSize, Zone } from "@/types";

/**
 * Placement zones — the source of truth for *where* a name lands based on how
 * much was paid. Higher contributions unlock more prominent surfaces.
 *
 * Client-safe: pure data + functions, no env or Prisma imports, so the form, the
 * preview endpoint, and server allocation all share one definition.
 *
 * Zones rank the fixed 12 anchors (lib/anchors.ts) by visibility from the default
 * camera + auto-rotate: front/top = most seen (Premium), rear/low by the wheels =
 * least seen (Economy). See vibe/features/2026-06-28-amount-tiered-placement.
 */

/** Which zone each anchor belongs to. Every anchorKey in lib/anchors.ts appears once. */
export const ZONE_BY_ANCHOR: Record<string, Zone> = {
  // Premium — front + top, always in view.
  hood: "PREMIUM",
  roof: "PREMIUM",
  "front-door-left": "PREMIUM",
  "front-fender-right": "PREMIUM",
  // Standard — mid body / sides.
  "front-bumper": "STANDARD",
  "side-mirror-left": "STANDARD",
  "rear-door-left": "STANDARD",
  "roof-edge": "STANDARD",
  // Economy — rear + low, near the wheels.
  trunk: "ECONOMY",
  spoiler: "ECONOMY",
  "rear-fender-right": "ECONOMY",
  "side-skirt-right": "ECONOMY",
};

/** Zones from most to least prominent. */
export const ZONE_ORDER: Zone[] = ["PREMIUM", "STANDARD", "ECONOMY"];

/** Human label for a zone (shown to the donor). */
export const ZONE_LABEL: Record<Zone, string> = {
  PREMIUM: "Bonnet & roof",
  STANDARD: "Side panel",
  ECONOMY: "Rear, by the wheel",
};

/** Minimum contribution (rupees) that unlocks a zone — drives the upgrade nudge. */
export const ZONE_MIN_RUPEES: Record<Zone, number> = {
  ECONOMY: 50,
  STANDARD: 200,
  PREMIUM: 1000,
};

/** Short upsell phrase per zone, e.g. "₹200+ for the side panels". */
const ZONE_UPSELL_NOUN: Record<Zone, string> = {
  PREMIUM: "bonnet",
  STANDARD: "side panels",
  ECONOMY: "rear",
};

/** Every anchor, best → worst, used to pick the best available spot. */
export const PROMINENCE: string[] = [
  "hood",
  "front-fender-right",
  "front-door-left",
  "roof",
  "side-mirror-left",
  "front-bumper",
  "rear-door-left",
  "roof-edge",
  "trunk",
  "rear-fender-right",
  "spoiler",
  "side-skirt-right",
];

/**
 * Zones a size may occupy, best zone first. Larger tiers fall *down* into lower
 * zones (never up): a big donor is never rejected while spots remain; a small
 * donor is restricted to Economy.
 */
export const ELIGIBLE_ZONES: Record<NameSize, Zone[]> = {
  XS: ["ECONOMY"],
  S: ["ECONOMY"],
  M: ["STANDARD", "ECONOMY"],
  L: ["STANDARD", "ECONOMY"],
  XL: ["PREMIUM", "STANDARD", "ECONOMY"],
  XXL: ["PREMIUM", "STANDARD", "ECONOMY"],
};

/** Anchor keys a size may occupy, ordered best-available first. */
export function eligibleAnchorKeys(size: NameSize): string[] {
  const zones = new Set(ELIGIBLE_ZONES[size]);
  return PROMINENCE.filter((k) => zones.has(ZONE_BY_ANCHOR[k]!));
}

/**
 * Message shown when every eligible spot for `size` is taken, nudging the donor
 * toward a higher amount that unlocks zones with free spots. Empty string when
 * the size already reaches the top zone (Premium) — nothing higher to offer.
 */
export function upgradeHint(size: NameSize): string {
  const topZone = ELIGIBLE_ZONES[size][0]!; // best zone this size can use
  const topIdx = ZONE_ORDER.indexOf(topZone);
  const upsellZones = ZONE_ORDER.slice(0, topIdx).reverse(); // cheaper → pricier
  if (upsellZones.length === 0) return "";

  const low = ZONE_MIN_RUPEES.ECONOMY;
  const high = ZONE_MIN_RUPEES[ZONE_ORDER[topIdx - 1]!] - 1; // zone just above top
  const offers = upsellZones.map(
    (z) => `₹${ZONE_MIN_RUPEES[z]}+ for the ${ZONE_UPSELL_NOUN[z]}`,
  );
  return `All ₹${low}–${high} spots are taken. Contribute ${offers.join(", or ")}.`;
}
