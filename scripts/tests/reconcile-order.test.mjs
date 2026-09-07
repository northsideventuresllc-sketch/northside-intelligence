// NI-STORE-SHIP-OVERESTIMATE-0817 + PART13
//
// Exercises the order-reconciliation economics that
// src/lib/store/reconcile-order.ts (preflightOrderCosts / reconcileStoreOrder)
// and src/lib/store/economics.ts (computeOrderEconomics) run against a real
// order, using a fixture order that reproduces the incident: an order priced
// at the $5.99 flat-rate shipping fallback while the real CJ freight cost
// more than that, plus a healthy order priced from a real CJ quote.
//
// Run: node --test scripts/tests/*.mjs
//
// This repo has no test runner wired up yet (see AGENTS.md "KNOWN GAP - no
// test framework configured") and `node --test` on a plain .mjs file can't
// resolve this project's `@/...` TS path aliases or transpile TypeScript, so
// the economics/decision functions are re-implemented here as a deliberately
// literal, line-for-line port of the current source. Each function below
// carries the source file + line it mirrors; if those source functions
// change, this file must change with them in the same PR - it is a copy for
// executability, not an independent spec.

import assert from "node:assert/strict";
import { test } from "node:test";

// --- Mirrors src/lib/store/economics.ts (read 2026-09-07) ------------------

function estimateStripeFeeCents(amountCents) {
  return Math.round(amountCents * 0.029 + 30);
}

function targetProductProfitCents(supplierCostCents, quantity = 1) {
  const STORE_MARKUP_RATE = 0.1; // src/lib/store/pricing.ts STORE_MARKUP_RATE
  return Math.round(supplierCostCents * quantity * STORE_MARKUP_RATE);
}

function computeOrderEconomics(input) {
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

// --- Mirrors src/lib/store/pricing.ts estimateShippingCents (read 2026-09-07) --

function estimateShippingCents(productRetailCents) {
  if (productRetailCents < 3000) return 599;
  if (productRetailCents < 8000) return 899;
  return 1299;
}

// --- Mirrors reconcileStoreOrder's status decision (reconcile-order.ts:187-318) --

function decideReconciliation(economics) {
  if (economics.refundCents > 0) return "refunded";
  if (economics.chargeCents > 0) return "charged"; // assumes a saved payment method
  return "balanced";
}

// --- Mirrors reconcile-order.ts:preflightOrderCosts' shipping_source write --

function shippingSourceColumnValue(quoteSource) {
  return quoteSource === "fallback" ? "fallback_flat_rate" : "cj";
}

// --- Fixture orders ----------------------------------------------------

// calculateRetailPriceCents (pricing.ts:5-7): retail = round(supplierCost * 1.1).
// A $7.00 supplier cost item retails at $7.70 - a thin, realistic 70c markup,
// which is what makes an underpriced shipping stipend actually bite: there's
// no fat margin elsewhere to silently absorb it.
const SUPPLIER_COST_CENTS = 700;
const PRODUCT_RETAIL_CENTS = 770;

/**
 * The incident order: a single CJ-sourced product. quoteCartShipping()
 * silently fell back to the $5.99 flat-rate placeholder at checkout
 * (NI-STORE-SHIP-OVERESTIMATE-0817) instead of pricing real CJ freight, so
 * the customer was charged $5.99 shipping stipend. Real CJ freight, learned
 * post-fulfillment, was $9.40.
 */
const fallbackIncidentOrder = {
  productRetailCents: PRODUCT_RETAIL_CENTS,
  supplierCostCents: SUPPLIER_COST_CENTS,
  shippingStipendChargedCents: 599, // what the customer actually paid - the bug
  cjProductCostCents: SUPPLIER_COST_CENTS,
  realCjPostageCents: 940, // what CJ freight actually cost at fulfillment
  customerPaidCents: PRODUCT_RETAIL_CENTS + 599,
};

/** A healthy order where quoteCartShipping() got a real CJ freight quote up front. */
const healthyOrder = {
  productRetailCents: PRODUCT_RETAIL_CENTS,
  supplierCostCents: SUPPLIER_COST_CENTS,
  cjFreightCents: 620,
  cjProductCostCents: SUPPLIER_COST_CENTS,
};

test("fallback flat-rate order undercharges shipping and reconcile charges the shortfall", () => {
  const preflight = computeOrderEconomics({
    customerPaidCents: fallbackIncidentOrder.customerPaidCents,
    productRetailCents: fallbackIncidentOrder.productRetailCents,
    supplierCostCents: fallbackIncidentOrder.supplierCostCents,
    shippingStipendChargedCents: fallbackIncidentOrder.shippingStipendChargedCents,
    cjProductCostCents: fallbackIncidentOrder.cjProductCostCents,
    // Real CJ postage, discovered post-fulfillment - this is what preflightOrderCosts()
    // uses once the CJ order confirms actual freight (reconcile-order.ts:96-100).
    cjPostageCents: fallbackIncidentOrder.realCjPostageCents,
  });

  // The $5.99 fallback stipend did not cover the real $9.40 freight plus the
  // required product margin - reconcile must charge the shortfall, not
  // silently mark the order balanced. (Verified: surplus = -411c here.)
  assert.equal(preflight.chargeCents > 0, true, "expected a shortfall charge on the fallback order");
  assert.equal(decideReconciliation(preflight), "charged");
  assert.equal(shippingSourceColumnValue("fallback"), "fallback_flat_rate");
});

test("healthy CJ-quoted order needs no shortfall charge and is tagged shipping_source=cj", () => {
  // Checkout charged a stipend sized to the real CJ quote plus buffer (economics.ts
  // shippingStipendFromFreightCents: ceil(cjFreight * 1.3), floor 599).
  const bufferedStipendCents = Math.max(599, Math.ceil(healthyOrder.cjFreightCents * 1.3));

  const preflight = computeOrderEconomics({
    customerPaidCents: healthyOrder.productRetailCents + bufferedStipendCents,
    productRetailCents: healthyOrder.productRetailCents,
    supplierCostCents: healthyOrder.supplierCostCents,
    shippingStipendChargedCents: bufferedStipendCents,
    cjProductCostCents: healthyOrder.cjProductCostCents,
    cjPostageCents: healthyOrder.cjFreightCents,
  });

  // The buffer is deliberately generous, so this settles as a small refund,
  // never a shortfall charge - the opposite of the fallback-order case above.
  assert.equal(preflight.chargeCents, 0, "a real CJ quote plus buffer should never need a shortfall charge");
  assert.equal(decideReconciliation(preflight), "refunded");
  assert.equal(shippingSourceColumnValue("cj"), "cj");
});

test("estimateShippingCents fallback tiers match pricing.ts", () => {
  assert.equal(estimateShippingCents(1000), 599);
  assert.equal(estimateShippingCents(4000), 899);
  assert.equal(estimateShippingCents(9000), 1299);
});

test("reconcile skips orders already balanced/refunded/charged (idempotency guard)", () => {
  // Mirrors reconcile-order.ts:144-151 - reconcileStoreOrder returns "skipped"
  // without re-running preflight/economics for a settled order, so a retry
  // (e.g. the fulfillment webhook firing twice) never double-charges.
  function shouldSkip(reconciliationStatus, resendNotification) {
    return (
      !resendNotification &&
      (reconciliationStatus === "balanced" ||
        reconciliationStatus === "refunded" ||
        reconciliationStatus === "charged")
    );
  }

  assert.equal(shouldSkip("balanced", false), true);
  assert.equal(shouldSkip("charged", false), true);
  assert.equal(shouldSkip("pending", false), false);
  assert.equal(shouldSkip("charged", true), false);
});
