import { handleStoreStripeWebhook } from "@/lib/store/stripe-webhook";

export async function POST(req: Parameters<typeof handleStoreStripeWebhook>[0]) {
  return handleStoreStripeWebhook(req);
}
