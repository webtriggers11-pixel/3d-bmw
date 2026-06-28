import type { NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { finalizePaidDonation } from "@/server/positions";

export const dynamic = "force-dynamic";

/**
 * Razorpay webhook — the SOURCE OF TRUTH for payment success. We verify the
 * signature against the raw body before allocating anything. Never trust the
 * browser callback.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(raw, signature)) {
    return Response.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: {
    event?: string;
    payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
  };
  try {
    event = JSON.parse(raw);
  } catch {
    return Response.json({ error: "Invalid payload." }, { status: 400 });
  }

  // Allocate on capture/authorization.
  if (event.event === "payment.captured" || event.event === "payment.authorized") {
    const entity = event.payload?.payment?.entity;
    const orderId = entity?.order_id;
    const paymentId = entity?.id;
    if (orderId && paymentId) {
      await finalizePaidDonation(orderId, paymentId, signature);
    }
  }

  // Always 200 so Razorpay stops retrying once received.
  return Response.json({ received: true });
}
