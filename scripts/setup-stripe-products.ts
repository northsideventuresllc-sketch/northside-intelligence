/**
 * Creates NI subscription + per-tool Stripe products/prices and syncs IDs to Supabase.
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... SUPABASE_SERVICE_ROLE_KEY=... npx tsx scripts/setup-stripe-products.ts
 *
 * Outputs env vars to paste into Vercel / .env.local
 */

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const TOOLS = [
  { slug: "replyflow", name: "ReplyFlow", monthly: 15, annual: 150, lifetime: 315 },
  { slug: "grantbot", name: "GrantBot", monthly: 39, annual: 390, lifetime: 819 },
  { slug: "signaldesk", name: "SignalDesk", monthly: 24, annual: 240, lifetime: 504 },
  { slug: "gapscan", name: "GapScan", monthly: 18, annual: 180, lifetime: 378 },
  { slug: "bridgeai", name: "BridgeAI", monthly: 33, annual: 330, lifetime: 797 },
] as const;

const NI_PLANS = [
  { tier: "core", name: "NI Core", monthly: 2000, annual: 15900 },
  { tier: "pro", name: "NI Pro", monthly: 3900, annual: 32400 },
  { tier: "power", name: "NI Power", monthly: 5900, annual: 55900 },
] as const;

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY required");
  if (!supabaseUrl || !serviceKey) throw new Error("Supabase env vars required");

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
  const supabase = createClient(supabaseUrl, serviceKey);

  const envLines: string[] = [];

  console.log("\n=== NI Subscription Products ===\n");

  for (const plan of NI_PLANS) {
    const product = await stripe.products.create({
      name: plan.name,
      description: `Northside Intelligence ${plan.tier} subscription`,
      metadata: { ni_tier: plan.tier, type: "ni_subscription" },
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.monthly,
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { ni_tier: plan.tier, interval: "monthly" },
    });

    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.annual,
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { ni_tier: plan.tier, interval: "annual" },
    });

    const tierUpper = plan.tier.toUpperCase();
    envLines.push(`STRIPE_NI_${tierUpper}_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
    envLines.push(`STRIPE_NI_${tierUpper}_ANNUAL_PRICE_ID=${annualPrice.id}`);

    console.log(`${plan.name}: monthly ${monthlyPrice.id}, annual ${annualPrice.id}`);
  }

  console.log("\n=== Per-Tool Products ===\n");

  for (const tool of TOOLS) {
    const product = await stripe.products.create({
      name: `NI ${tool.name}`,
      description: `Unlimited access to ${tool.name}`,
      metadata: { tool_slug: tool.slug, type: "tool" },
    });

    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(tool.monthly * 100),
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { tool_slug: tool.slug, interval: "monthly" },
    });

    const annualPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(tool.annual * 100),
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { tool_slug: tool.slug, interval: "annual" },
    });

    const lifetimePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(tool.lifetime * 100),
      currency: "usd",
      metadata: { tool_slug: tool.slug, interval: "lifetime" },
    });

    const { error } = await supabase
      .from("ni_tool_pricing")
      .update({
        stripe_monthly_price_id: monthlyPrice.id,
        stripe_annual_price_id: annualPrice.id,
        stripe_lifetime_price_id: lifetimePrice.id,
        updated_at: new Date().toISOString(),
      })
      .eq("tool_slug", tool.slug);

    if (error) console.warn(`Supabase update failed for ${tool.slug}:`, error.message);
    else console.log(`${tool.name}: synced price IDs to ni_tool_pricing`);
  }

  console.log("\n=== Sync NI plan pricing to Supabase ===\n");

  for (const line of envLines) {
    const monthly = line.match(/STRIPE_NI_(\w+)_MONTHLY_PRICE_ID=(.+)/);
    if (monthly) {
      const tier = monthly[1].toLowerCase();
      const monthlyId = monthly[2];
      const annualLine = envLines.find((l) => l.includes(`STRIPE_NI_${monthly[1]}_ANNUAL`));
      const annualId = annualLine?.split("=")[1] ?? "";
      const { error } = await supabase
        .from("ni_plan_pricing")
        .upsert(
          {
            tier,
            stripe_monthly_price_id: monthlyId,
            stripe_annual_price_id: annualId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tier" }
        );
      if (error) console.warn(`ni_plan_pricing upsert failed for ${tier}:`, error.message);
      else console.log(`ni_plan_pricing: synced ${tier}`);
    }
  }

  console.log("\n=== Add to Vercel / .env.local ===\n");
  console.log(envLines.join("\n"));
  console.log("\nWebhook endpoint: https://www.northsideintelligence.com/api/billing/webhooks/stripe");
  console.log("Events: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
