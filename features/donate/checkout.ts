// Razorpay browser checkout helpers.

export interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  simulate: boolean;
  size: string;
}

declare global {
  interface Window {
    // Razorpay checkout global injected by the script below.
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

let scriptPromise: Promise<boolean> | null = null;

/** Inject the Razorpay checkout script once. */
export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
  return scriptPromise;
}

/** Open the Razorpay checkout for a created order. */
export async function openRazorpayCheckout(
  order: CreateOrderResponse,
  opts: { donorName: string; onSuccess: () => void; onDismiss: () => void },
): Promise<void> {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) {
    throw new Error("Could not load the payment widget.");
  }

  const rzp = new window.Razorpay({
    key: order.keyId,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: "Name on the Car",
    description: "Add your name to the car",
    prefill: { name: opts.donorName },
    theme: { color: "#111111" },
    // Allocation happens server-side via the verified webhook; the handler just
    // signals the UI. SSE will surface the new name.
    handler: () => opts.onSuccess(),
    modal: { ondismiss: () => opts.onDismiss() },
  });
  rzp.open();
}

/** Dev-only: simulate a successful payment (no real Razorpay keys needed). */
export async function simulatePayment(orderId: string): Promise<void> {
  const res = await fetch("/api/dev/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? "Simulated payment failed.");
  }
}
