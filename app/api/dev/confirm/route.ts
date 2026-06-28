import type { NextRequest } from "next/server";
import { razorpayConfigured } from "@/lib/env";
import { finalizePaidDonation } from "@/server/positions";

export const dynamic = "force-dynamic";

/**
 * DEV-ONLY payment simulation. Lets the full donate flow be tested without real
 * Razorpay keys. Hard-disabled in production and whenever real keys are present.
 */
export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production" || razorpayConfigured) {
    return Response.json({ error: "Not available." }, { status: 403 });
  }

  let body: { orderId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }
  if (!body.orderId) {
    return Response.json({ error: "orderId required." }, { status: 400 });
  }

  const result = await finalizePaidDonation(body.orderId, `sim_pay_${Date.now()}`, null);
  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 409 });
  }
  return Response.json({ ok: true });
}
