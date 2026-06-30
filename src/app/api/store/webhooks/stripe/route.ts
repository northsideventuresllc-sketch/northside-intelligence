import {
  handleStoreStripeWebhook,
  pingStoreStripeWebhook,
} from "@/lib/store/stripe-webhook";

/** @deprecated Use /api/store/webhook — kept for existing Stripe endpoint registrations. */
export function GET() {
  return pingStoreStripeWebhook();
}

export async function POST(req: Parameters<typeof handleStoreStripeWebhook>[0]) {
  return handleStoreStripeWebhook(req);
}
