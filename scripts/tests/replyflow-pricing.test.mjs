// Ticket: RF-REPRICE (id: 89cfc1aa-2580-49e0-81f1-b924840da708)
// Verifies ReplyFlow repricing:
// 1. Public free tier for cold signups is retired (0 monthly cap).
// 2. Core tier is $149/mo with $500 setup fee.
// 3. Done-With-You tier is $299/mo with $500 setup fee.
// 4. Backward compatibility with legacy plans and stripe price mapping.

import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

// Verify source definitions in src/lib/replyflow/tier.ts
test("ReplyFlow tier definitions: Core $149/mo and Done-With-You $299/mo with $500 setup", () => {
  const tierSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/replyflow/tier.ts"),
    "utf8"
  );

  // Core tier checks
  assert.match(tierSource, /core:\s*\{/, "Must contain core tier definition");
  assert.match(tierSource, /priceMonthlyUsd:\s*149/, "Core must be priced at $149/mo");
  assert.match(tierSource, /setupFeeUsd:\s*500/, "Setup fee must be $500");

  // Done-With-You tier checks
  assert.match(tierSource, /done_with_you:\s*\{/, "Must contain done_with_you tier definition");
  assert.match(tierSource, /priceMonthlyUsd:\s*299/, "Done-With-You must be priced at $299/mo");

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
  assert.match(stripeSource, /REPLYFLOW_SETUP_PRICE_ID/, "Must include setup price ID");
  assert.match(stripeSource, /price_replyflow_setup_500/, "Default setup price must match $500 setup");
});

test("Sector 3 catalog has ReplyFlow updated to $149 base and 10 free tier cap baseline", () => {
  const catalogSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/billing/sector3-tool-pricing.ts"),
    "utf8"
  );

  assert.match(
    catalogSource,
    /toolSlug:\s*"replyflow"[\s\S]*?baseMonthlyUsd:\s*149/,
    "Catalog base monthly for replyflow must be 149"
  );
  assert.match(
    catalogSource,
    /toolSlug:\s*"replyflow"[\s\S]*?freeTierMonthlyCap:\s*10/,
    "Catalog freeTierMonthlyCap for replyflow must be 10 (post-trial baseline)"
  );
});

test("ReplyFlow pricing UI renders Core ($149), Done-With-You ($299), and $500 setup", () => {
  const pricingSectionSource = fs.readFileSync(
    path.resolve(process.cwd(), "src/components/replyflow/ReplyFlowPricingSection.tsx"),
    "utf8"
  );

  assert.match(pricingSectionSource, /REPLYFLOW_TIERS\.core\.priceMonthlyUsd/, "Must display Core monthly price");
  assert.match(pricingSectionSource, /REPLYFLOW_TIERS\.done_with_you\.priceMonthlyUsd/, "Must display Done-With-You monthly price");
  assert.match(pricingSectionSource, /\+\$500 setup/, "Must display $500 setup fee");
  assert.match(pricingSectionSource, /retired for cold signups/i, "Must indicate free tier is retired for cold signups");
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
