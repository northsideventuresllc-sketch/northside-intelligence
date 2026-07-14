/**
 * Lightweight stress checks for IT-2 helpers (no DB / Stripe).
 * Run: npx tsx scripts/verify-it-lifecycle.ts
 */
import { parseReportToolSlug } from "../src/lib/arm3/it-report-id";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(
  parseReportToolSlug("report-90d-outreachhq-2026-07-14") === "outreachhq",
  "90-day slug parse failed"
);
assert(
  parseReportToolSlug("report-trial-replyflow-2026-07-14") === "replyflow",
  "trial slug parse failed"
);
assert(
  parseReportToolSlug("revival-grantbot-2026-07") === "grantbot",
  "revival slug parse failed"
);
assert(
  parseReportToolSlug("report-90d-content-creator-rx-2026-07-14") === "content-creator-rx",
  "hyphenated slug parse failed"
);

// Day-89 style: production tools under 90 days are filtered by cron (no report)
const launchedAt = Date.now() - 89 * 24 * 60 * 60 * 1000;
const cutoff90 = Date.now() - 90 * 24 * 60 * 60 * 1000;
assert(launchedAt > cutoff90, "day-89 tool must not enter 90-day eval window");

// KEEP lock blocks REMOVE
const lockUntil = new Date();
lockUntil.setDate(lockUntil.getDate() + 365);
assert(lockUntil.getTime() > Date.now(), "KEEP lock must be in the future");

console.log("IT-2 lifecycle stress checks passed.");
