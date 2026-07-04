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
    sourcePlatform: string;
    sourceProductId: string | null;
    /** @deprecated Use sourcePlatform + sourceProductId. Kept for existing Make scenarios. */
    cjProductId: string | null;
    quantity: number;
    unitPriceCents: number;
    variantId: string | null;
    cjVariantId?: string | null;
    cj_variant_id?: string | null;
    shippingTier?: string;
  }>;
}

import { isPlaceholderMakeStoreWebhookUrl } from "@/lib/store/gate";

export async function sendMakeStoreWebhook(payload: MakeStoreOrderPayload): Promise<boolean> {
  const webhookUrl = process.env.MAKE_STORE_WEBHOOK_URL?.trim();
  if (!webhookUrl || isPlaceholderMakeStoreWebhookUrl(webhookUrl)) {
    console.warn("[store/make] MAKE_STORE_WEBHOOK_URL not configured");
    return false;
  }

  const res = await fetch(webhookUrl, {
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
