import { describe, it, expect } from "vitest";
import { donationSchema } from "@/lib/donation-schema";

const schema = donationSchema(5000); // ₹50 minimum

describe("donationSchema", () => {
  it("accepts a valid submission", () => {
    const r = schema.safeParse({
      name: "Alice",
      country: "India",
      message: "Cheers",
      amountPaise: 10_000,
    });
    expect(r.success).toBe(true);
  });

  it("requires a name", () => {
    const r = schema.safeParse({ name: "", amountPaise: 10_000 });
    expect(r.success).toBe(false);
  });

  it("enforces the minimum contribution", () => {
    const r = schema.safeParse({ name: "Alice", amountPaise: 4_999 });
    expect(r.success).toBe(false);
  });

  it("rejects an over-long message", () => {
    const r = schema.safeParse({
      name: "Alice",
      message: "x".repeat(200),
      amountPaise: 10_000,
    });
    expect(r.success).toBe(false);
  });

  it("treats empty optional fields as undefined", () => {
    const r = schema.safeParse({ name: "Alice", country: "", message: "", amountPaise: 10_000 });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.country).toBeUndefined();
      expect(r.data.message).toBeUndefined();
    }
  });
});
