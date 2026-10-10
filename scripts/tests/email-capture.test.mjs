// WS10 (client-readiness sweep): 72-hour visitor email capture.
//
// Verifies the pure logic of src/lib/tracking/email-capture.ts:
//   1. Retention window constant is exactly 72 hours (JB's scope).
//   2. Email normalize/validate mirrors normalizeEmailCapture.
//   3. Hashing is deterministic sha256 hex of the normalized email.
//
// Run: node --test scripts/tests/*.mjs
//
// This repo's node --test runner can't resolve the `@/...` TS path aliases or
// transpile TypeScript, so the pure functions are ported here line-for-line
// from src/lib/tracking/email-capture.ts. If those source functions change,
// this file must change with them in the same PR.

import assert from "node:assert/strict";
import { test } from "node:test";
import { createHash } from "node:crypto";

// --- Mirrors src/lib/tracking/email-capture.ts -------------------------------

const EMAIL_CAPTURE_TTL_HOURS = 72;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LEN = 320;

function normalizeEmailCapture(raw) {
  if (typeof raw !== "string") return null;
  const v = raw.trim().toLowerCase();
  if (!v || v.length > MAX_EMAIL_LEN || !EMAIL_RE.test(v)) return null;
  return v;
}

function hashEmailCapture(normalizedEmail) {
  return createHash("sha256").update(normalizedEmail).digest("hex");
}

function expiryIso(fromMs) {
  return new Date(fromMs + EMAIL_CAPTURE_TTL_HOURS * 3600 * 1000).toISOString();
}

// --- Tests -------------------------------------------------------------------

test("retention window is exactly 72 hours", () => {
  assert.equal(EMAIL_CAPTURE_TTL_HOURS, 72);
});

test("expiry is exactly 72h after capture", () => {
  const from = Date.UTC(2026, 9, 9, 12, 0, 0);
  assert.equal(expiryIso(from), new Date(from + 72 * 3600 * 1000).toISOString());
});

test("normalizes valid emails (trim + lowercase)", () => {
  assert.equal(normalizeEmailCapture("  JB@Example.COM "), "jb@example.com");
});

test("rejects junk input", () => {
  for (const bad of [
    "",
    "   ",
    null,
    undefined,
    42,
    {},
    "not-an-email",
    "a@b",
    "a b@c.com",
    "a@b@c.com",
    `${"a".repeat(320)}@x.com`, // over 320 chars
  ]) {
    assert.equal(normalizeEmailCapture(bad), null, JSON.stringify(bad));
  }
});

test("hash is deterministic sha256 hex of the normalized email", () => {
  const a = hashEmailCapture("jb@example.com");
  const b = hashEmailCapture("jb@example.com");
  const c = hashEmailCapture("other@example.com");
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^[0-9a-f]{64}$/);
  // Must hash the NORMALIZED form so "JB@X.com" and "jb@x.com" dedupe.
  assert.equal(
    hashEmailCapture(normalizeEmailCapture("JB@Example.COM")),
    hashEmailCapture("jb@example.com")
  );
});
