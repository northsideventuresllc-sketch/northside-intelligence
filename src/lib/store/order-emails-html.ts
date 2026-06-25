import { formatOrderReference } from "@/lib/store/checkout-session";
import type { StoreOrderConfirmationInput } from "@/lib/store/order-confirmation-email-html";
import { buildStoreOrderConfirmationEmailHtml } from "@/lib/store/order-confirmation-email-html";
import { formatStoreOrderStatusLabel, type StoreOrderStatus } from "@/lib/store/tracking";

export interface StoreOrderAdminNotificationInput {
  orderId: string;
  customerEmail: string | null;
  customerName: string | null;
  totalCents: number;
  currency: string;
  guestCheckout: boolean;
  lines: Array<{ productName: string; quantity: number }>;
  shipping: Record<string, unknown> | null;
}

export interface StoreShippingUpdateInput {
  to: string;
  orderId: string;
  status: StoreOrderStatus;
  lines: Array<{ productName: string; quantity: number }>;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  trackingUrl: string | null;
  trackPageUrl: string;
}

function formatUsd(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function buildStoreOrderAdminNotificationHtml(
  input: StoreOrderAdminNotificationInput
): string {
  const orderRef = formatOrderReference(input.orderId);
  const itemsHtml = input.lines
    .map(
      (line) =>
        `<li style="margin: 0 0 6px; color: #e8eaef;">${line.productName} × ${line.quantity}</li>`
    )
    .join("");

  return `
    <div style="font-family: system-ui, sans-serif; background: #07080c; color: #e8eaef; padding: 32px; max-width: 560px;">
      <p style="color: #8b95a8; font-size: 14px; margin: 0 0 8px;">Northside Intelligence — Smart Store</p>
      <h1 style="font-size: 22px; margin: 0 0 4px; color: #00d4ff;">New Order Placed</h1>
      <p style="color: #8b95a8; font-size: 13px; margin: 0 0 24px;">Order #${orderRef}</p>

      <p style="color: #e8eaef; margin: 0 0 8px;">
        <strong>Customer:</strong> ${input.customerName ?? "Guest"}${input.guestCheckout ? " (guest checkout)" : ""}
      </p>
      <p style="color: #e8eaef; margin: 0 0 16px;">
        <strong>Email:</strong> ${input.customerEmail ?? "unknown"}
      </p>

      <h2 style="font-size: 15px; color: #ffffff; margin: 0 0 8px;">Items</h2>
      <ul style="margin: 0 0 16px; padding-left: 18px;">${itemsHtml}</ul>

      <p style="color: #00d4ff; font-size: 16px; font-weight: 600; margin: 0 0 24px;">
        Total: ${formatUsd(input.totalCents, input.currency)}
      </p>

      <p style="color: #8b95a8; font-size: 13px; margin: 0;">
        Fulfillment was triggered via Make.com when this order was processed.
      </p>
    </div>
  `;
}

export function buildStoreShippingUpdateEmailHtml(input: StoreShippingUpdateInput): string {
  const orderRef = formatOrderReference(input.orderId);
  const statusLabel = formatStoreOrderStatusLabel(input.status);
  const itemsHtml = input.lines
    .map((line) => `<li style="margin: 0 0 6px; color: #e8eaef;">${line.productName} × ${line.quantity}</li>`)
    .join("");

  const trackingBlock =
    input.trackingNumber && input.trackingUrl
      ? `<p style="margin: 16px 0;">
          <a href="${input.trackingUrl}" style="display: inline-block; background: #00d4ff; color: #07080c; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Track Package</a>
        </p>
        <p style="color: #8b95a8; font-size: 13px; margin: 0;">
          Carrier: ${input.trackingCarrier ?? "Carrier"}<br />
          Tracking: ${input.trackingNumber}
        </p>`
      : `<p style="color: #8b95a8; font-size: 14px; margin: 16px 0 0;">
          Tracking details will appear here once your carrier scan is available.
        </p>`;

  return `
    <div style="font-family: system-ui, sans-serif; background: #07080c; color: #e8eaef; padding: 32px; max-width: 560px;">
      <p style="color: #8b95a8; font-size: 14px; margin: 0 0 8px;">Northside Intelligence</p>
      <h1 style="font-size: 22px; margin: 0 0 4px; color: #00d4ff;">Order Update</h1>
      <p style="color: #8b95a8; font-size: 13px; margin: 0 0 8px;">Order #${orderRef}</p>
      <p style="color: #00d4ff; font-size: 15px; font-weight: 600; margin: 0 0 24px;">${statusLabel}</p>

      <ul style="margin: 0 0 16px; padding-left: 18px;">${itemsHtml}</ul>

      ${trackingBlock}

      <p style="margin: 24px 0;">
        <a href="${input.trackPageUrl}" style="color: #00d4ff;">View full order status</a>
      </p>
    </div>
  `;
}

export function buildStoreOrderConfirmationEmailHtmlWithTracking(
  input: StoreOrderConfirmationInput & { trackPageUrl?: string | null }
): string {
  const base = buildStoreOrderConfirmationEmailHtml(input);
  if (!input.trackPageUrl) return base;

  const trackBlock = `
      <p style="margin: 24px 0;">
        <a href="${input.trackPageUrl}" style="display: inline-block; background: #00d4ff; color: #07080c; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Track Your Order</a>
      </p>`;

  return base.replace(
    "<p style=\"color: #8b95a8; font-size: 13px; line-height: 1.6; margin: 0;\">",
    `${trackBlock}<p style="color: #8b95a8; font-size: 13px; line-height: 1.6; margin: 0;">`
  );
}
