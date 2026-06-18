/** Smart Store markup: 10% on supplier listing price. Supplier cost is never exposed to clients. */

export const STORE_MARKUP_RATE = 0.1;

export function calculateRetailPriceCents(supplierCostCents: number): number {
  return Math.round(supplierCostCents * (1 + STORE_MARKUP_RATE));
}

export function calculateMarkupCents(supplierCostCents: number): number {
  return calculateRetailPriceCents(supplierCostCents) - supplierCostCents;
}

/** Estimated shipping & handling placeholder (refined at checkout in a later phase). */
export function estimateShippingCents(retailSubtotalCents: number): number {
  if (retailSubtotalCents < 3000) return 599;
  if (retailSubtotalCents < 8000) return 899;
  return 1299;
}
