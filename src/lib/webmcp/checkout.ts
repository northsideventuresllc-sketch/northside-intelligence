import { ensureBillingEnvHydrated, getBillingConfigError, getBillingStripe } from "@/lib/billing/stripe";
import type { ToolResult } from "./types";

const SITE = "https://www.northsideintelligence.com";
const MAX_META = 480; // Stripe metadata values cap at 500 chars

export type CheckoutInput = {
  tool: string;
  productName: string;
  customerEmail?: string;
  params: Record<string, unknown>;
} & ({ mode: "payment"; amountCents: number } | { mode: "subscription"; priceId: string });

/**
 * Guest Stripe Checkout for an agent's human. The Checkout Session id IS the order id;
 * the agent polls ni_order_status with it and gets the product once paid.
 */
export async function createWebmcpCheckout(input: CheckoutInput): Promise<ToolResult> {
  await ensureBillingEnvHydrated();
  const cfgErr = getBillingConfigError();
  if (cfgErr) return { status: "unavailable", message: "Checkout is temporarily unavailable." };

  const paramsJson = JSON.stringify(input.params ?? {});
  if (paramsJson.length > MAX_META) return { status: "invalid_input", message: "Parameters too large." };

  const stripe = getBillingStripe();
  const lineItem =
    input.mode === "payment"
      ? { price_data: { currency: "usd", unit_amount: input.amountCents, product_data: { name: input.productName } }, quantity: 1 }
      : { price: input.priceId, quantity: 1 };

  const session = await stripe.checkout.sessions.create({
    mode: input.mode,
    line_items: [lineItem],
    customer_email: input.customerEmail || undefined,
    success_url: `${SITE}/?webmcp_order={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE}/`,
    metadata: { source: "webmcp", tool: input.tool, params: paramsJson },
    ...(input.mode === "subscription" ? { subscription_data: { metadata: { source: "webmcp", tool: input.tool } } } : {}),
  });
  if (!session.url) return { status: "unavailable", message: "Checkout is temporarily unavailable." };

  const amount = input.mode === "payment" ? input.amountCents / 100 : (session.amount_total ?? 0) / 100;
  return {
    status: "awaiting_payment",
    checkout_url: session.url,
    order_id: session.id,
    amount_usd: amount,
    message: "Send checkout_url to the buyer. After payment, call ni_order_status with order_id to receive the result.",
  };
}
