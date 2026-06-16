import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendMakeStoreWebhook } from "@/lib/store/make-webhook";
import { createPaidStoreOrder, markOrderFulfillmentSent } from "@/lib/store/orders";
import { getStoreProductBySlug } from "@/lib/store/products";
import {
  ensureStoreStripeEnv,
  getStoreStripe,
  getStoreWebhookSecret,
} from "@/lib/store/stripe";
import { isStoreCheckoutLive } from "@/lib/store/gate";

export async function POST(req: NextRequest) {
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

  const productSlug = session.metadata.productSlug;
  const quantity = Math.max(1, Number(session.metadata.quantity) || 1);
  const userId = session.metadata.userId || null;

  if (!productSlug) {
    return NextResponse.json({ error: "Missing product metadata" }, { status: 400 });
  }

  try {
    const product = await getStoreProductBySlug(productSlug);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (product.isMock) {
      console.warn("[store/webhook] rejected mock product checkout", productSlug);
      return NextResponse.json({ error: "Mock products cannot be fulfilled" }, { status: 403 });
    }

    const orderId = await createPaidStoreOrder({
      userId: userId || null,
      stripeCheckoutSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === "string" ? session.payment_intent : null,
      customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
      shipping: (session as Stripe.Checkout.Session & { shipping_details?: unknown })
        .shipping_details as Record<string, unknown> | null,
      totalCents: session.amount_total ?? product.priceCents * quantity,
      currency: session.currency ?? product.currency,
      product,
      quantity,
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
        totalCents: session.amount_total ?? product.priceCents * quantity,
        currency: session.currency ?? product.currency,
        items: [
          {
            productSlug: product.slug,
            productName: product.name,
            cjProductId: product.cjProductId,
            quantity,
            unitPriceCents: product.priceCents,
          },
        ],
      });
      if (sent) await markOrderFulfillmentSent(orderId);
    }

    return NextResponse.json({ received: true, orderId });
  } catch (err) {
    console.error("[store/webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
