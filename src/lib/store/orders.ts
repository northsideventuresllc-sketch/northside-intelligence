import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { StoreProduct } from "@/lib/store/products";

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
