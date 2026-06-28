import type { NameSize } from "@/app/generated/prisma/enums";

/**
 * Contribution → rendered size tier. Amounts are in paise (₹1 = 100 paise).
 * Tiers mirror the business spec:
 *   ₹50–99 XS · ₹100–199 S · ₹200–499 M · ₹500–999 L · ₹1000–2499 XL · ₹2500+ XXL
 */
const TIERS: { min: number; size: NameSize }[] = [
  { min: 250_000, size: "XXL" },
  { min: 100_000, size: "XL" },
  { min: 50_000, size: "L" },
  { min: 20_000, size: "M" },
  { min: 10_000, size: "S" },
  { min: 5_000, size: "XS" },
];

/** Map a contribution (paise) to its rendered size tier. */
export function amountToSize(amountPaise: number): NameSize {
  for (const tier of TIERS) {
    if (amountPaise >= tier.min) return tier.size;
  }
  return "XS";
}

/** Relative render scale per size tier (multiplies a base text size). */
export const SIZE_SCALE: Record<NameSize, number> = {
  XS: 0.6,
  S: 0.8,
  M: 1.0,
  L: 1.3,
  XL: 1.6,
  XXL: 2.0,
};
