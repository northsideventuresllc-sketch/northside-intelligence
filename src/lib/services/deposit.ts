import type Stripe from "stripe";

/**
 * Intelligence Services deposit option (JB, Decisions #1996 / #1995, 2026-09-23):
 * - Client pays in full, OR a 20% deposit with their card saved on file.
 * - The remaining 80% is charged to the saved card only when JB marks the service complete.
 * - Deposits are NON-REFUNDABLE.
 */
export const DEPOSIT_SHARE = 0.2;
export const MIN_DEPOSIT_CENTS = 5000;

/** Metadata keys shared by portal checkout, the agent storefront, the webhook and balance billing. */
export const DEPOSIT_META = {
  flag: "serviceDeposit", // "true" on every deposit checkout
  totalCents: "serviceTotalCents", // agreed total price in cents
  depositCents: "serviceDepositCents",
  balanceCents: "serviceBalanceCents",
  serviceSlug: "serviceSlug",
} as const;

export function depositCentsForTotal(totalCents: number): number {
  return Math.max(MIN_DEPOSIT_CENTS, Math.round((totalCents * DEPOSIT_SHARE) / 100) * 100);
}

export function balanceCentsFor(totalCents: number, depositCents: number): number {
  return Math.max(0, totalCents - depositCents);
}

export const DEPOSIT_TERMS_TEXT =
  "You are paying a non-refundable 20% deposit. Your card will be saved securely by Stripe, and the remaining balance will be charged to it when Northside Intelligence marks your service complete. See our Terms of Service.";

/**
 * Checkout Session params that save the card for the later balance charge.
 * Spread into stripe.checkout.sessions.create({ mode: "payment", ... }).
 */
export function depositSessionParams(input: {
  serviceSlug: string;
  totalCents: number;
  depositCents: number;
}): Pick<Stripe.Checkout.SessionCreateParams, "customer_creation" | "payment_intent_data" | "custom_text"> {
  const metadata = {
    [DEPOSIT_META.flag]: "true",
    [DEPOSIT_META.serviceSlug]: input.serviceSlug,
    [DEPOSIT_META.totalCents]: String(input.totalCents),
    [DEPOSIT_META.depositCents]: String(input.depositCents),
    [DEPOSIT_META.balanceCents]: String(balanceCentsFor(input.totalCents, input.depositCents)),
  };
  return {
    customer_creation: "always",
    payment_intent_data: { setup_future_usage: "off_session", metadata },
    custom_text: { submit: { message: DEPOSIT_TERMS_TEXT } },
  };
}
