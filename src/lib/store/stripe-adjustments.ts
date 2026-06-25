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

/**
 * Legacy guest checkouts may have a payment method but no Stripe Customer.
 * Create a customer and attach the PM so off-session charges can run.
 */
export async function ensureStripeCustomerForOffSession(input: {
  customerId: string | null;
  paymentMethodId: string | null;
  email: string | null;
  orderId: string;
}): Promise<{ customerId: string; paymentMethodId: string }> {
  if (input.customerId && input.paymentMethodId) {
    return { customerId: input.customerId, paymentMethodId: input.paymentMethodId };
  }
  if (!input.paymentMethodId) {
    throw new Error("No payment method available for off-session charge");
  }

  const stripe = getStoreStripe();
  let customerId = input.customerId;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: input.email ?? undefined,
      metadata: { orderId: input.orderId, source: "store_reconcile_backfill" },
    });
    customerId = customer.id;
  }

  try {
    await stripe.paymentMethods.attach(input.paymentMethodId, { customer: customerId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "attach failed";
    if (!message.includes("already been attached")) throw err;
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: input.paymentMethodId },
  });

  return { customerId, paymentMethodId: input.paymentMethodId };
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
