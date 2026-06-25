import { formatOrderReference } from "@/lib/store/checkout-session";
import {
  NI_EMAIL_COLORS,
  niEmailTextLink,
  wrapNiEmailHtml,
} from "@/lib/email/layout";

export interface StoreOrderConfirmationLine {
  productName: string;
  quantity: number;
  unitPriceCents: number;
  shippingTier: string;
}

export interface StoreOrderConfirmationInput {
  to: string;
  orderId: string;
  totalCents: number;
  currency: string;
  lines: StoreOrderConfirmationLine[];
  shipping: Record<string, unknown> | null;
}

function formatUsd(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatShippingAddress(shipping: Record<string, unknown> | null): string | null {
  if (!shipping || typeof shipping !== "object") return null;
  const address = shipping.address as Record<string, unknown> | undefined;
  if (!address) return null;

  const lines = [
    typeof shipping.name === "string" ? shipping.name : null,
    typeof address.line1 === "string" ? address.line1 : null,
    typeof address.line2 === "string" ? address.line2 : null,
    [
      typeof address.city === "string" ? address.city : null,
      typeof address.state === "string" ? address.state : null,
      typeof address.postal_code === "string" ? address.postal_code : null,
    ]
      .filter(Boolean)
      .join(", "),
    typeof address.country === "string" ? address.country : null,
  ].filter((line): line is string => Boolean(line && line.trim()));

  return lines.length > 0 ? lines.join("<br />") : null;
}

export function buildStoreOrderConfirmationEmailHtml(
  input: StoreOrderConfirmationInput
): string {
  const orderRef = formatOrderReference(input.orderId);
  const lineItemsHtml = input.lines
    .map(
      (line) => `
        <tr>
          <td style="padding: 12px 0; color: ${NI_EMAIL_COLORS.text}; font-size: 14px; border-bottom: 1px solid ${NI_EMAIL_COLORS.divider};">
            ${line.productName}
            <span style="color: ${NI_EMAIL_COLORS.muted};"> &times; ${line.quantity}</span>
          </td>
          <td style="padding: 12px 0; text-align: right; color: ${NI_EMAIL_COLORS.white}; font-size: 14px; font-weight: 500; border-bottom: 1px solid ${NI_EMAIL_COLORS.divider};">
            ${formatUsd(line.unitPriceCents * line.quantity, input.currency)}
          </td>
        </tr>`
    )
    .join("");

  const shippingHtml = formatShippingAddress(input.shipping);

  const content = `
    <p style="margin: 0 0 24px; color: #c5cdd9;">
      Thank you for your Smart Store order. We received your payment and are preparing it for fulfillment.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 8px;">
      <tr>
        <td style="padding-bottom: 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${NI_EMAIL_COLORS.muted};">
          Order Summary
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      ${lineItemsHtml}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
      <tr>
        <td style="padding: 16px 0 0; border-top: 2px solid ${NI_EMAIL_COLORS.divider};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-size: 16px; font-weight: 600; color: ${NI_EMAIL_COLORS.cyan};">Total Paid</td>
              <td style="text-align: right; font-size: 18px; font-weight: 700; color: ${NI_EMAIL_COLORS.white};">
                ${formatUsd(input.totalCents, input.currency)}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${
      shippingHtml
        ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 28px;">
            <tr>
              <td style="padding: 20px; background-color: ${NI_EMAIL_COLORS.bg}; border: 1px solid ${NI_EMAIL_COLORS.cardBorder}; border-radius: 10px;">
                <p style="margin: 0 0 8px; font-size: 11px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${NI_EMAIL_COLORS.muted};">Shipping To</p>
                <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${NI_EMAIL_COLORS.text};">${shippingHtml}</p>
              </td>
            </tr>
          </table>`
        : ""
    }

    <p style="margin: 0; font-size: 14px; line-height: 1.7; color: ${NI_EMAIL_COLORS.muted};">
      Questions about your order? Reply to this email or contact
      ${niEmailTextLink("support@northsideintelligence.com", "mailto:support@northsideintelligence.com")}.
    </p>`;

  return wrapNiEmailHtml({
    preheader: `Your order #${orderRef} is confirmed. Total: ${formatUsd(input.totalCents, input.currency)}`,
    eyebrow: "Smart Store",
    headline: "Order Confirmed",
    subheadline: `Order #${orderRef}`,
    content,
  });
}
