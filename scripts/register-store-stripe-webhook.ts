/**
 * Register NI Store Stripe webhook endpoint and print signing secret.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... npx tsx scripts/register-store-stripe-webhook.ts
 */

import Stripe from "stripe";
import { STORE_STRIPE_WEBHOOK_URLS } from "../src/lib/store/checkout-session";
import { hydrateScriptEnv } from "./lib/load-platform-secrets";

const STORE_WEBHOOK_EVENTS = ["checkout.session.completed"] as const;

async function main() {
  await hydrateScriptEnv(["STRIPE_SECRET_KEY", "SUPABASE_SERVICE_ROLE_KEY"]);

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY required");

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const existing = await stripe.webhookEndpoints.list({ limit: 100 });

  const matches = existing.data.filter((w) =>
    STORE_STRIPE_WEBHOOK_URLS.includes(w.url as (typeof STORE_STRIPE_WEBHOOK_URLS)[number])
  );

  if (matches.length > 0) {
    for (const endpoint of matches) {
      console.log(`Store webhook already registered: ${endpoint.id} → ${endpoint.url}`);
    }
    console.log(
      "Signing secret is only shown once at creation — check Stripe Dashboard or ni_platform_secrets."
    );
    return;
  }

  const primaryUrl = STORE_STRIPE_WEBHOOK_URLS[0];
  const endpoint = await stripe.webhookEndpoints.create({
    url: primaryUrl,
    enabled_events: [...STORE_WEBHOOK_EVENTS],
    description: "Northside Intelligence Smart Store checkout",
  });

  console.log(`Created store webhook: ${endpoint.id}`);
  console.log(`URL: ${primaryUrl}`);
  console.log(`STRIPE_WEBHOOK_SECRET_STORE=${endpoint.secret}`);
  console.log("\nAdd to Vercel via: ./scripts/set-vercel-store-env.sh");
  console.log("Or upsert into ni_platform_secrets with key STRIPE_WEBHOOK_SECRET_STORE");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
