import "server-only";

import { sendNoreplyEmail } from "@/lib/email/noreply";
import {
  buildStoreOrderConfirmationEmailHtml,
  type StoreOrderConfirmationInput,
} from "@/lib/store/order-confirmation-email-html";
import { formatOrderReference } from "@/lib/store/checkout-session";

export type { StoreOrderConfirmationInput, StoreOrderConfirmationLine } from "@/lib/store/order-confirmation-email-html";

export async function sendStoreOrderConfirmationEmail(
  input: StoreOrderConfirmationInput
): Promise<{ sent: boolean; error?: string }> {
  const to = input.to.trim().toLowerCase();
  if (!to) return { sent: false, error: "Missing customer email" };

  const orderRef = formatOrderReference(input.orderId);
  const result = await sendNoreplyEmail({
    to,
    subject: `Order #${orderRef} Confirmed | Northside Intelligence Smart Store`,
    html: buildStoreOrderConfirmationEmailHtml(input),
    idempotencyKey: `store-order-confirmation/${input.orderId}`,
  });

  if (result.error) {
    return { sent: false, error: result.error };
  }

  return { sent: true };
}
