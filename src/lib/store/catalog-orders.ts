import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { resolveCatalogLineSupplierCents } from "@/lib/store/catalog/line-price";
import type { CatalogProductRow } from "@/lib/store/catalog/products";
import type { ShippingTier } from "@/lib/store/cart/types";

export interface CatalogCheckoutLine {
  catalog: CatalogProductRow;
  quantity: number;
  shippingTier: ShippingTier;
  variantId: string | null;
  unitPriceCents: number;
}

export interface CreateCatalogOrderInput {
  userId: string | null;
  guestCheckout?: boolean;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string | null;
  shipping: Record<string, unknown> | null;
  subtotalCents: number;
  shippingCents: number;
  shippingEstimateCents: number;
  shippingStipendCents?: number;
  supplierCostCents?: number;
  totalCents: number;
  currency: string;
  lines: CatalogCheckoutLine[];
}

export async function findOrderByCheckoutSessionId(
  stripeCheckoutSessionId: string
): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_orders")
    .select("id")
    .eq("stripe_checkout_session_id", stripeCheckoutSessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data?.id ? String(data.id) : null;
}

export async function createPaidCatalogOrder(input: CreateCatalogOrderInput): Promise<string> {
  const supabase = createServiceClient();

  const supplierCostCents =
    input.supplierCostCents ??
    input.lines.reduce(
      (sum, line) =>
        sum + resolveCatalogLineSupplierCents(line.catalog, line.variantId) * line.quantity,
      0
    );

  const { data: order, error: orderError } = await supabase
    .from("ni_store_orders")
    .insert({
      user_id: input.userId,
      guest_checkout: input.guestCheckout ?? !input.userId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      status: "paid",
      customer_email: input.customerEmail,
      shipping: input.shipping,
      subtotal_cents: input.subtotalCents,
      shipping_charged_cents: input.shippingCents,
      shipping_stipend_cents: input.shippingStipendCents ?? input.shippingCents,
      supplier_cost_cents: supplierCostCents,
      total_cents: input.totalCents,
      currency: input.currency,
      reconciliation_status: "pending",
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order");

  const rows = input.lines.map((line) => ({
    order_id: order.id,
    catalog_id: line.catalog.id,
    product_slug: line.catalog.slug,
    product_name: line.catalog.name,
    source_product_id: line.catalog.sourceProductId,
    variant_id: line.variantId,
    quantity: line.quantity,
    unit_price_cents: line.unitPriceCents,
    supplier_cost_cents: resolveCatalogLineSupplierCents(line.catalog, line.variantId),
    shipping_tier: line.shippingTier,
  }));

  const { error: itemError } = await supabase.from("ni_store_order_items").insert(rows);
  if (itemError) throw new Error(itemError.message);

  return order.id as string;
}
