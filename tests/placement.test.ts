import { describe, it, expect } from "vitest";
import { DEFAULT_ANCHORS } from "@/lib/anchors";
import {
  ZONE_BY_ANCHOR,
  ZONE_LABEL,
  ZONE_ORDER,
  ELIGIBLE_ZONES,
  PROMINENCE,
  eligibleAnchorKeys,
  upgradeHint,
} from "@/lib/placement";
import type { NameSize, Zone } from "@/types";

const ALL_SIZES: NameSize[] = ["XS", "S", "M", "L", "XL", "XXL"];

describe("zone definitions", () => {
  it("zones every anchor in lib/anchors.ts exactly once", () => {
    const anchorKeys = DEFAULT_ANCHORS.map((a) => a.anchorKey).sort();
    const zonedKeys = Object.keys(ZONE_BY_ANCHOR).sort();
    expect(zonedKeys).toEqual(anchorKeys);
  });

  it("PROMINENCE lists every anchor exactly once", () => {
    expect([...PROMINENCE].sort()).toEqual(
      Object.keys(ZONE_BY_ANCHOR).sort(),
    );
    expect(new Set(PROMINENCE).size).toBe(PROMINENCE.length);
  });

  it("has a label for every zone", () => {
    for (const z of ZONE_ORDER) {
      expect(ZONE_LABEL[z]).toBeTruthy();
    }
  });

  it("splits the 12 anchors evenly across 3 zones", () => {
    const counts: Record<Zone, number> = { PREMIUM: 0, STANDARD: 0, ECONOMY: 0 };
    for (const z of Object.values(ZONE_BY_ANCHOR)) counts[z]++;
    expect(counts).toEqual({ PREMIUM: 4, STANDARD: 4, ECONOMY: 4 });
  });
});

describe("eligibleAnchorKeys", () => {
  it("restricts small tiers (XS/S) to Economy only", () => {
    for (const size of ["XS", "S"] as NameSize[]) {
      const keys = eligibleAnchorKeys(size);
      expect(keys.length).toBe(4);
      expect(keys.every((k) => ZONE_BY_ANCHOR[k] === "ECONOMY")).toBe(true);
    }
  });

  it("gives mid tiers (M/L) Standard + Economy, but never Premium", () => {
    for (const size of ["M", "L"] as NameSize[]) {
      const zones = new Set(eligibleAnchorKeys(size).map((k) => ZONE_BY_ANCHOR[k]));
      expect(zones).toEqual(new Set(["STANDARD", "ECONOMY"]));
    }
  });

  it("lets top tiers (XL/XXL) use every spot", () => {
    for (const size of ["XL", "XXL"] as NameSize[]) {
      expect(eligibleAnchorKeys(size).length).toBe(12);
    }
  });

  it("orders results by global prominence (best first)", () => {
    for (const size of ALL_SIZES) {
      const keys = eligibleAnchorKeys(size);
      const ranks = keys.map((k) => PROMINENCE.indexOf(k));
      const sorted = [...ranks].sort((a, b) => a - b);
      expect(ranks).toEqual(sorted);
    }
  });

  it("only ever returns keys within the size's eligible zones", () => {
    for (const size of ALL_SIZES) {
      const allowed = new Set(ELIGIBLE_ZONES[size]);
      expect(
        eligibleAnchorKeys(size).every((k) => allowed.has(ZONE_BY_ANCHOR[k]!)),
      ).toBe(true);
    }
  });

  it("never lets a small tier reach a premium spot", () => {
    const premium = Object.entries(ZONE_BY_ANCHOR)
      .filter(([, z]) => z === "PREMIUM")
      .map(([k]) => k);
    for (const size of ["XS", "S", "M", "L"] as NameSize[]) {
      const keys = new Set(eligibleAnchorKeys(size));
      expect(premium.some((k) => keys.has(k))).toBe(false);
    }
  });
});

describe("upgradeHint", () => {
  it("nudges small tiers toward the higher zones", () => {
    const hint = upgradeHint("XS");
    expect(hint).toContain("₹50–199");
    expect(hint).toContain("₹200+");
    expect(hint).toContain("₹1000+");
  });

  it("nudges mid tiers toward Premium only", () => {
    const hint = upgradeHint("L");
    expect(hint).toContain("₹50–999");
    expect(hint).toContain("₹1000+");
    expect(hint).not.toContain("₹200+");
  });

  it("offers nothing above the top tier", () => {
    expect(upgradeHint("XL")).toBe("");
    expect(upgradeHint("XXL")).toBe("");
  });
});
