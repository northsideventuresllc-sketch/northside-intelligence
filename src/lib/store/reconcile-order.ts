import "server-only";

import type Stripe from "stripe";
import { computeOrderEconomics, estimateStripeFeeCents } from "@/lib/store/economics";
import {
  sendStoreFulfillmentActionEmail,
  sendStoreShippingAdjustmentChargeEmail,
  sendStoreShippingAdjustmentRefundEmail,
} from "@/lib/store/order-emails";
import { getStoreOrderById } from "@/lib/store/orders";
import { createServiceClient } from "@/lib/supabase/server";
import {
  chargeStoreOrderShortfall,
  refundStoreOrderSurplus,
  retrieveCheckoutPaymentDetails,
} from "@/lib/store/stripe-adjustments";
import { quoteCartShipping, type ShippingQuoteLine } from "@/lib/store/shipping-quote";
import { resolveCatalogLineSupplierCents } from "@/lib/store/catalog/line-price";
import { getCatalogProductBySlug } from "@/lib/store/catalog/products";
import type { ShippingTier } from "@/lib/store/cart/types";

export interface PreflightCostEstimate {
  cjProductCostCents: number;
  cjPostageCents: number;
  stripeFeeCents: number;
  supplierCostCents: number;
  productRetailCents: number;
  customerPaidCents: number;
  shippingStipendChargedCents: number;
  projectedSurplusCents: number;
  projectedChargeCents: number;
}

export interface ReconcileOrderResult {
  orderId: string;
  status: "balanced" | "refunded" | "charged" | "failed_charge" | "skipped";
  refundCents: number;
  chargeCents: number;
  error: string | null;
}

function parseCountryCode(shipping: Record<string, unknown> | null): string {
  const address =
    shipping?.address && typeof shipping.address === "object"
      ? (shipping.address as Record<string, unknown>)
      : null;
  const country = address?.country;
  return typeof country === "string" && country.trim() ? country.trim().toUpperCase() : "US";
}

async function buildQuoteLines(
  order: NonNullable<Awaited<ReturnType<typeof getStoreOrderById>>>
): Promise<ShippingQuoteLine[]> {
  const lines: ShippingQuoteLine[] = [];
  for (const item of order.items) {
    const slug = item.productSlug?.trim();
    if (!slug) continue;
    const catalog = await getCatalogProductBySlug(slug);
    if (!catalog) continue;
    lines.push({
      catalog,
      quantity: item.quantity,
      shippingTier: (item.shippingTier === "expedited" ? "expedited" : "standard") as ShippingTier,
      variantId: item.variantId,
      unitRetailCents: item.unitPriceCents,
    });
  }
  return lines;
}

export async function preflightOrderCosts(
  orderId: string,
  overrides?: { cjProductCostCents?: number; cjPostageCents?: number }
): Promise<PreflightCostEstimate | null> {
  const order = await getStoreOrderById(orderId);
  if (!order) return null;

  const quoteLines = await buildQuoteLines(order);
  const country = parseCountryCode(order.shipping);
  const quote = await quoteCartShipping(quoteLines, country);

  let supplierCostCents = 0;
  let productRetailCents = 0;
  for (const line of quoteLines) {
    supplierCostCents +=
      resolveCatalogLineSupplierCents(line.catalog, line.variantId) * line.quantity;
    productRetailCents += line.unitRetailCents * line.quantity;
  }

  const shippingStipendChargedCents =
    order.shippingChargedCents ?? quote.shippingStipendCents;
  const customerPaidCents = order.totalCents;
  const cjPostageCents =
    overrides?.cjPostageCents ??
    order.cjPostageCents ??
    quote.cjFreightCents ??
    quote.shippingEstimateCents;
  const cjProductCostCents = overrides?.cjProductCostCents ?? order.cjProductCostCents ?? supplierCostCents;
  const stripeFeeCents = order.stripeFeeCents ?? estimateStripeFeeCents(customerPaidCents);

  const economics = computeOrderEconomics({
    customerPaidCents,
    productRetailCents,
    supplierCostCents,
    shippingStipendChargedCents,
    cjProductCostCents,
    cjPostageCents,
    stripeFeeCents,
  });

  return {
    cjProductCostCents,
    cjPostageCents,
    stripeFeeCents,
    supplierCostCents,
    productRetailCents,
    customerPaidCents,
    shippingStipendChargedCents,
    projectedSurplusCents: economics.surplusCents,
    projectedChargeCents: economics.chargeCents,
  };
}

export async function reconcileStoreOrder(
  orderId: string,
  options?: {
    cjProductCostCents?: number;
    cjPostageCents?: number;
    chargeFailureEmailOverride?: string;
    skipEmails?: boolean;
  }
): Promise<ReconcileOrderResult> {
  const order = await getStoreOrderById(orderId);
  if (!order) {
    return { orderId, status: "skipped", refundCents: 0, chargeCents: 0, error: "Order not found" };
  }

  if (order.reconciliationStatus === "balanced" || order.reconciliationStatus === "refunded" || order.reconciliationStatus === "charged") {
    return { orderId, status: "skipped", refundCents: 0, chargeCents: 0, error: null };
  }

  const preflight = await preflightOrderCosts(orderId, {
    cjProductCostCents: options?.cjProductCostCents,
    cjPostageCents: options?.cjPostageCents,
  });
  if (!preflight) {
    return { orderId, status: "skipped", refundCents: 0, chargeCents: 0, error: "Preflight failed" };
  }

  const economics = computeOrderEconomics({
    customerPaidCents: preflight.customerPaidCents,
    productRetailCents: preflight.productRetailCents,
    supplierCostCents: preflight.supplierCostCents,
    shippingStipendChargedCents: preflight.shippingStipendChargedCents,
    cjProductCostCents: preflight.cjProductCostCents,
    cjPostageCents: preflight.cjPostageCents,
    stripeFeeCents: preflight.stripeFeeCents,
  });

  const supabase = createServiceClient();
  const now = new Date().toISOString();
  let status: ReconcileOrderResult["status"] = "balanced";
  let error: string | null = null;

  await supabase
    .from("ni_store_orders")
    .update({
      supplier_cost_cents: preflight.supplierCostCents,
      cj_product_cost_cents: preflight.cjProductCostCents,
      cj_postage_cents: preflight.cjPostageCents,
      stripe_fee_cents: preflight.stripeFeeCents,
      target_profit_cents: economics.targetProfitCents,
      actual_profit_cents: economics.surplusCents >= 0 ? economics.targetProfitCents : 0,
      updated_at: now,
    })
    .eq("id", orderId);

  if (economics.refundCents > 0 && order.stripePaymentIntentId) {
    const refund = await refundStoreOrderSurplus({
      paymentIntentId: order.stripePaymentIntentId,
      amountCents: economics.refundCents,
      orderId,
    });
    if (refund.ok) {
      status = "refunded";
      if (!options?.skipEmails && order.customerEmail) {
        await sendStoreShippingAdjustmentRefundEmail({
          to: order.customerEmail,
          orderId,
          amountCents: economics.refundCents,
          currency: order.currency,
        });
      }
    } else {
      status = "failed_charge";
      error = refund.error ?? "Refund failed";
    }
  } else if (economics.chargeCents > 0) {
    if (order.stripeCustomerId && order.stripePaymentMethodId) {
      const charge = await chargeStoreOrderShortfall({
        customerId: order.stripeCustomerId,
        paymentMethodId: order.stripePaymentMethodId,
        amountCents: economics.chargeCents,
        orderId,
        currency: order.currency,
      });
      if (charge.ok) {
        status = "charged";
        if (!options?.skipEmails && order.customerEmail) {
          await sendStoreShippingAdjustmentChargeEmail({
            to: order.customerEmail,
            orderId,
            amountCents: economics.chargeCents,
            currency: order.currency,
          });
        }
      } else {
        status = "failed_charge";
        error = charge.error ?? "Charge failed";
        const failureNotifyEmail =
          options?.chargeFailureEmailOverride ?? order.customerEmail;
        if (failureNotifyEmail) {
          await sendStoreFulfillmentActionEmail({
            to: failureNotifyEmail,
            orderId,
            reason: `We could not process an additional shipping and handling charge of $${(economics.chargeCents / 100).toFixed(2)}. Please complete payment within 72 hours.`,
          });
        }
        await supabase
          .from("ni_store_orders")
          .update({
            status: "failed",
            reconciliation_status: "failed_charge",
            fulfillment_action_required_at: now,
            fulfillment_deadline_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
            updated_at: now,
          })
          .eq("id", orderId);
      }
    } else {
      status = "failed_charge";
      error = "No saved payment method for shortfall charge";
      const failureNotifyEmail = options?.chargeFailureEmailOverride ?? order.customerEmail;
      if (failureNotifyEmail) {
        await sendStoreFulfillmentActionEmail({
          to: failureNotifyEmail,
          orderId,
          reason: `Additional shipping and handling of $${(economics.chargeCents / 100).toFixed(2)} is required. Please complete payment within 72 hours.`,
        });
      }
      await supabase
        .from("ni_store_orders")
        .update({
          status: "failed",
          reconciliation_status: "failed_charge",
          fulfillment_action_required_at: now,
          fulfillment_deadline_at: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          updated_at: now,
        })
        .eq("id", orderId);
    }
  }

  await supabase
    .from("ni_store_orders")
    .update({
      reconciliation_status: status,
      reconciliation_adjustment_cents:
        economics.refundCents > 0 ? -economics.refundCents : economics.chargeCents,
      reconciliation_completed_at: now,
      updated_at: now,
    })
    .eq("id", orderId);

  return {
    orderId,
    status,
    refundCents: economics.refundCents,
    chargeCents: economics.chargeCents,
    error,
  };
}

export async function persistCheckoutPaymentDetails(
  orderId: string,
  session: Stripe.Checkout.Session
): Promise<void> {
  const details = await retrieveCheckoutPaymentDetails(session);
  const supabase = createServiceClient();
  await supabase
    .from("ni_store_orders")
    .update({
      stripe_customer_id: details.customerId,
      stripe_payment_method_id: details.paymentMethodId,
      stripe_payment_intent_id: details.paymentIntentId ?? undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
}

export async function markFulfillmentActionRequired(
  orderId: string,
  customerEmail: string | null,
  reason: string
): Promise<void> {
  const supabase = createServiceClient();
  const deadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("ni_store_orders")
    .update({
      status: "failed",
      reconciliation_status: "action_required",
      fulfillment_action_required_at: new Date().toISOString(),
      fulfillment_deadline_at: deadline,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (customerEmail) {
    await sendStoreFulfillmentActionEmail({ to: customerEmail, orderId, reason });
  }
}
