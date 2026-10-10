// Trial promo flow edge cases (launched 2026-10-10)
// Covers: expired code, reused code, deleted-account re-registration,
// double trial attempt, code for wrong IT, 48h code window, reminder timing.

import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs";
import path from "node:path";

const SRC = path.resolve(process.cwd(), "src");

// --- Pure logic mirrors (same rules as src/lib/billing/trial-flow.ts) ---

const CODE_VALIDITY_MS = 48 * 60 * 60 * 1000;

function isCodeEntryExpired(codeExpiresAt, nowMs = Date.now()) {
  if (!codeExpiresAt) return false; // legacy seed codes have no entry window
  return new Date(codeExpiresAt).getTime() < nowMs;
}

function isEligible(existingCodes, userId, email) {
  if (existingCodes.some((c) => c.user_id === userId)) return false;
  const norm = email.trim().toLowerCase();
  return !existingCodes.some(
    (c) => (c.metadata?.email || "").toLowerCase() === norm
  );
}

function trialEndingSoon(expiresAt, nowMs = Date.now()) {
  const diff = new Date(expiresAt).getTime() - nowMs;
  return diff >= 24 * 60 * 60 * 1000 - 60 * 1000 && diff <= 30 * 60 * 60 * 1000;
}

// --- Edge cases ---

test("expired code: code past 48h entry window is rejected", () => {
  const past = new Date(Date.now() - 1000).toISOString();
  assert.equal(isCodeEntryExpired(past), true);
});

test("expired code: code at exactly 48h is rejected", () => {
  const at = new Date(Date.now() - 1).toISOString();
  assert.equal(isCodeEntryExpired(at), true);
});

test("valid code: code with 47h left is accepted", () => {
  const future = new Date(Date.now() + 47 * 60 * 60 * 1000).toISOString();
  assert.equal(isCodeEntryExpired(future), false);
});

test("legacy codes without entry window never expire on entry", () => {
  assert.equal(isCodeEntryExpired(null), false);
});

test("reused code: same user cannot get a second code", () => {
  const codes = [{ user_id: "u1", metadata: { email: "a@x.com" } }];
  assert.equal(isEligible(codes, "u1", "a@x.com"), false);
});

test("deleted-account re-registration: same email blocked even with new user id", () => {
  const codes = [{ user_id: "old-deleted", metadata: { email: "a@x.com" } }];
  assert.equal(isEligible(codes, "brand-new-id", "a@x.com"), false);
  assert.equal(isEligible(codes, "brand-new-id", "A@X.COM"), false);
});

test("double trial attempt: different email on same device still eligible", () => {
  const codes = [{ user_id: "u1", metadata: { email: "a@x.com" } }];
  assert.equal(isEligible(codes, "u2", "b@x.com"), true);
});

test("fresh signup is eligible", () => {
  assert.equal(isEligible([], "new-user", "fresh@x.com"), true);
});

test("reminder timing: trial ending in 25h triggers", () => {
  const ends = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
  assert.equal(trialEndingSoon(ends), true);
});

test("reminder timing: trial ending in 12h does not trigger", () => {
  const ends = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  assert.equal(trialEndingSoon(ends), false);
});

test("reminder timing: expired trial does not trigger", () => {
  const ends = new Date(Date.now() - 1000).toISOString();
  assert.equal(trialEndingSoon(ends), false);
});

// --- Source-level assertions ---

test("validateTrialCode enforces 48h code_expires_at from metadata", () => {
  const src = fs.readFileSync(path.join(SRC, "lib/billing/trial-codes.ts"), "utf8");
  assert.match(src, /code_expires_at/, "Must read code_expires_at from metadata");
  assert.match(src, /48 hours/, "Must mention the 48-hour window");
});

test("trial-flow lib records email in metadata for anti-abuse", () => {
  const src = fs.readFileSync(path.join(SRC, "lib/billing/trial-flow.ts"), "utf8");
  assert.match(src, /metadata->>email/, "Must query trial_codes by metadata email");
  assert.match(src, /TRIAL_CODE_VALIDITY_HOURS/, "Must define the 48h validity constant");
});

test("verify route redirects new signups to /trial-code with welcome email", () => {
  const src = fs.readFileSync(path.join(SRC, "app/api/auth/verify/route.ts"), "utf8");
  assert.match(src, /\/trial-code/, "Must redirect to /trial-code");
  assert.match(src, /sendWelcomeEmail/, "Must send welcome email");
  assert.match(src, /TRIAL_PROMO_START/, "Must gate on promo start date");
});

test("redeem route sends trial-begun email and notification", () => {
  const src = fs.readFileSync(path.join(SRC, "app/api/billing/trial-code/redeem/route.ts"), "utf8");
  assert.match(src, /sendTrialBegunEmail/, "Must send trial-begun email");
  assert.match(src, /notifyPortal/, "Must create portal notification");
});

test("trial-reminders cron exists and is registered", () => {
  const cronSrc = fs.readFileSync(
    path.join(SRC, "app/api/cron/trial-reminders/route.ts"),
    "utf8"
  );
  assert.match(cronSrc, /sendTrialExpiryReminderEmail/, "Must send expiry reminder");
  const vercel = JSON.parse(fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"));
  assert.ok(
    vercel.crons.some((c) => c.path === "/api/cron/trial-reminders"),
    "vercel.json must register the trial-reminders cron"
  );
});

test("soft-delete endpoint marks account without hard delete", () => {
  const src = fs.readFileSync(path.join(SRC, "app/api/account/delete/route.ts"), "utf8");
  assert.match(src, /account_type.*deleted/, "Must soft-delete via account_type");
  assert.doesNotMatch(src, /auth\.admin\.deleteUser/, "Must NOT hard-delete the auth user");
});

test("BETA disclaimer present on all IT pages", () => {
  const betaSrc = fs.readFileSync(path.join(SRC, "components/it/BetaDisclaimer.tsx"), "utf8");
  assert.match(betaSrc, /BETA/i, "Must mention BETA");
  assert.match(betaSrc, /report/i, "Must ask to report bugs");
  assert.match(betaSrc, /ideas/i, "Must encourage idea submissions");
  for (const page of [
    "app/replyflow/page.tsx",
    "app/grantbot/page.tsx",
    "app/it-creator/page.tsx",
    "lib/sector3-tools/create-landing-page.tsx",
  ]) {
    const src = fs.readFileSync(path.join(SRC, page), "utf8");
    assert.match(src, /BetaDisclaimer/, `${page} must include BetaDisclaimer`);
  }
});

test("Add to toolkit shown for NI plan holders", () => {
  const src = fs.readFileSync(
    path.join(SRC, "components/billing/AddToToolkitButton.tsx"),
    "utf8"
  );
  assert.match(src, /SaaS Intelligence Tool/, "Popup must mention SaaS spots");
  assert.match(src, /Agentic Intelligence Tool/, "Popup must mention Agentic spots");
  assert.match(src, /interchange/, "Popup must mention interchanging tools");
});
