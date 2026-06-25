import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { StoreProduct } from "@/lib/store/products";
import {
  buildStoreOrderTrackUrl,
  resolveOrderTrackingUrl,
  type StoreOrderStatus,
} from "@/lib/store/tracking";
import { formatOrderReference } from "@/lib/store/checkout-session";
import { sendStoreShippingUpdateEmail } from "@/lib/store/order-emails";

export interface StoreOrderItemRow {
  productName: string;
  productSlug: string | null;
  sourcePlatform: string;
  sourceProductId: string | null;
  variantId: string | null;
  quantity: number;
  unitPriceCents: number;
  shippingTier: string;
}

export interface StoreOrderRecord {
  id: string;
  userId: string | null;
  status: StoreOrderStatus;
  customerEmail: string | null;
  guestCheckout: boolean;
  totalCents: number;
  currency: string;
  shipping: Record<string, unknown> | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cjOrderId: string | null;
  cjOrderStatus: string | null;
  cjPayUrl: string | null;
  createdAt: string;
  items: StoreOrderItemRow[];
}

export interface CreateStoreOrderInput {
  userId: string | null;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId: string | null;
  customerEmail: string | null;
  shipping: Record<string, unknown> | null;
  totalCents: number;
  currency: string;
  product: StoreProduct;
  quantity: number;
}

export async function createPaidStoreOrder(input: CreateStoreOrderInput): Promise<string> {
  const supabase = createServiceClient();

  const { data: order, error: orderError } = await supabase
    .from("ni_store_orders")
    .insert({
      user_id: input.userId,
      stripe_checkout_session_id: input.stripeCheckoutSessionId,
      stripe_payment_intent_id: input.stripePaymentIntentId,
      status: "paid",
      customer_email: input.customerEmail,
      shipping: input.shipping,
      total_cents: input.totalCents,
      currency: input.currency,
    })
    .select("id")
    .single();

  if (orderError || !order) throw new Error(orderError?.message ?? "Failed to create order");

  const { error: itemError } = await supabase.from("ni_store_order_items").insert({
    order_id: order.id,
    product_id: input.product.id,
    quantity: input.quantity,
    unit_price_cents: input.product.priceCents,
  });

  if (itemError) throw new Error(itemError.message);
  return order.id as string;
}

export async function markOrderFulfillmentSent(orderId: string): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("ni_store_orders")
    .update({
      status: "fulfillment_sent",
      make_webhook_sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);

  if (error) throw new Error(error.message);
}

export async function markOrderCjSubmitted(input: {
  orderId: string;
  cjOrderId: string;
  cjOrderStatus: string | null;
  cjPayUrl: string | null;
}): Promise<void> {
  const supabase = createServiceClient();
  const { error } = await supabase
    .from("ni_store_orders")
    .update({
      cj_order_id: input.cjOrderId,
      cj_order_status: input.cjOrderStatus,
      cj_pay_url: input.cjPayUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.orderId);

  if (error) throw new Error(error.message);
}

function mapOrderRow(
  row: Record<string, unknown>,
  items: StoreOrderItemRow[]
): StoreOrderRecord {
  return {
    id: String(row.id),
    userId: row.user_id ? String(row.user_id) : null,
    status: String(row.status) as StoreOrderStatus,
    customerEmail: row.customer_email ? String(row.customer_email) : null,
    guestCheckout: Boolean(row.guest_checkout),
    totalCents: Number(row.total_cents),
    currency: String(row.currency ?? "usd"),
    shipping: (row.shipping as Record<string, unknown> | null) ?? null,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : null,
    trackingCarrier: row.tracking_carrier ? String(row.tracking_carrier) : null,
    trackingUrl: row.tracking_url ? String(row.tracking_url) : null,
    shippedAt: row.shipped_at ? String(row.shipped_at) : null,
    deliveredAt: row.delivered_at ? String(row.delivered_at) : null,
    cjOrderId: row.cj_order_id ? String(row.cj_order_id) : null,
    cjOrderStatus: row.cj_order_status ? String(row.cj_order_status) : null,
    cjPayUrl: row.cj_pay_url ? String(row.cj_pay_url) : null,
    createdAt: String(row.created_at),
    items,
  };
}

function mapItemRow(row: Record<string, unknown>): StoreOrderItemRow {
  return {
    productName: String(row.product_name ?? "Item"),
    productSlug: row.product_slug ? String(row.product_slug) : null,
    sourcePlatform: String(row.source_platform ?? "cj"),
    sourceProductId: row.source_product_id ? String(row.source_product_id) : null,
    variantId: row.variant_id ? String(row.variant_id) : null,
    quantity: Number(row.quantity ?? 1),
    unitPriceCents: Number(row.unit_price_cents ?? 0),
    shippingTier: String(row.shipping_tier ?? "standard"),
  };
}

export async function getStoreOrderById(orderId: string): Promise<StoreOrderRecord | null> {
  const supabase = createServiceClient();
  const { data: order, error } = await supabase
    .from("ni_store_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from("ni_store_order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);

  return mapOrderRow(order as Record<string, unknown>, (items ?? []).map(mapItemRow));
}

export async function getStoreOrderByReferenceAndEmail(
  orderRef: string,
  email: string
): Promise<StoreOrderRecord | null> {
  const normalizedRef = orderRef.trim().toUpperCase();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedRef || !normalizedEmail) return null;

  const supabase = createServiceClient();
  const { data: orders, error } = await supabase
    .from("ni_store_orders")
    .select("*")
    .ilike("customer_email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) throw new Error(error.message);

  const match = (orders ?? []).find(
    (row) => formatOrderReference(String(row.id)) === normalizedRef
  );
  if (!match) return null;

  const orderId = String(match.id);
  const { data: items, error: itemsError } = await supabase
    .from("ni_store_order_items")
    .select("*")
    .eq("order_id", orderId);

  if (itemsError) throw new Error(itemsError.message);

  return mapOrderRow(match as Record<string, unknown>, (items ?? []).map(mapItemRow));
}

export interface UpdateStoreOrderFulfillmentInput {
  orderId: string;
  status?: Extract<StoreOrderStatus, "shipped" | "delivered" | "fulfillment_sent">;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  trackingUrl?: string | null;
  sendCustomerEmail?: boolean;
}

export async function updateStoreOrderFulfillment(
  input: UpdateStoreOrderFulfillmentInput
): Promise<StoreOrderRecord> {
  const existing = await getStoreOrderById(input.orderId);
  if (!existing) throw new Error("Order not found");

  const trackingNumber = input.trackingNumber?.trim() || existing.trackingNumber;
  const trackingCarrier = input.trackingCarrier?.trim() || existing.trackingCarrier;
  const trackingUrl =
    input.trackingUrl?.trim() ||
    resolveOrderTrackingUrl({
      trackingUrl: existing.trackingUrl,
      trackingCarrier,
      trackingNumber,
    });

  const nextStatus = input.status ?? (trackingNumber ? "shipped" : existing.status);
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {
    updated_at: now,
  };

  if (nextStatus) patch.status = nextStatus;
  if (trackingNumber) patch.tracking_number = trackingNumber;
  if (trackingCarrier) patch.tracking_carrier = trackingCarrier;
  if (trackingUrl) patch.tracking_url = trackingUrl;
  if (nextStatus === "shipped" && !existing.shippedAt) patch.shipped_at = now;
  if (nextStatus === "delivered") patch.delivered_at = now;

  const supabase = createServiceClient();
  const { error } = await supabase.from("ni_store_orders").update(patch).eq("id", input.orderId);
  if (error) throw new Error(error.message);

  const updated = await getStoreOrderById(input.orderId);
  if (!updated) throw new Error("Order not found after update");

  const shouldEmail =
    input.sendCustomerEmail !== false &&
    updated.customerEmail &&
    (nextStatus === "shipped" || nextStatus === "delivered") &&
    (trackingNumber || nextStatus === "delivered");

  if (shouldEmail && updated.customerEmail) {
    await sendStoreShippingUpdateEmail({
      to: updated.customerEmail,
      orderId: updated.id,
      status: nextStatus,
      lines: updated.items.map((item) => ({
        productName: item.productName,
        quantity: item.quantity,
      })),
      trackingNumber,
      trackingCarrier,
      trackingUrl,
      trackPageUrl: buildStoreOrderTrackUrl(updated.id, updated.customerEmail),
    });
  }

  return updated;
}
