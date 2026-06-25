import {
  NI_EMAIL_COLORS,
  niEmailCta,
  niEmailTextLink,
  wrapNiEmailHtml,
} from "@/lib/email/layout";
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
        `<li style="margin: 0 0 8px; color: ${NI_EMAIL_COLORS.text}; font-size: 14px;">${line.productName} &times; ${line.quantity}</li>`
    )
    .join("");

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; background-color: ${NI_EMAIL_COLORS.bg}; border: 1px solid ${NI_EMAIL_COLORS.cardBorder}; border-radius: 10px;">
          <p style="margin: 0 0 8px; color: ${NI_EMAIL_COLORS.text}; font-size: 14px;">
            <strong style="color: ${NI_EMAIL_COLORS.white};">Customer:</strong>
            ${input.customerName ?? "Guest"}${input.guestCheckout ? " (guest checkout)" : ""}
          </p>
          <p style="margin: 0; color: ${NI_EMAIL_COLORS.text}; font-size: 14px;">
            <strong style="color: ${NI_EMAIL_COLORS.white};">Email:</strong>
            ${input.customerEmail ?? "unknown"}
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0 0 12px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${NI_EMAIL_COLORS.muted};">Items</p>
    <ul style="margin: 0 0 24px; padding-left: 20px;">${itemsHtml}</ul>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px 20px; background-color: rgba(0, 212, 255, 0.08); border: 1px solid rgba(0, 212, 255, 0.2); border-radius: 10px;">
          <span style="font-size: 18px; font-weight: 700; color: ${NI_EMAIL_COLORS.cyan};">
            Total: ${formatUsd(input.totalCents, input.currency)}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 13px; color: ${NI_EMAIL_COLORS.muted};">
      Fulfillment was triggered via Make.com when this order was processed.
    </p>`;

  return wrapNiEmailHtml({
    preheader: `New order #${orderRef} from ${input.customerName ?? "Guest"} — ${formatUsd(input.totalCents, input.currency)}`,
    eyebrow: "Smart Store",
    headline: "New Order Placed",
    subheadline: `Order #${orderRef}`,
    content,
  });
}

export function buildStoreShippingUpdateEmailHtml(input: StoreShippingUpdateInput): string {
  const orderRef = formatOrderReference(input.orderId);
  const statusLabel = formatStoreOrderStatusLabel(input.status);
  const itemsHtml = input.lines
    .map(
      (line) =>
        `<li style="margin: 0 0 8px; color: ${NI_EMAIL_COLORS.text}; font-size: 14px;">${line.productName} &times; ${line.quantity}</li>`
    )
    .join("");

  const trackingBlock =
    input.trackingNumber && input.trackingUrl
      ? `${niEmailCta("Track Package", input.trackingUrl)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 8px 0 24px;">
          <tr>
            <td style="padding: 16px 20px; background-color: ${NI_EMAIL_COLORS.bg}; border: 1px solid ${NI_EMAIL_COLORS.cardBorder}; border-radius: 10px;">
              <p style="margin: 0 0 4px; font-size: 13px; color: ${NI_EMAIL_COLORS.muted};">
                <strong style="color: ${NI_EMAIL_COLORS.text};">Carrier:</strong> ${input.trackingCarrier ?? "Carrier"}
              </p>
              <p style="margin: 0; font-size: 13px; color: ${NI_EMAIL_COLORS.muted};">
                <strong style="color: ${NI_EMAIL_COLORS.text};">Tracking:</strong> ${input.trackingNumber}
              </p>
            </td>
          </tr>
        </table>`
      : `<p style="margin: 16px 0 24px; font-size: 14px; color: ${NI_EMAIL_COLORS.muted};">
          Tracking details will appear here once your carrier scan is available.
        </p>`;

  const content = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td align="center" style="padding: 12px 20px; background-color: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.25); border-radius: 10px;">
          <span style="font-size: 15px; font-weight: 600; color: ${NI_EMAIL_COLORS.cyan};">${statusLabel}</span>
        </td>
      </tr>
    </table>

    <ul style="margin: 0 0 8px; padding-left: 20px;">${itemsHtml}</ul>

    ${trackingBlock}

    <p style="margin: 0; font-size: 14px;">
      ${niEmailTextLink("View Full Order Status", input.trackPageUrl)}
    </p>`;

  return wrapNiEmailHtml({
    preheader: `Your order #${orderRef} status: ${statusLabel}`,
    eyebrow: "Smart Store",
    headline: "Order Update",
    subheadline: `Order #${orderRef}`,
    content,
  });
}

export function buildStoreOrderConfirmationEmailHtmlWithTracking(
  input: StoreOrderConfirmationInput & { trackPageUrl?: string | null }
): string {
  const base = buildStoreOrderConfirmationEmailHtml(input);
  if (!input.trackPageUrl) return base;

  const trackCta = niEmailCta("Track Your Order", input.trackPageUrl);

  return base.replace(
    `<p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${NI_EMAIL_COLORS.muted};">`,
    `${trackCta}<p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${NI_EMAIL_COLORS.muted};">`
  );
}
