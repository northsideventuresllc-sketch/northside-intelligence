import { STORE_MARKUP_RATE } from "@/lib/store/pricing";

/** Buffer over CJ freight so checkout stipend exceeds expected carrier cost. */
export const SHIPPING_STIPEND_BUFFER_RATE = 0.3;

/** Stripe card-not-present estimate: 2.9% + $0.30 (USD). */
export function estimateStripeFeeCents(amountCents: number): number {
  return Math.round(amountCents * 0.029 + 30);
}

export function targetProductProfitCents(supplierCostCents: number, quantity = 1): number {
  return Math.round(supplierCostCents * quantity * STORE_MARKUP_RATE);
}

export function shippingStipendFromFreightCents(
  cjFreightCents: number,
  options?: { expeditedPremiumCents?: number }
): number {
  const buffered = Math.ceil(cjFreightCents * (1 + SHIPPING_STIPEND_BUFFER_RATE));
  const premium = options?.expeditedPremiumCents ?? 0;
  return Math.max(599, buffered + premium);
}

export interface OrderEconomicsInput {
  customerPaidCents: number;
  productRetailCents: number;
  supplierCostCents: number;
  shippingStipendChargedCents: number;
  cjProductCostCents: number;
  cjPostageCents: number;
  stripeFeeCents?: number;
}

export interface OrderEconomicsResult {
  targetProfitCents: number;
  markupCollectedCents: number;
  stripeFeeCents: number;
  totalCostCents: number;
  surplusCents: number;
  refundCents: number;
  chargeCents: number;
}

/**
 * Compute post-fulfillment surplus relative to required product margin.
 * Positive surplus → refund customer. Negative → charge card on file.
 */
export function computeOrderEconomics(input: OrderEconomicsInput): OrderEconomicsResult {
  const stripeFeeCents = input.stripeFeeCents ?? estimateStripeFeeCents(input.customerPaidCents);
  const targetProfitCents = targetProductProfitCents(input.supplierCostCents);
  const markupCollectedCents = input.productRetailCents - input.supplierCostCents;
  const totalCostCents = input.cjProductCostCents + input.cjPostageCents + stripeFeeCents;
  const requiredRevenueCents = totalCostCents + targetProfitCents;
  const surplusCents = input.customerPaidCents - requiredRevenueCents;

  return {
    targetProfitCents,
    markupCollectedCents,
    stripeFeeCents,
    totalCostCents,
    surplusCents,
    refundCents: surplusCents > 0 ? surplusCents : 0,
    chargeCents: surplusCents < 0 ? Math.abs(surplusCents) : 0,
  };
}

/**
 * When preflight shows the shipping stipend is too low to cover costs + margin,
 * compute the minimum additional shipping stipend needed at checkout.
 */
export function minimumShippingStipendCents(input: {
  supplierCostCents: number;
  productRetailCents: number;
  cjFreightCents: number;
  expeditedPremiumCents?: number;
}): number {
  const base = shippingStipendFromFreightCents(input.cjFreightCents, {
    expeditedPremiumCents: input.expeditedPremiumCents,
  });
  const estimatedTotal = input.productRetailCents + base;
  const stripeFee = estimateStripeFeeCents(estimatedTotal);
  const targetProfit = targetProductProfitCents(input.supplierCostCents);
  const productCost = input.supplierCostCents;
  const minStipend = Math.max(
    0,
    productCost + input.cjFreightCents + stripeFee + targetProfit - input.productRetailCents
  );
  return Math.max(base, Math.ceil(minStipend));
}
