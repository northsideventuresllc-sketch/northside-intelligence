import "server-only";

import type Stripe from "stripe";
import type { ShippingTier } from "@/lib/store/cart/types";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import { resolveCatalogLineRetailCents } from "@/lib/store/catalog/line-price";
import {
  createPaidCatalogOrder,
  findOrderByCheckoutSessionId,
  type CatalogCheckoutLine,
} from "@/lib/store/catalog-orders";
import {
  parseStoreCheckoutMetadata,
  resolveStoreCustomerEmail,
  resolveStoreShippingDetails,
  type StoreCheckoutSkipReason,
} from "@/lib/store/checkout-session";
import { sendStoreOrderConfirmationEmail } from "@/lib/store/order-confirmation-email";
import { sendMakeStoreWebhook } from "@/lib/store/make-webhook";
import { isStoreCheckoutLive } from "@/lib/store/gate";
import { markOrderFulfillmentSent } from "@/lib/store/orders";
import { createNotification } from "@/lib/notifications/service";
import { recordPromoConversion } from "@/lib/promos/email-campaigns";
import { createServiceClient } from "@/lib/supabase/server";

export interface ProcessStoreCheckoutResult {
  status: "created" | "existing" | "skipped";
  orderId?: string;
  skipReason?: StoreCheckoutSkipReason;
  fulfillmentSent?: boolean;
  confirmationEmailSent?: boolean;
}

async function buildCatalogLines(
  parsedItems: Array<{
    slug: string;
    quantity: number;
    shippingTier: ShippingTier;
    variantId?: string | null;
  }>
): Promise<CatalogCheckoutLine[]> {
  const lines: CatalogCheckoutLine[] = [];

  for (const item of parsedItems) {
    const catalog = await getCatalogProductBySlug(item.slug);
    if (!catalog) {
      throw new Error(`Product not found: ${item.slug}`);
    }

    const variantId = item.variantId?.trim() || null;
    const unitPriceCents = resolveCatalogLineRetailCents(catalog, variantId);
    lines.push({
      catalog,
      quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
      shippingTier: item.shippingTier === "expedited" ? "expedited" : "standard",
      variantId,
      unitPriceCents,
    });
  }

  return lines;
}

export async function processStoreCheckoutSession(
  session: Stripe.Checkout.Session,
  options?: { sendConfirmationEmail?: boolean }
): Promise<ProcessStoreCheckoutResult> {
  const parsed = parseStoreCheckoutMetadata(session);
  if (!parsed.ok) {
    return { status: "skipped", skipReason: parsed.reason };
  }

  const existingOrderId = await findOrderByCheckoutSessionId(session.id);
  if (existingOrderId) {
    return { status: "existing", orderId: existingOrderId };
  }

  const lines = await buildCatalogLines(parsed.items);
  const subtotalCents = lines.reduce(
    (sum, line) => sum + line.unitPriceCents * line.quantity,
    0
  );
  const totalCents = session.amount_total ?? subtotalCents + parsed.shippingChargedCents;
  const customerEmail = resolveStoreCustomerEmail(session);
  const shipping = resolveStoreShippingDetails(session);

  const orderId = await createPaidCatalogOrder({
    userId: parsed.userId,
    stripeCheckoutSessionId: session.id,
    stripePaymentIntentId:
      typeof session.payment_intent === "string" ? session.payment_intent : null,
    customerEmail,
    shipping,
    subtotalCents,
    shippingCents: parsed.shippingChargedCents,
    shippingEstimateCents: parsed.shippingEstimateCents,
    totalCents,
    currency: session.currency ?? "usd",
    lines,
  });

  let fulfillmentSent = false;
  if (isStoreCheckoutLive()) {
    const sent = await sendMakeStoreWebhook({
      orderId,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      customerEmail,
      shipping,
      totalCents,
      currency: session.currency ?? "usd",
      items: lines.map((line) => ({
        productSlug: line.catalog.slug,
        productName: line.catalog.name,
        sourcePlatform: line.catalog.sourcePlatform,
        sourceProductId: line.catalog.sourceProductId,
        cjProductId: line.catalog.sourcePlatform === "cj" ? line.catalog.sourceProductId : null,
        variantId: line.variantId,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        shippingTier: line.shippingTier,
      })),
    });

    if (sent) {
      await markOrderFulfillmentSent(orderId);
      fulfillmentSent = true;
    }
  }

  const shouldSendEmail = options?.sendConfirmationEmail !== false;
  let confirmationEmailSent = false;
  if (shouldSendEmail && customerEmail) {
    const emailResult = await sendStoreOrderConfirmationEmail({
      to: customerEmail,
      orderId,
      totalCents,
      currency: session.currency ?? "usd",
      lines: lines.map((line) => ({
        productName: line.catalog.name,
        quantity: line.quantity,
        unitPriceCents: line.unitPriceCents,
        shippingTier: line.shippingTier,
      })),
      shipping,
    });
    confirmationEmailSent = emailResult.sent;
    if (emailResult.error) {
      console.error("[store/checkout] confirmation email failed", emailResult.error);
    }
  }

  if (parsed.userId) {
    await recordPromoConversion(parsed.userId, totalCents, { orderId, source: "store" });

    const admin = createServiceClient();
    const { data: profile } = await admin
      .from("ni_portal_profiles")
      .select("email")
      .eq("id", parsed.userId)
      .maybeSingle();

    await createNotification({
      userId: parsed.userId,
      category: "store_order",
      title: "Smart Store Order Confirmed",
      body: `Your order #${orderId.slice(0, 8).toUpperCase()} has been received and is being processed.`,
      link: "/store",
      userEmail: profile?.email ?? customerEmail,
      metadata: { orderId },
      sendEmail: false,
    });
  }

  return {
    status: "created",
    orderId,
    fulfillmentSent,
    confirmationEmailSent,
  };
}
