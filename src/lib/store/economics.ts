import {
  DEFAULT_HANDLING_STIPEND_CENTS,
  STORE_MARKUP_RATE,
  STRIPE_FIXED_FEE_CENTS,
  STRIPE_PERCENTAGE_FEE,
} from "@/lib/store/pricing";

/** Buffer over CJ freight so checkout stipend exceeds expected carrier cost. */
export const SHIPPING_STIPEND_BUFFER_RATE = 0.3;

/** Stripe card-not-present estimate: 2.9% + $0.30 (USD). */
export function estimateStripeFeeCents(amountCents: number): number {
  return Math.round(amountCents * STRIPE_PERCENTAGE_FEE + STRIPE_FIXED_FEE_CENTS);
}

export function targetProductProfitCents(supplierCostCents: number, quantity = 1): number {
  return Math.round(supplierCostCents * quantity * STORE_MARKUP_RATE);
}

export function shippingStipendFromFreightCents(
  cjFreightCents: number,
  options?: { expeditedPremiumCents?: number; handlingStipendCents?: number }
): number {
  const buffered = Math.ceil(cjFreightCents * (1 + SHIPPING_STIPEND_BUFFER_RATE));
  const handling = options?.handlingStipendCents ?? DEFAULT_HANDLING_STIPEND_CENTS;
  const premium = options?.expeditedPremiumCents ?? 0;
  return Math.max(699, buffered + handling + premium);
}

export interface OrderEconomicsInput {
  customerPaidCents: number;
  productRetailCents: number;
  supplierCostCents: number;
  shippingStipendChargedCents: number;
  cjProductCostCents: number;
  cjPostageCents: number;
  handlingStipendCents?: number;
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
 * Ensures the order achieves at least 10% net margin after CJ costs and Stripe fees.
 * Positive surplus → refund customer. Negative → charge card on file.
 */
export function computeOrderEconomics(input: OrderEconomicsInput): OrderEconomicsResult {
  const stripeFeeCents = input.stripeFeeCents ?? estimateStripeFeeCents(input.customerPaidCents);
  const handlingCents = input.handlingStipendCents ?? DEFAULT_HANDLING_STIPEND_CENTS;
  // Total COGS includes CJ product cost, actual CJ postage, and minimum handling
  const totalCogs = input.cjProductCostCents + input.cjPostageCents + handlingCents;
  // Net profit target is 10% of total fulfillment COGS (or supplier cost minimum)
  const targetProfitCents = Math.max(
    Math.round(totalCogs * STORE_MARKUP_RATE),
    targetProductProfitCents(input.supplierCostCents)
  );
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
 * When preflight shows the shipping stipend is too low to cover costs + guaranteed 10% net profit,
 * compute the minimum additional shipping stipend needed at checkout.
 */
export function minimumShippingStipendCents(input: {
  supplierCostCents: number;
  productRetailCents: number;
  cjFreightCents: number;
  expeditedPremiumCents?: number;
  handlingStipendCents?: number;
}): number {
  const handling = input.handlingStipendCents ?? DEFAULT_HANDLING_STIPEND_CENTS;
  const base = shippingStipendFromFreightCents(input.cjFreightCents, {
    expeditedPremiumCents: input.expeditedPremiumCents,
    handlingStipendCents: handling,
  });

  // Calculate required gross revenue for guaranteed 10% net margin across the entire order
  const totalCogs = input.supplierCostCents + input.cjFreightCents + handling;
  const targetNetProfit = Math.round(totalCogs * STORE_MARKUP_RATE);
  const totalRequiredBeforeStripe = totalCogs + targetNetProfit;
  
  // Gross up required revenue to cover Stripe 2.9% + $0.30
  const grossRequiredTotal = Math.ceil(
    (totalRequiredBeforeStripe + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENTAGE_FEE)
  );

  const minStipend = Math.max(0, grossRequiredTotal - input.productRetailCents);
  return Math.max(base, Math.ceil(minStipend));
}

