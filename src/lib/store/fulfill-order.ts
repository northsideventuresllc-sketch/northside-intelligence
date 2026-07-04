import "server-only";

import type { MakeStoreOrderPayload } from "@/lib/store/make-webhook";
import { sendMakeStoreWebhook } from "@/lib/store/make-webhook";
import {
  getStoreOrderById,
  markOrderCjSubmitted,
  markOrderFulfillmentSent,
  type StoreOrderItemRow,
} from "@/lib/store/orders";
import { createAndPayCjStoreOrder } from "@/lib/store/sources/cj-orders";
import { isMakeStoreWebhookConfigured } from "@/lib/store/gate";

export interface FulfillStoreOrderResult {
  orderId: string;
  cjSubmitted: boolean;
  cjPaid: boolean;
  cjOrderId: string | null;
  cjOrderStatus: string | null;
  cjProductAmountCents: number | null;
  cjPostageAmountCents: number | null;
  cjPaymentError: string | null;
  makeNotified: boolean;
  error: string | null;
}

function buildMakePayload(
  order: NonNullable<Awaited<ReturnType<typeof getStoreOrderById>>>,
  stripeCheckoutSessionId: string,
  stripePaymentIntentId: string | null
): MakeStoreOrderPayload {
  return {
    orderId: order.id,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
    customerEmail: order.customerEmail,
    shipping: order.shipping,
    totalCents: order.totalCents,
    currency: order.currency,
    items: order.items.map((item) => ({
      productSlug: item.productSlug ?? "",
      productName: item.productName,
      sourcePlatform: item.sourcePlatform,
      sourceProductId: item.sourceProductId,
      cjProductId: item.sourcePlatform === "cj" ? item.sourceProductId : null,
      variantId: item.variantId,
      cjVariantId: item.variantId,
      cj_variant_id: item.variantId,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      shippingTier: item.shippingTier,
    })),
  };
}

function resolveShippingTier(items: StoreOrderItemRow[]): "standard" | "expedited" {
  return items.some((item) => item.shippingTier === "expedited") ? "expedited" : "standard";
}

export async function fulfillStoreOrder(input: {
  orderId: string;
  stripeCheckoutSessionId: string;
  stripePaymentIntentId?: string | null;
  notifyMake?: boolean;
  skipIfCjExists?: boolean;
}): Promise<FulfillStoreOrderResult> {
  const order = await getStoreOrderById(input.orderId);
  if (!order) {
    return {
      orderId: input.orderId,
      cjSubmitted: false,
      cjPaid: false,
      cjOrderId: null,
      cjOrderStatus: null,
      cjProductAmountCents: null,
      cjPostageAmountCents: null,
      cjPaymentError: null,
      makeNotified: false,
      error: "Order not found",
    };
  }

  if (input.skipIfCjExists && order.cjOrderId) {
    return {
      orderId: order.id,
      cjSubmitted: true,
      cjPaid: order.cjOrderStatus === "UNSHIPPED" || order.cjOrderStatus === "SHIPPED",
      cjOrderId: order.cjOrderId,
      cjOrderStatus: order.cjOrderStatus,
      cjProductAmountCents: order.cjProductCostCents,
      cjPostageAmountCents: order.cjPostageCents,
      cjPaymentError: null,
      makeNotified: false,
      error: null,
    };
  }

  const cjLines = order.items
    .filter((item) => item.sourcePlatform === "cj" && item.variantId && item.sourceProductId)
    .map((item) => ({
      variantId: item.variantId!,
      quantity: item.quantity,
      storeLineItemId: `${order.id}:${item.variantId}`,
    }));

  if (!cjLines.length) {
    return {
      orderId: order.id,
      cjSubmitted: false,
      cjPaid: false,
      cjOrderId: null,
      cjOrderStatus: null,
      cjProductAmountCents: null,
      cjPostageAmountCents: null,
      cjPaymentError: null,
      makeNotified: false,
      error: "Order has no CJ line items with variant IDs",
    };
  }

  const cjResult = await createAndPayCjStoreOrder({
    niOrderId: order.id,
    customerEmail: order.customerEmail,
    shipping: order.shipping,
    lines: cjLines,
    shippingTier: resolveShippingTier(order.items),
    remark: `NI Store order ${order.id}`,
  });

  if (!cjResult.ok) {
    return {
      orderId: order.id,
      cjSubmitted: false,
      cjPaid: false,
      cjOrderId: null,
      cjOrderStatus: null,
      cjProductAmountCents: null,
      cjPostageAmountCents: null,
      cjPaymentError: null,
      makeNotified: false,
      error: cjResult.message,
    };
  }

  await markOrderCjSubmitted({
    orderId: order.id,
    cjOrderId: cjResult.cjOrderId,
    cjOrderStatus: cjResult.cjOrderStatus,
    cjPayUrl: cjResult.cjPayUrl,
    cjProductCostCents:
      cjResult.productAmount != null ? Math.round(cjResult.productAmount * 100) : null,
    cjPostageCents:
      cjResult.postageAmount != null ? Math.round(cjResult.postageAmount * 100) : null,
  });
  await markOrderFulfillmentSent(order.id);

  let makeNotified = false;
  if (input.notifyMake !== false && isMakeStoreWebhookConfigured()) {
    makeNotified = await sendMakeStoreWebhook(
      buildMakePayload(
        order,
        input.stripeCheckoutSessionId,
        input.stripePaymentIntentId ?? null
      )
    );
  }

  return {
    orderId: order.id,
    cjSubmitted: true,
    cjPaid: cjResult.paid,
    cjOrderId: cjResult.cjOrderId,
    cjOrderStatus: cjResult.cjOrderStatus,
    cjProductAmountCents:
      cjResult.productAmount != null ? Math.round(cjResult.productAmount * 100) : null,
    cjPostageAmountCents:
      cjResult.postageAmount != null ? Math.round(cjResult.postageAmount * 100) : null,
    cjPaymentError: cjResult.paymentError,
    makeNotified,
    error: null,
  };
}
