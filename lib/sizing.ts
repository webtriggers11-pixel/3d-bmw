import type { NameSize } from "@/app/generated/prisma/enums";
import { ANCHOR_PANEL, DEFAULT_PANEL } from "@/lib/anchors";

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

/** Relative render scale per size tier (the tier's *target* size multiplier). */
export const SIZE_SCALE: Record<NameSize, number> = {
  XS: 0.6,
  S: 0.8,
  M: 1.0,
  L: 1.3,
  XL: 1.6,
  XXL: 2.0,
};

/** Target text height (model units) for a tier at scale 1.0. */
const BASE_FONT = 0.15;
/** Approx. glyph advance as a fraction of font size (for width-fit). */
const CHAR_WIDTH = 0.58;
/** Don't render below this — keeps even long names legible. */
const MIN_FONT = 0.05;

/**
 * Font size (model units) for a name on the car — the livery rule:
 *   min(tier target, panel height cap, width that fits the name on the panel).
 *
 * `scale` is the tier's target multiplier (SIZE_SCALE[size] × position scale).
 * Tier sets the ambition; the panel caps height; long names auto-shrink to fit
 * width, so nothing ever overflows its surface. Used by both the committed name
 * (NameText) and the preview ghost (PreviewName), so they always agree.
 */
export function fontSizeForName(
  text: string,
  scale: number,
  anchorKey: string,
): number {
  const panel = ANCHOR_PANEL[anchorKey] ?? DEFAULT_PANEL;
  const len = Math.max((text.trim() || "Your name").length, 1);
  const target = BASE_FONT * scale;
  const widthFit = panel.width / (len * CHAR_WIDTH);
  return Math.max(MIN_FONT, Math.min(target, panel.maxFont, widthFit));
}

/** Max width (model units) a name may occupy on a given panel. */
export function panelWidthFor(anchorKey: string): number {
  return (ANCHOR_PANEL[anchorKey] ?? DEFAULT_PANEL).width;
}
