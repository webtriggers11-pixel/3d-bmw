import { z } from "zod";

// Client-safe (no env import) so both the form and the API can validate.
export const NAME_MAX = 24;
export const MESSAGE_MAX = 140;
export const COUNTRY_MAX = 56;
export const DEFAULT_MIN_PAISE = 5000; // ₹50

/** Validation schema for a donation submission. `minPaise` from server env. */
export function donationSchema(minPaise: number = DEFAULT_MIN_PAISE) {
  return z.object({
    name: z.string().trim().min(1, "Name is required").max(NAME_MAX, `Max ${NAME_MAX} characters`),
    country: z
      .string()
      .trim()
      .max(COUNTRY_MAX)
      .optional()
      .transform((v) => (v ? v : undefined)),
    message: z
      .string()
      .trim()
      .max(MESSAGE_MAX, `Max ${MESSAGE_MAX} characters`)
      .optional()
      .transform((v) => (v ? v : undefined)),
    amountPaise: z
      .number()
      .int()
      .min(minPaise, `Minimum contribution is ₹${Math.round(minPaise / 100)}`),
  });
}

export type DonationInput = z.infer<ReturnType<typeof donationSchema>>;
