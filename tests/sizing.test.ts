import { describe, it, expect } from "vitest";
import { amountToSize, SIZE_SCALE } from "@/lib/sizing";

describe("amountToSize", () => {
  it("maps each tier boundary correctly (paise)", () => {
    expect(amountToSize(5_000)).toBe("XS"); // ₹50
    expect(amountToSize(9_999)).toBe("XS"); // ₹99.99
    expect(amountToSize(10_000)).toBe("S"); // ₹100
    expect(amountToSize(19_999)).toBe("S");
    expect(amountToSize(20_000)).toBe("M"); // ₹200
    expect(amountToSize(49_999)).toBe("M");
    expect(amountToSize(50_000)).toBe("L"); // ₹500
    expect(amountToSize(99_999)).toBe("L");
    expect(amountToSize(100_000)).toBe("XL"); // ₹1000
    expect(amountToSize(249_999)).toBe("XL");
    expect(amountToSize(250_000)).toBe("XXL"); // ₹2500
    expect(amountToSize(10_000_000)).toBe("XXL");
  });

  it("falls back to XS below the minimum", () => {
    expect(amountToSize(0)).toBe("XS");
    expect(amountToSize(4_999)).toBe("XS");
  });

  it("has a scale for every size, increasing with tier", () => {
    expect(SIZE_SCALE.XS).toBeLessThan(SIZE_SCALE.M);
    expect(SIZE_SCALE.M).toBeLessThan(SIZE_SCALE.XXL);
  });
});
