import "server-only";

import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { ensureStoreEnv } from "@/lib/store/env";
import { processStoreCheckoutSession } from "@/lib/store/process-checkout-session";
import {
  ensureStoreStripeEnv,
  getStoreStripe,
  getStoreWebhookSecret,
} from "@/lib/store/stripe";

export async function handleStoreStripeWebhook(req: NextRequest): Promise<NextResponse> {
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

  try {
    const result = await processStoreCheckoutSession(session);

    if (result.status === "skipped") {
      return NextResponse.json({ received: true, skipped: result.skipReason });
    }

    return NextResponse.json({
      received: true,
      orderId: result.orderId,
      existing: result.status === "existing",
      fulfillmentSent: result.fulfillmentSent ?? false,
      confirmationEmailSent: result.confirmationEmailSent ?? false,
    });
  } catch (err) {
    console.error("[store/webhook]", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
