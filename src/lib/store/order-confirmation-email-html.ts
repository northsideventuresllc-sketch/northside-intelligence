import { formatOrderReference } from "@/lib/store/checkout-session";

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
          <td style="padding: 8px 0; color: #e8eaef; font-size: 14px;">
            ${line.productName}
            <span style="color: #8b95a8;"> × ${line.quantity}</span>
          </td>
          <td style="padding: 8px 0; text-align: right; color: #ffffff; font-size: 14px;">
            ${formatUsd(line.unitPriceCents * line.quantity, input.currency)}
          </td>
        </tr>`
    )
    .join("");

  const shippingHtml = formatShippingAddress(input.shipping);

  return `
    <div style="font-family: system-ui, sans-serif; background: #07080c; color: #e8eaef; padding: 32px; max-width: 560px;">
      <p style="color: #8b95a8; font-size: 14px; margin: 0 0 8px;">Northside Intelligence</p>
      <h1 style="font-size: 22px; margin: 0 0 4px; color: #00d4ff;">Order Confirmed</h1>
      <p style="color: #8b95a8; font-size: 13px; margin: 0 0 24px;">Order #${orderRef}</p>

      <p style="color: #e8eaef; line-height: 1.6; margin: 0 0 24px;">
        Thank you for your Smart Store order. We received your payment and are preparing it for fulfillment.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        ${lineItemsHtml}
      </table>

      <div style="border-top: 1px solid #1e2430; padding-top: 16px; margin-bottom: 24px;">
        <p style="margin: 0; color: #00d4ff; font-size: 16px; font-weight: 600;">
          Total paid:
          <span style="float: right;">${formatUsd(input.totalCents, input.currency)}</span>
        </p>
      </div>

      ${
        shippingHtml
          ? `<div style="margin-bottom: 24px;">
              <h2 style="font-size: 15px; color: #ffffff; margin: 0 0 8px;">Shipping to</h2>
              <p style="color: #8b95a8; font-size: 14px; line-height: 1.6; margin: 0;">${shippingHtml}</p>
            </div>`
          : ""
      }

      <p style="color: #8b95a8; font-size: 13px; line-height: 1.6; margin: 0;">
        Questions about your order? Reply to this email or contact
        <a href="mailto:support@northsideintelligence.com" style="color: #00d4ff;">support@northsideintelligence.com</a>.
      </p>
    </div>
  `;
}
