import { z } from "zod";

/**
 * Server-side environment validation. Import this from server code only.
 * Razorpay keys are optional so the app boots during scaffolding; payment
 * routes assert their presence at call time.
 */
const serverSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().default(""),
  RAZORPAY_KEY_SECRET: z.string().default(""),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(""),
  MIN_CONTRIBUTION_PAISE: z.coerce.number().int().positive().default(5000),
  AUTH_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
  ADMIN_USERNAME: z.string().default("admin"),
  ADMIN_PASSWORD: z.string().default("change-me"),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", z.treeifyError(parsed.error));
  throw new Error("Invalid environment variables — see logs above.");
}

export const env = parsed.data;

/** True when Razorpay is fully configured and payments can be processed. */
export const razorpayConfigured =
  env.RAZORPAY_KEY_ID !== "" &&
  env.RAZORPAY_KEY_SECRET !== "" &&
  env.RAZORPAY_WEBHOOK_SECRET !== "";
