import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

test("Database migration creates trial_codes table, atomic redemption RPC, and expiration downgrade function", () => {
  const migrationPath = path.resolve(
    root,
    "supabase/migrations/20261007200000_sector3_trial_codes_and_agentic_tier.sql"
  );
  assert.ok(fs.existsSync(migrationPath), "Migration file must exist");
  const sql = fs.readFileSync(migrationPath, "utf8");

  // Schema checks
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.trial_codes/i, "Must create trial_codes table");
  assert.match(sql, /code\s+text\s+NOT NULL\s+UNIQUE/i, "Code must be unique");
  assert.match(sql, /used_at\s+(?:timestamptz|timestamp with time zone)/i, "Must have used_at timestamp");
  assert.match(sql, /user_id\s+uuid/i, "Must track user_id");
  assert.match(sql, /expires_at\s+(?:timestamptz|timestamp with time zone)/i, "Must track expires_at timestamp");
  assert.match(sql, /duration_days\s+integer\s+NOT NULL\s+DEFAULT\s+7/i, "Must default to 7-day duration");

  // Atomic single-use RPC
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.redeem_trial_code/i, "Must create atomic redeem_trial_code RPC");
  assert.match(sql, /FOR UPDATE/i, "Must lock row with FOR UPDATE for concurrency safety");
  assert.match(sql, /(?:INTERVAL '7 days'|duration_days.*?days.*?:interval)/i, "Must grant 7 days duration");

  // Automatic downgrade function
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.expire_ni_entitlements/i, "Must update expire_ni_entitlements function");
  assert.match(sql, /access_type\s*=\s*'free'/i, "Must downgrade expired trial to free tier");
  assert.match(sql, /tk\.access_type\s*=\s*'trial'/i, "Must target expired trials");
});

test("Trial code backend handles validation, single-use atomic enforcement, and 7-day duration", () => {
  const backendPath = path.resolve(root, "src/lib/billing/trial-codes.ts");
  assert.ok(fs.existsSync(backendPath), "trial-codes.ts must exist");
  const code = fs.readFileSync(backendPath, "utf8");

  assert.match(code, /validateTrialCode/, "Must export validateTrialCode");
  assert.match(code, /redeemTrialCode/, "Must export redeemTrialCode");
  assert.match(code, /getTrialStatus/, "Must export getTrialStatus");
  assert.match(code, /duration_days \?\? 7/, "Must enforce 7 days default");
  assert.match(code, /This trial code has already been redeemed/, "Must reject already used codes");
});

test("API routes exist for trial code redemption and validation", () => {
  const redeemRoute = path.resolve(root, "src/app/api/billing/trial-code/redeem/route.ts");
  const validateRoute = path.resolve(root, "src/app/api/billing/trial-code/validate/route.ts");

  assert.ok(fs.existsSync(redeemRoute), "Redeem API route must exist");
  assert.ok(fs.existsSync(validateRoute), "Validate API route must exist");
});

test("TrialCodeRedemptionBox is integrated across all 5 IT dashboards", () => {
  const dashboards = [
    { name: "replyflow", path: "src/app/replyflow/dashboard/DashboardClient.tsx" },
    { name: "grantbot", path: "src/app/grantbot/dashboard/DashboardClient.tsx" },
    { name: "signaldesk", path: "src/app/signaldesk/dashboard/DashboardClient.tsx" },
    { name: "gapscan", path: "src/app/gapscan/dashboard/DashboardClient.tsx" },
    { name: "bridgeai", path: "src/app/bridgeai/dashboard/DashboardClient.tsx" },
    { name: "generic", path: "src/components/sector3/Sector3ToolDashboard.tsx" },
  ];

  for (const db of dashboards) {
    const fullPath = path.resolve(root, db.path);
    assert.ok(fs.existsSync(fullPath), `${db.name} dashboard file must exist`);
    const content = fs.readFileSync(fullPath, "utf8");
    assert.match(content, /TrialCodeRedemptionBox/, `${db.name} dashboard must include TrialCodeRedemptionBox`);
    assert.match(content, /hasUnlimitedAccess/, `${db.name} dashboard must check unlimited access before rendering`);
  }
});

test("AuthForm and Signup pages must NOT include trial code input (trial flow lives only on /trial-code)", () => {
  const authFormPath = path.resolve(root, "src/components/auth/AuthForm.tsx");
  const authForm = fs.readFileSync(authFormPath, "utf8");
  assert.doesNotMatch(authForm, /7-Day Free Trial Code/i, "AuthForm must NOT have trial code input label");
  assert.doesNotMatch(authForm, /trialCode/i, "AuthForm must NOT bind trialCode state");
  assert.doesNotMatch(authForm, /trial_code/i, "AuthForm must NOT reference trial_code");

  const signups = [
    "src/app/replyflow/signup/page.tsx",
    "src/app/grantbot/signup/page.tsx",
    "src/app/signaldesk/signup/page.tsx",
    "src/app/gapscan/signup/page.tsx",
    "src/app/bridgeai/signup/page.tsx",
  ];

  for (const s of signups) {
    const p = path.resolve(root, s);
    assert.ok(fs.existsSync(p), `Signup page ${s} must exist`);
    const content = fs.readFileSync(p, "utf8");
    assert.doesNotMatch(content, /trial/i, `Signup page ${s} must NOT forward trial codes`);
  }

  // The dedicated trial-code page must still exist
  assert.ok(
    fs.existsSync(path.resolve(root, "src/app/trial-code/page.tsx")),
    "Dedicated /trial-code page must exist"
  );
});

test("Agentic Access Coming Soon badge and card describe required capabilities in plain language", () => {
  const cardPath = path.resolve(root, "src/components/billing/AgenticTierComingSoonCard.tsx");
  assert.ok(fs.existsSync(cardPath), "AgenticTierComingSoonCard must exist");
  const card = fs.readFileSync(cardPath, "utf8");

  // Exact required badge and capabilities
  assert.match(card, /Agentic Access Coming Soon/, "Must include 'Agentic Access Coming Soon' badge");
  assert.match(card, /Autonomous background monitoring/i, "Must list background monitoring capability");
  assert.match(card, /Multi-agent synthesis/i, "Must list multi-agent synthesis capability");
  assert.match(card, /Direct webhook, CRM,/i, "Must list webhook/CRM/comms capability");
});

test("STRICT PRICING RULE: Zero pricing numbers or dollar signs on Agentic Tier card or preview drawer", () => {
  const card = fs.readFileSync(
    path.resolve(root, "src/components/billing/AgenticTierComingSoonCard.tsx"),
    "utf8"
  );
  const drawer = fs.readFileSync(
    path.resolve(root, "src/components/sector3/Sector3MCPDrawer.tsx"),
    "utf8"
  );
  const switcher = fs.readFileSync(
    path.resolve(root, "src/components/sector3/Sector3TierSwitcher.tsx"),
    "utf8"
  );

  // Check that no price strings like $XX, $/mo, or dollar numbers exist for agentic tier
  assert.doesNotMatch(card, /\$\d+/, "Agentic card must NOT contain any dollar pricing figures");
  assert.doesNotMatch(drawer, /\$\d+[\s\S]*?agentic/i, "Agentic drawer must NOT contain dollar pricing figures");
  assert.doesNotMatch(switcher, /\$\s*\{[^}]*agenticMonthlyUsd[^}]*\}/i, "Tier switcher must NOT display agentic dollar prices");
  assert.doesNotMatch(switcher, /⚡\s*Agentic\s*Tier[\s\S]*?\$\d+/i, "Tier switcher button must NOT display a dollar price on agentic tier");
});

test("All 5 IT tools' pricing grids and drawers include Agentic Access Coming Soon components", () => {
  const gridPath = path.resolve(root, "src/components/billing/ToolFreemiumPricingGrid.tsx");
  const grid = fs.readFileSync(gridPath, "utf8");
  assert.match(grid, /AgenticTierComingSoonCard/, "ToolFreemiumPricingGrid must include AgenticTierComingSoonCard");

  const replyflowPricing = fs.readFileSync(
    path.resolve(root, "src/components/replyflow/ReplyFlowPricingSection.tsx"),
    "utf8"
  );
  assert.match(replyflowPricing, /AgenticTierComingSoonCard/, "ReplyFlow pricing must include AgenticTierComingSoonCard");

  const grantbotPricing = fs.readFileSync(
    path.resolve(root, "src/components/grantbot/GrantBotPricingSection.tsx"),
    "utf8"
  );
  assert.match(grantbotPricing, /AgenticTierComingSoonCard/, "GrantBot pricing must include AgenticTierComingSoonCard");
});
