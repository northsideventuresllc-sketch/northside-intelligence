import "server-only";

import type Stripe from "stripe";
import { getStoreStripe } from "@/lib/store/stripe";

export async function retrieveCheckoutPaymentDetails(
  session: Stripe.Checkout.Session
): Promise<{
  customerId: string | null;
  paymentMethodId: string | null;
  paymentIntentId: string | null;
}> {
  const stripe = getStoreStripe();
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : null;
  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer && typeof session.customer === "object"
        ? session.customer.id
        : null;

  if (!paymentIntentId) {
    return { customerId, paymentMethodId: null, paymentIntentId: null };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  const paymentMethodId =
    typeof paymentIntent.payment_method === "string"
      ? paymentIntent.payment_method
      : paymentIntent.payment_method?.id ?? null;

  return { customerId, paymentMethodId, paymentIntentId };
}

export async function refundStoreOrderSurplus(input: {
  paymentIntentId: string;
  amountCents: number;
  orderId: string;
}): Promise<{ ok: boolean; refundId?: string; error?: string }> {
  if (input.amountCents <= 0) return { ok: true };

  try {
    const stripe = getStoreStripe();
    const refund = await stripe.refunds.create({
      payment_intent: input.paymentIntentId,
      amount: input.amountCents,
      metadata: { orderId: input.orderId, reason: "shipping_reconciliation_refund" },
    });
    return { ok: true, refundId: refund.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Refund failed";
    return { ok: false, error: message };
  }
}

export async function chargeStoreOrderShortfall(input: {
  customerId: string;
  paymentMethodId: string;
  amountCents: number;
  orderId: string;
  currency?: string;
}): Promise<{ ok: boolean; paymentIntentId?: string; error?: string }> {
  if (input.amountCents <= 0) return { ok: true };

  try {
    const stripe = getStoreStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: input.amountCents,
      currency: input.currency ?? "usd",
      customer: input.customerId,
      payment_method: input.paymentMethodId,
      off_session: true,
      confirm: true,
      metadata: {
        orderId: input.orderId,
        reason: "shipping_reconciliation_charge",
      },
    });
    if (paymentIntent.status === "succeeded") {
      return { ok: true, paymentIntentId: paymentIntent.id };
    }
    return { ok: false, error: `Payment status: ${paymentIntent.status}` };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Charge failed";
    return { ok: false, error: message };
  }
}
