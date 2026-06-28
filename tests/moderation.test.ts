import { describe, it, expect } from "vitest";
import { sanitizeText, moderate } from "@/lib/moderation";

describe("sanitizeText", () => {
  it("strips HTML tags and collapses whitespace", () => {
    expect(sanitizeText("<b>Hi</b>   there")).toBe("Hi there");
    expect(sanitizeText("<script>alert(1)</script>Bob")).toBe("alert(1)Bob");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeText("  Alice  ")).toBe("Alice");
  });
});

describe("moderate", () => {
  it("allows clean names", () => {
    expect(moderate("Alice", "Good luck!").ok).toBe(true);
  });

  it("rejects profanity", () => {
    expect(moderate("shit").ok).toBe(false);
  });

  it("catches leetspeak obfuscation", () => {
    expect(moderate("sh1t").ok).toBe(false); // 1 -> i
    expect(moderate("b1tch").ok).toBe(false); // 1 -> i
    expect(moderate("5hit").ok).toBe(false); // 5 -> s
  });

  it("rejects links", () => {
    expect(moderate("Alice", "visit http://spam.com").ok).toBe(false);
    expect(moderate("Alice", "spam.io/x").ok).toBe(false);
  });
});
