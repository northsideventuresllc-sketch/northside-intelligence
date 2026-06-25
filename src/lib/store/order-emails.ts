import "server-only";

import { LEGAL_CONTACT_EMAIL } from "@/lib/legal/constants";
import { sendNoreplyEmail } from "@/lib/email/noreply";
import { formatOrderReference } from "@/lib/store/checkout-session";
import {
  buildStoreFulfillmentActionEmailHtml,
  buildStoreOrderAdminNotificationHtml,
  buildStoreOrderCancelledEmailHtml,
  buildStoreShippingAdjustmentChargeEmailHtml,
  buildStoreShippingAdjustmentRefundEmailHtml,
  buildStoreShippingUpdateEmailHtml,
  buildStoreOrderConfirmationEmailHtmlWithTracking,
  type StoreFulfillmentActionEmailInput,
  type StoreOrderAdminNotificationInput,
  type StoreShippingAdjustmentEmailInput,
  type StoreShippingUpdateInput,
} from "@/lib/store/order-emails-html";
import { buildStoreOrderTrackUrl } from "@/lib/store/tracking";
import type { StoreOrderConfirmationInput } from "@/lib/store/order-confirmation-email-html";

export function getStoreOrdersNotifyEmail(): string {
  return (
    process.env.NI_STORE_ORDERS_NOTIFY_EMAIL?.trim() ||
    process.env.NI_ADMIN_NOTIFY_EMAIL?.trim() ||
    LEGAL_CONTACT_EMAIL
  );
}

export async function sendStoreOrderConfirmationEmail(
  input: StoreOrderConfirmationInput & { trackPageUrl?: string | null; resend?: boolean }
): Promise<{ sent: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { sent: false, error: "Missing customer email" };

  const orderRef = formatOrderReference(input.orderId);
  const idempotencyKey = input.resend
    ? `store-order-confirmation/${input.orderId}/resend-${Date.now()}`
    : `store-order-confirmation/${input.orderId}`;

  const result = await sendNoreplyEmail({
    to,
    subject: `Order #${orderRef} Confirmed | Northside Intelligence Smart Store`,
    html: buildStoreOrderConfirmationEmailHtmlWithTracking(input),
    idempotencyKey,
  });

  if (result.error) return { sent: false, error: result.error };
  return { sent: true };
}

export async function sendStoreOrderAdminNotificationEmail(
  input: StoreOrderAdminNotificationInput & { resend?: boolean }
): Promise<{ sent: boolean; error?: string }> {
  const to = getStoreOrdersNotifyEmail();
  const orderRef = formatOrderReference(input.orderId);
  const idempotencyKey = input.resend
    ? `store-order-admin/${input.orderId}/resend-${Date.now()}`
    : `store-order-admin/${input.orderId}`;

  const result = await sendNoreplyEmail({
    to,
    subject: `New Smart Store Order #${orderRef} — ${input.lines.map((l) => l.productName).join(", ")}`,
    html: buildStoreOrderAdminNotificationHtml(input),
    idempotencyKey,
  });

  if (result.error) return { sent: false, error: result.error };
  return { sent: true };
}

export async function sendStoreShippingUpdateEmail(
  input: StoreShippingUpdateInput
): Promise<{ sent: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { sent: false, error: "Missing customer email" };

  const orderRef = formatOrderReference(input.orderId);
  const result = await sendNoreplyEmail({
    to,
    subject: `Order #${orderRef} Update — ${input.status === "delivered" ? "Delivered" : "Shipped"} | Northside Intelligence`,
    html: buildStoreShippingUpdateEmailHtml(input),
    idempotencyKey: `store-order-shipping/${input.orderId}/${input.status}/${input.trackingNumber ?? "none"}`,
  });

  if (result.error) return { sent: false, error: result.error };
  return { sent: true };
}

export async function sendStoreShippingAdjustmentChargeEmail(
  input: StoreShippingAdjustmentEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { sent: false, error: "Missing customer email" };

  const orderRef = formatOrderReference(input.orderId);
  const result = await sendNoreplyEmail({
    to,
    subject: `Order #${orderRef} — Shipping Adjustment | Northside Intelligence`,
    html: buildStoreShippingAdjustmentChargeEmailHtml(input),
    idempotencyKey: `store-order-shipping-charge/${input.orderId}`,
  });

  if (result.error) return { sent: false, error: result.error };
  return { sent: true };
}

export async function sendStoreShippingAdjustmentRefundEmail(
  input: StoreShippingAdjustmentEmailInput
): Promise<{ sent: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { sent: false, error: "Missing customer email" };

  const orderRef = formatOrderReference(input.orderId);
  const result = await sendNoreplyEmail({
    to,
    subject: `Order #${orderRef} — Shipping Refund | Northside Intelligence`,
    html: buildStoreShippingAdjustmentRefundEmailHtml(input),
    idempotencyKey: `store-order-shipping-refund/${input.orderId}`,
  });

  if (result.error) return { sent: false, error: result.error };
  return { sent: true };
}

export async function sendStoreFulfillmentActionEmail(
  input: StoreFulfillmentActionEmailInput & { resend?: boolean }
): Promise<{ sent: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { sent: false, error: "Missing customer email" };

  const orderRef = formatOrderReference(input.orderId);
  const idempotencyKey = input.resend
    ? `store-order-action/${input.orderId}/resend-${Date.now()}`
    : `store-order-action/${input.orderId}`;
  const result = await sendNoreplyEmail({
    to,
    subject: `Action Required — Order #${orderRef} | Northside Intelligence`,
    html: buildStoreFulfillmentActionEmailHtml({
      ...input,
      trackPageUrl:
        input.trackPageUrl ??
        (input.to ? buildStoreOrderTrackUrl(input.orderId, input.to) : null),
    }),
    idempotencyKey,
  });

  if (result.error) {
    console.error("[store/order-emails] fulfillment action email failed", {
      orderId: input.orderId,
      to,
      error: result.error,
    });
    return { sent: false, error: result.error };
  }
  return { sent: true };
}

export async function sendStoreOrderCancelledEmail(input: {
  to: string;
  orderId: string;
  reason: string;
}): Promise<{ sent: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { sent: false, error: "Missing customer email" };

  const orderRef = formatOrderReference(input.orderId);
  const result = await sendNoreplyEmail({
    to,
    subject: `Order #${orderRef} Cancelled | Northside Intelligence`,
    html: buildStoreOrderCancelledEmailHtml({
      orderId: input.orderId,
      reason: input.reason,
    }),
    idempotencyKey: `store-order-cancelled/${input.orderId}`,
  });

  if (result.error) return { sent: false, error: result.error };
  return { sent: true };
}
