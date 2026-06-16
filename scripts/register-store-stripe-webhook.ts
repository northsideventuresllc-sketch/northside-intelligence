/**
 * Register NI Store Stripe webhook endpoint and print signing secret.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... npx tsx scripts/register-store-stripe-webhook.ts
 */

import Stripe from "stripe";

const STORE_WEBHOOK_URL =
  "https://northsideintelligence.com/api/store/webhooks/stripe";

const STORE_WEBHOOK_EVENTS = ["checkout.session.completed"] as const;

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY required");

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const existing = await stripe.webhookEndpoints.list({ limit: 50 });
  const match = existing.data.find((w) => w.url === STORE_WEBHOOK_URL);

  if (match) {
    console.log(`Store webhook already registered: ${match.id}`);
    console.log("Signing secret is only shown once at creation — check Stripe Dashboard or ni_platform_secrets.");
    return;
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: STORE_WEBHOOK_URL,
    enabled_events: [...STORE_WEBHOOK_EVENTS],
    description: "Northside Intelligence NI Store checkout",
  });

  console.log(`Created store webhook: ${endpoint.id}`);
  console.log(`STRIPE_WEBHOOK_SECRET_STORE=${endpoint.secret}`);
  console.log("\nAdd to Vercel via: ./scripts/set-vercel-store-env.sh");
  console.log("Or insert into ni_platform_secrets with key STRIPE_WEBHOOK_SECRET_STORE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
