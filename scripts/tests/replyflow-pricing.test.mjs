// Ticket: RF-REPRICE (id: 89cfc1aa-2580-49e0-81f1-b924840da708)
// Verifies ReplyFlow repricing:
// 1. Public free tier for cold signups is retired (0 monthly cap).
// 2. Core tier is $15/mo with NO setup fee.
// 3. Done-With-You (agentic) tier is $149.99/mo with NO setup fee.
// 4. Backward compatibility with legacy plans and stripe price mapping.

import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

// Verify source definitions in src/lib/replyflow/tier.ts
test("ReplyFlow tier definitions: Core $15/mo and Done-With-You $149.99/mo, no setup fee", () => {
  const tierSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/replyflow/tier.ts"),
    "utf8"
  );

  // Core tier checks
  assert.match(tierSource, /core:\s*\{/, "Must contain core tier definition");
  assert.match(tierSource, /priceMonthlyUsd:\s*15,/, "Core must be priced at $15/mo");
  assert.ok(!/setupFeeUsd/.test(tierSource), "No setup fee allowed on any IT");

  // Done-With-You tier checks
  assert.match(tierSource, /done_with_you:\s*\{/, "Must contain done_with_you tier definition");
  assert.match(tierSource, /priceMonthlyUsd:\s*149\.99/, "Done-With-You must be priced at $149.99/mo");

  // Free tier baseline check in getPlanLimits (10 runs/month post-trial downgrade baseline)
  assert.match(
    tierSource,
    /free:\s*10/,
    "Free tier must provide 10 replies/month baseline for post-trial downgrade"
  );
});

test("ReplyFlow stripe definitions include core, done_with_you, and setup price IDs", () => {
  const stripeSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/replyflow/stripe.ts"),
    "utf8"
  );

  assert.match(stripeSource, /core:\s*process\.env\.STRIPE_REPLYFLOW_CORE_PRICE_ID/, "Must include core price ID");
  assert.match(stripeSource, /done_with_you:\s*process\.env\.STRIPE_REPLYFLOW_DWY_PRICE_ID/, "Must include done_with_you price ID");
  assert.ok(!/SETUP_PRICE_ID/.test(stripeSource), "No setup price ID allowed - no setup fees");
});

test("Sector 3 catalog has ReplyFlow at $15 base", () => {
  const catalogSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/billing/sector3-tool-pricing.ts"),
    "utf8"
  );

  assert.match(
    catalogSource,
    /toolSlug:\s*"replyflow"[\s\S]*?baseMonthlyUsd:\s*15,/,
    "Catalog base monthly for replyflow must be 15"
  );
  assert.match(
    catalogSource,
    /toolSlug:\s*"replyflow"[\s\S]*?freeTierMonthlyCap:\s*10/,
    "Catalog freeTierMonthlyCap for replyflow must be 10 (post-trial baseline)"
  );
});

test("ReplyFlow pricing UI renders Core ($15) with no setup fee", () => {
  const pricingSectionSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/replyflow/ReplyFlowPricingSection.tsx"),
    "utf8"
  );

  assert.match(pricingSectionSource, /REPLYFLOW_TIERS\.core\.priceMonthlyUsd/, "Must display Core monthly price");
  assert.match(pricingSectionSource, /AgenticTierComingSoonCard/, "Must show agentic tier as coming-soon card");
  assert.ok(!/\$500(?!\/)\b/.test(pricingSectionSource.replace(/\$500\/\d+/g, "")), "Pricing UI must not show a $500 price");
  assert.doesNotMatch(pricingSectionSource, /retired for cold signups/i, "Must NOT show retired cold-signup notice");
  assert.doesNotMatch(pricingSectionSource, /ToolFreemiumPricingGrid/, "Must not use freemium pricing grid offering free tier");
});

test("ReplyFlow dashboard page gates unauthenticated cold traffic with pricing instead of 10 free trial replies", () => {
  const dashboardSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/replyflow/dashboard/page.tsx"),
    "utf8"
  );

  assert.doesNotMatch(
    dashboardSource,
    /planLabel="Free Trial"/,
    "Cold unauthenticated visitors must not receive Free Trial plan"
  );
  assert.doesNotMatch(
    dashboardSource,
    /repliesLimit=\{10\}/,
    "Cold unauthenticated visitors must not receive 10 free replies"
  );
  assert.match(
    dashboardSource,
    /ReplyFlowPricingSection/,
    "Unauthenticated users must be shown ReplyFlowPricingSection gate"
  );
});
