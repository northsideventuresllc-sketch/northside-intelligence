import {
  handleStoreStripeWebhook,
  pingStoreStripeWebhook,
} from "@/lib/store/stripe-webhook";

export function GET() {
  return pingStoreStripeWebhook();
}

export async function POST(req: Parameters<typeof handleStoreStripeWebhook>[0]) {
  return handleStoreStripeWebhook(req);
}
