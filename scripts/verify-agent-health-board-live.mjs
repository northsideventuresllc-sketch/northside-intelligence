#!/usr/bin/env node
/**
 * FRONTIER-09-JB-HEALTH-DASHBOARD — the after-merge live-proof run.
 *
 * This repo has no existing `verify-live.mjs` (unlike nv-vault,
 * northsideventuresgroup, northstarswimschool) and no browser-automation
 * dependency (Playwright/Puppeteer) installed, so this is a small,
 * dependency-free equivalent: an authenticated GET against the deployed
 * `/axon/u/[username]/tools/health` page (src/app/axon/u/[username]/tools/health/page.tsx),
 * confirming it renders (200 + the page's own heading text) instead of
 * redirecting to sign-in — that redirect is exactly what an unauthenticated
 * or wrongly-scoped request gets from `requireAxonPortalUser`.
 *
 * This cannot be run by an agent: `requireAxonPortalUser` requires a real
 * Supabase Auth session cookie plus the AXON_SESSION_COOKIE bootstrap cookie
 * for that specific admin username — both come from a real person signing
 * in, which is exactly the PR body's "no live screenshot... needs a real
 * admin session" note. This script is what that person (or a session with a
 * saved admin cookie jar) runs once merged and deployed, as the proof.
 *
 * Usage (after merge + Vercel deploy):
 *   NI_HEALTH_BOARD_URL="https://www.northsideintelligence.com/axon/u/<ADMIN_USERNAME>/tools/health" \
 *   NI_ADMIN_COOKIE="<paste the browser's Cookie header from a signed-in admin session>" \
 *   node scripts/verify-agent-health-board-live.mjs
 *
 * Exit 0 + "LIVE-OK" on a real render; exit 1 with the reason otherwise
 * (redirected to sign-in, non-200, or the heading text is missing).
 */

const url = process.env.NI_HEALTH_BOARD_URL;
const cookie = process.env.NI_ADMIN_COOKIE;

if (!url || !cookie) {
  console.error(
    'FAIL: set NI_HEALTH_BOARD_URL (the live /axon/u/<username>/tools/health URL) ' +
      'and NI_ADMIN_COOKIE (a real signed-in admin session Cookie header) before running this.'
  );
  process.exit(1);
}

const res = await fetch(url, {
  redirect: 'manual',
  headers: { Cookie: cookie },
});

if (res.status >= 300 && res.status < 400) {
  console.error(`FAIL: redirected (status ${res.status}, Location: ${res.headers.get('location')}) — session cookie is not authorized for this page.`);
  process.exit(1);
}

if (!res.ok) {
  console.error(`FAIL: unexpected status ${res.status}`);
  process.exit(1);
}

const body = await res.text();
if (!body.includes('Agent Health')) {
  console.error('FAIL: page returned 200 but did not contain the "Agent Health" heading — check for a build/runtime change.');
  process.exit(1);
}

console.log(`LIVE-OK: ${url} rendered the Agent Health board (status ${res.status}).`);
