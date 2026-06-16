import "server-only";

export interface MakeStoreOrderPayload {
  orderId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string | null;
  shipping: Record<string, unknown> | null;
  totalCents: number;
  currency: string;
  items: Array<{
    productSlug: string;
    productName: string;
    cjProductId: string | null;
    quantity: number;
    unitPriceCents: number;
  }>;
}

export async function sendMakeStoreWebhook(payload: MakeStoreOrderPayload): Promise<boolean> {
  const url = process.env.MAKE_STORE_WEBHOOK_URL?.trim();
  if (!url) {
    console.warn("[store/make] MAKE_STORE_WEBHOOK_URL not configured");
    return false;
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    console.error("[store/make] webhook failed", res.status, await res.text().catch(() => ""));
    return false;
  }

  return true;
}
