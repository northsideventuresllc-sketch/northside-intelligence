/** Smart Store markup: 10% on supplier listing price. Supplier cost is never exposed to clients. */

export const STORE_MARKUP_RATE = 0.1;

/** Handling stipend buffer (cents) to cover packaging and supplier fulfillment variances */
export const DEFAULT_HANDLING_STIPEND_CENTS = 150;

/** Stripe card-not-present fee constants: 2.9% + $0.30 */
export const STRIPE_PERCENTAGE_FEE = 0.029;
export const STRIPE_FIXED_FEE_CENTS = 30;

export function calculateRetailPriceCents(supplierCostCents: number): number {
  return Math.round(supplierCostCents * (1 + STORE_MARKUP_RATE));
}

export function calculateMarkupCents(supplierCostCents: number): number {
  return calculateRetailPriceCents(supplierCostCents) - supplierCostCents;
}

/**
 * Calculates a customer retail price that guarantees at least a 10% net profit margin
 * after covering CJ product COGS, freight, handling stipend, and Stripe payment processing fees.
 * Formula: (Total COGS * 1.10 + Stripe Fixed Fee) / (1 - Stripe Rate)
 */
export function calculateGuaranteedRetailCents(
  supplierCostCents: number,
  shippingCents: number = 0,
  handlingStipendCents: number = DEFAULT_HANDLING_STIPEND_CENTS
): number {
  const totalCogs = supplierCostCents + shippingCents + handlingStipendCents;
  const targetNet = totalCogs * (1 + STORE_MARKUP_RATE);
  return Math.ceil((targetNet + STRIPE_FIXED_FEE_CENTS) / (1 - STRIPE_PERCENTAGE_FEE));
}

/** Estimated shipping & handling placeholder (refined with real CJ freight at checkout). */
export function estimateShippingCents(retailSubtotalCents: number): number {
  if (retailSubtotalCents < 3000) return 699;
  if (retailSubtotalCents < 8000) return 999;
  return 1499;
}

