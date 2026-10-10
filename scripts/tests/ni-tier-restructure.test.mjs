// Ticket: NI-TIER-RESTRUCTURE (2026-10-09) — JB tier restructure:
// Free: 0 bundled ITs (buy each IT individually)
// Core: 2 SaaS + 1 agentic
// Pro: 4 SaaS + 1 agentic
// Power: 8 SaaS + 4 agentic + 50% off additional ITs once slots are full
// Rule: an agentic slot covers BOTH SaaS and agentic for that tool (no SaaS slot consumed)

import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

const tiers = fs.readFileSync(
  path.resolve(process.cwd(), "src/lib/billing/ni-tiers.ts"),
  "utf8"
);
const entitlements = fs.readFileSync(
  path.resolve(process.cwd(), "src/lib/billing/entitlements.ts"),
  "utf8"
);

test("NI_TIERS slot numbers: Free 0/0, Core 2/1, Pro 4/1, Power 8/4", () => {
  // Free
  assert.match(tiers, /free:\s*\{[\s\S]*?toolSlots:\s*0,/, "Free toolSlots = 0");
  assert.match(tiers, /free:\s*\{[\s\S]*?agenticSlots:\s*0,/, "Free agenticSlots = 0");
  // Core
  assert.match(tiers, /core:\s*\{[\s\S]*?toolSlots:\s*2,/, "Core toolSlots = 2");
  assert.match(tiers, /core:\s*\{[\s\S]*?agenticSlots:\s*1,/, "Core agenticSlots = 1");
  // Pro
  assert.match(tiers, /pro:\s*\{[\s\S]*?toolSlots:\s*4,/, "Pro toolSlots = 4");
  assert.match(tiers, /pro:\s*\{[\s\S]*?agenticSlots:\s*1,/, "Pro agenticSlots = 1");
  // Power
  assert.match(tiers, /power:\s*\{[\s\S]*?toolSlots:\s*8,/, "Power toolSlots = 8");
  assert.match(tiers, /power:\s*\{[\s\S]*?agenticSlots:\s*4,/, "Power agenticSlots = 4");
  assert.match(tiers, /power:\s*\{[\s\S]*?overageDiscount:\s*0\.5,/, "Power overageDiscount = 0.5");
});

test("No tier has unlimited tool access anymore", () => {
  assert.match(
    tiers,
    /export function tierHasUnlimitedToolAccess\([^)]*\)[^{]*\{\s*return false;/,
    "tierHasUnlimitedToolAccess must always return false"
  );
});

test("ni_plan_agentic access type exists and covers SaaS too", () => {
  assert.match(
    entitlements,
    /"ni_plan_agentic"/,
    "ToolkitAccessType must include ni_plan_agentic"
  );
  assert.match(
    entitlements,
    /accessType === "ni_plan_agentic"\) return true;/,
    "ni_plan_agentic must grant SaaS access (userHasUnlimitedToolAccess)"
  );
  assert.match(
    entitlements,
    /canAddNiPlanAgenticTool/,
    "Must have canAddNiPlanAgenticTool for agentic slot enforcement"
  );
});

test("Agentic slot assignment does not consume a SaaS slot", () => {
  // toolSlotsUsed counts only ni_plan entries, not ni_plan_agentic
  assert.match(
    entitlements,
    /toolkit\.filter\(\(t\) => t\.accessType === "ni_plan"\)\.length/,
    "toolSlotsUsed must count only ni_plan, excluding ni_plan_agentic"
  );
  assert.match(
    entitlements,
    /toolkit\.filter\(\(t\) => t\.accessType === "ni_plan_agentic"\)\.length/,
    "Must track ni_plan_agentic slots separately"
  );
});

test("Power 50% overage discount logic exists", () => {
  assert.match(entitlements, /getOverageDiscount/, "Must export getOverageDiscount");
  assert.match(
    entitlements,
    /state\.niTier !== "power"\) return 0;/,
    "Discount only applies on Power tier"
  );
  assert.match(
    entitlements,
    /return saasFull && agenticFull \? 0\.5 : 0;/,
    "Discount applies only when ALL slots are full"
  );
});

test("Checkout applies Power discount via Stripe coupon", () => {
  const checkout = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/billing/checkout/route.ts"),
    "utf8"
  );
  assert.match(checkout, /getOverageDiscount\(state\)/, "Checkout must check overage discount");
  assert.match(checkout, /ni_power_overage_50/, "Must use reusable Power overage coupon");
  assert.match(checkout, /percent_off:\s*50/, "Coupon must be 50% off");
});

test("Agentic slot assignment API route exists with enforcement", () => {
  const route = fs.readFileSync(
    path.resolve(process.cwd(), "src/app/api/billing/toolkit/add-agentic/route.ts"),
    "utf8"
  );
  assert.match(route, /canAddNiPlanAgenticTool/, "Must enforce agentic slot limit");
  assert.match(route, /accessType:\s*"ni_plan_agentic"/, "Must grant ni_plan_agentic access");
  assert.match(route, /No agentic slots remaining/, "Must return 403 when slots full");
});

test("Tier detail copy reflects new slot numbers", () => {
  const details = fs.readFileSync(
    path.resolve(process.cwd(), "src/lib/billing/ni-tier-details.ts"),
    "utf8"
  );
  assert.match(details, /2 SaaS Access IT slots/, "Core copy: 2 SaaS slots");
  assert.match(details, /4 SaaS Access IT slots/, "Pro copy: 4 SaaS slots");
  assert.match(details, /8 SaaS Access IT slots/, "Power copy: 8 SaaS slots");
  assert.match(details, /4 Agentic Access IT slots/, "Power copy: 4 agentic slots");
  assert.match(details, /50% off any additional ITs/, "Power copy: 50% overage discount");
  assert.doesNotMatch(details, /Unlimited Standard Web Tool slots/, "No unlimited copy");
});
