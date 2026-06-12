/**
 * One-shot Stripe configuration for northsideintelligence.com:
 * - Ensures NI subscription + per-tool products/prices exist
 * - Syncs tool price IDs to Supabase ni_tool_pricing
 * - Ensures billing webhook endpoint exists
 * - Prints Vercel env vars to configure
 *
 * Usage:
 *   STRIPE_SECRET_KEY=sk_... npx tsx scripts/configure-stripe.ts
 *   (Supabase updates use Supabase MCP execute_sql when SERVICE_ROLE_KEY is absent)
 */

import Stripe from "stripe";

const TOOLS = [
  { slug: "replyflow", name: "ReplyFlow", monthly: 22, annual: 220, lifetime: 531 },
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

const BILLING_WEBHOOK_URL =
  "https://www.northsideintelligence.com/api/billing/webhooks/stripe";

const REPLYFLOW_WEBHOOK_URL =
  "https://www.northsideintelligence.com/api/replyflow/webhooks/stripe";

const WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted",
] as const;

const LEGACY_REPLYFLOW_PRICES = {
  STRIPE_SOLO_PRICE_ID: "price_1Te0s8QXb5thRQWgqVQdW8Rl",
  STRIPE_TEAM_PRICE_ID: "price_1Te0sBQXb5thRQWgYzuWMxTd",
  STRIPE_AGENCY_PRICE_ID: "price_1Te0sEQXb5thRQWgCiAzrClk",
} as const;

type ToolPriceIds = {
  toolSlug: string;
  monthly: string;
  annual: string;
  lifetime: string;
};

async function findNiProduct(
  stripe: Stripe,
  tier: string
): Promise<Stripe.Product | null> {
  const products = await stripe.products.search({
    query: `metadata['ni_tier']:'${tier}' AND metadata['type']:'ni_subscription'`,
    limit: 1,
  });
  return products.data[0] ?? null;
}

async function findToolProduct(
  stripe: Stripe,
  slug: string
): Promise<Stripe.Product | null> {
  const products = await stripe.products.search({
    query: `metadata['tool_slug']:'${slug}' AND metadata['type']:'tool'`,
    limit: 1,
  });
  return products.data[0] ?? null;
}

async function findPrice(
  stripe: Stripe,
  productId: string,
  interval: "monthly" | "annual" | "lifetime",
  expectedUnitAmount?: number
): Promise<Stripe.Price | null> {
  const prices = await stripe.prices.list({ product: productId, limit: 20, active: true });
  return (
    prices.data.find(
      (p) =>
        p.metadata.interval === interval &&
        (expectedUnitAmount === undefined || p.unit_amount === expectedUnitAmount)
    ) ?? null
  );
}

async function ensureNiPlans(stripe: Stripe): Promise<string[]> {
  const envLines: string[] = [];

  for (const plan of NI_PLANS) {
    let product = await findNiProduct(stripe, plan.tier);
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: `Northside Intelligence ${plan.tier} subscription`,
        metadata: { ni_tier: plan.tier, type: "ni_subscription" },
      });
      console.log(`Created NI product: ${plan.name}`);
    } else {
      console.log(`Found NI product: ${plan.name}`);
    }

    let monthly = await findPrice(stripe, product.id, "monthly", plan.monthly);
    if (!monthly) {
      monthly = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.monthly,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { ni_tier: plan.tier, interval: "monthly" },
      });
    }

    let annual = await findPrice(stripe, product.id, "annual", plan.annual);
    if (!annual) {
      annual = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.annual,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { ni_tier: plan.tier, interval: "annual" },
      });
    }

    const tierUpper = plan.tier.toUpperCase();
    envLines.push(`STRIPE_NI_${tierUpper}_MONTHLY_PRICE_ID=${monthly.id}`);
    envLines.push(`STRIPE_NI_${tierUpper}_ANNUAL_PRICE_ID=${annual.id}`);
    console.log(`${plan.name}: monthly ${monthly.id}, annual ${annual.id}`);
  }

  return envLines;
}

async function ensureToolPlans(stripe: Stripe): Promise<ToolPriceIds[]> {
  const results: ToolPriceIds[] = [];

  for (const tool of TOOLS) {
    let product = await findToolProduct(stripe, tool.slug);
    if (!product) {
      product = await stripe.products.create({
        name: `NI ${tool.name}`,
        description: `Unlimited access to ${tool.name}`,
        metadata: { tool_slug: tool.slug, type: "tool" },
      });
      console.log(`Created tool product: ${tool.name}`);
    } else {
      console.log(`Found tool product: ${tool.name}`);
    }

    const monthlyCents = Math.round(tool.monthly * 100);
    const annualCents = Math.round(tool.annual * 100);
    const lifetimeCents = Math.round(tool.lifetime * 100);

    let monthly = await findPrice(stripe, product.id, "monthly", monthlyCents);
    if (!monthly) {
      monthly = await stripe.prices.create({
        product: product.id,
        unit_amount: monthlyCents,
        currency: "usd",
        recurring: { interval: "month" },
        metadata: { tool_slug: tool.slug, interval: "monthly" },
      });
    }

    let annual = await findPrice(stripe, product.id, "annual", annualCents);
    if (!annual) {
      annual = await stripe.prices.create({
        product: product.id,
        unit_amount: annualCents,
        currency: "usd",
        recurring: { interval: "year" },
        metadata: { tool_slug: tool.slug, interval: "annual" },
      });
    }

    let lifetime = await findPrice(stripe, product.id, "lifetime", lifetimeCents);
    if (!lifetime) {
      lifetime = await stripe.prices.create({
        product: product.id,
        unit_amount: lifetimeCents,
        currency: "usd",
        metadata: { tool_slug: tool.slug, interval: "lifetime" },
      });
    }

    results.push({
      toolSlug: tool.slug,
      monthly: monthly.id,
      annual: annual.id,
      lifetime: lifetime.id,
    });
    console.log(`${tool.name}: ${monthly.id}, ${annual.id}, ${lifetime.id}`);
  }

  return results;
}

async function ensureWebhook(
  stripe: Stripe,
  url: string
): Promise<{ id: string; created: boolean }> {
  const existing = await stripe.webhookEndpoints.list({ limit: 20 });
  const match = existing.data.find((w) => w.url === url);
  if (match) {
    console.log(`Webhook exists: ${url} (${match.id})`);
    return { id: match.id, created: false };
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url,
    enabled_events: [...WEBHOOK_EVENTS],
    description: "Northside Intelligence billing",
  });
  console.log(`Created webhook: ${url} (${endpoint.id})`);
  console.log(`New webhook signing secret: ${endpoint.secret}`);
  return { id: endpoint.id, created: true };
}

async function main() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) throw new Error("STRIPE_SECRET_KEY required");

  const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

  console.log("\n=== NI Subscription Products ===\n");
  const niEnvLines = await ensureNiPlans(stripe);

  console.log("\n=== Per-Tool Products ===\n");
  const toolPrices = await ensureToolPlans(stripe);

  console.log("\n=== Webhooks ===\n");
  await ensureWebhook(stripe, BILLING_WEBHOOK_URL);
  await ensureWebhook(stripe, REPLYFLOW_WEBHOOK_URL);

  console.log("\n=== Supabase SQL (ni_plan_pricing) ===\n");
  for (const line of niEnvLines) {
    const monthly = line.match(/STRIPE_NI_(\w+)_MONTHLY_PRICE_ID=(.+)/);
    const annual = line.match(/STRIPE_NI_(\w+)_ANNUAL_PRICE_ID=(.+)/);
    if (monthly) {
      const tier = monthly[1].toLowerCase();
      const monthlyId = monthly[2];
      const annualLine = niEnvLines.find((l) => l.includes(`STRIPE_NI_${monthly[1]}_ANNUAL`));
      const annualId = annualLine?.split("=")[1] ?? "";
      console.log(
        `INSERT INTO ni_plan_pricing (tier, stripe_monthly_price_id, stripe_annual_price_id) VALUES ('${tier}', '${monthlyId}', '${annualId}') ON CONFLICT (tier) DO UPDATE SET stripe_monthly_price_id=EXCLUDED.stripe_monthly_price_id, stripe_annual_price_id=EXCLUDED.stripe_annual_price_id, updated_at=now();`
      );
    }
  }

  console.log("\n=== Supabase SQL (ni_tool_pricing) ===\n");
  for (const t of toolPrices) {
    console.log(
      `UPDATE ni_tool_pricing SET stripe_monthly_price_id='${t.monthly}', stripe_annual_price_id='${t.annual}', stripe_lifetime_price_id='${t.lifetime}', updated_at=now() WHERE tool_slug='${t.toolSlug}';`
    );
  }

  console.log("\n=== Vercel / Production Env Vars ===\n");
  console.log(`STRIPE_SECRET_KEY=${stripeKey}`);
  console.log("STRIPE_WEBHOOK_SECRET=<billing webhook signing secret from Stripe Dashboard>");
  console.log("STRIPE_REPLYFLOW_WEBHOOK_SECRET=<replyflow webhook signing secret>");
  console.log(`NEXT_PUBLIC_APP_URL=https://www.northsideintelligence.com`);
  for (const line of niEnvLines) console.log(line);
  for (const [k, v] of Object.entries(LEGACY_REPLYFLOW_PRICES)) {
    console.log(`${k}=${v}`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
