import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import type { ShippingTier } from "@/lib/store/cart/types";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import { createPaidCatalogOrder, type CatalogCheckoutLine } from "@/lib/store/catalog-orders";
import { sendMakeStoreWebhook } from "@/lib/store/make-webhook";
import { isStoreCheckoutLive } from "@/lib/store/gate";
import { ensureStoreEnv } from "@/lib/store/env";
import {
  ensureStoreStripeEnv,
  getStoreStripe,
  getStoreWebhookSecret,
} from "@/lib/store/stripe";

export async function POST(req: NextRequest) {
  await ensureStoreEnv();
  await ensureStoreStripeEnv();

  const secret = getStoreWebhookSecret();
  if (!secret) {
    return NextResponse.json({ error: "Store webhook not configured" }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "No signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = getStoreStripe().webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.metadata?.storeCheckout !== "true") {
    return NextResponse.json({ received: true, skipped: "not_store_checkout" });
  }

  if (session.metadata.catalogCheckout !== "true") {
    return NextResponse.json({ received: true, skipped: "legacy_checkout_disabled" });
  }

  const userId = session.metadata.userId || null;
  const itemsJson = session.metadata.itemsJson;

  if (!itemsJson) {
    return NextResponse.json({ error: "Missing cart metadata" }, { status: 400 });
  }

  let parsedItems: Array<{ slug: string; quantity: number; shippingTier: ShippingTier }>;
  try {
    parsedItems = JSON.parse(itemsJson) as Array<{
      slug: string;
      quantity: number;
      shippingTier: ShippingTier;
    }>;
  } catch {
    return NextResponse.json({ error: "Invalid cart metadata" }, { status: 400 });
  }

  try {
    const lines: CatalogCheckoutLine[] = [];
    for (const item of parsedItems) {
      const catalog = await getCatalogProductBySlug(item.slug);
      if (!catalog) {
        return NextResponse.json({ error: `Product not found: ${item.slug}` }, { status: 404 });
      }
      lines.push({
        catalog,
        quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
        shippingTier: item.shippingTier === "expedited" ? "expedited" : "standard",
      });
    }

    const subtotalCents = lines.reduce(
      (sum, line) => sum + line.catalog.retailPriceCents * line.quantity,
      0
    );
    const shippingChargedCents = Number(session.metadata.shippingChargedCents) || 0;
    const shippingEstimateCents =
      Number(session.metadata.shippingEstimateCents) || shippingChargedCents;

    const orderId = await createPaidCatalogOrder({
      userId: userId || null,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      shipping: (session as Stripe.Checkout.Session & { shipping_details?: unknown })
        .shipping_details as Record<string, unknown> | null,
      subtotalCents,
      shippingCents: shippingChargedCents,
      shippingEstimateCents,
      totalCents: session.amount_total ?? subtotalCents + shippingChargedCents,
      currency: session.currency ?? "usd",
      lines,
    });

    if (isStoreCheckoutLive()) {
      const sent = await sendMakeStoreWebhook({
        orderId,
        stripeCheckoutSessionId: session.id,
        stripePaymentIntentId:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
        customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
        shipping: (session as Stripe.Checkout.Session & { shipping_details?: unknown })
          .shipping_details as Record<string, unknown> | null,
        totalCents: session.amount_total ?? subtotalCents + shippingChargedCents,
        currency: session.currency ?? "usd",
        items: lines.map((line) => ({
          productSlug: line.catalog.slug,
          productName: line.catalog.name,
          cjProductId:
            line.catalog.sourcePlatform === "cj" ? line.catalog.sourceProductId : null,
          quantity: line.quantity,
          unitPriceCents: line.catalog.retailPriceCents,
          shippingTier: line.shippingTier,
        })),
      });
      if (sent) {
        const { markOrderFulfillmentSent } = await import("@/lib/store/orders");
        await markOrderFulfillmentSent(orderId);
      }
    }

    return NextResponse.json({ received: true, orderId });
  } catch (err) {
    console.error("[store/webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
