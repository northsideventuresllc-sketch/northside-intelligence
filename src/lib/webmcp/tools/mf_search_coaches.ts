import type { ToolHandler } from "../types";

/**
 * Checked the Match Fit repo (/home/user/matchfit, 2026-09-23) for a public,
 * unauthenticated coach search/listing API before writing this handler:
 *   - src/app/api/client/trainers/browse/route.ts — the only coach *search/browse*
 *     endpoint in the app — requires getSessionClientId(); returns 401 Unauthorized
 *     with no session.
 *   - src/app/client/dashboard/(app)/find-trainers/page.tsx — the only coach
 *     discovery *page* — lives inside the client dashboard route group, which is
 *     gated on a logged-in client.
 *   - src/app/api/public/trainers/[username]/availability/route.ts is public but
 *     only returns ONE named trainer's booking hours — it needs a username you
 *     already have, so it can't power a "specialty" or "budget" search.
 *   - There is no public sitemap/directory listing of trainer usernames either.
 * Result: Match Fit has no public search surface at all right now, so this tool
 * cannot honestly return real coach results without either scraping the DB
 * directly (explicitly out of scope — "no direct DB access to Match Fit") or
 * fabricating coaches (explicitly banned).
 *
 * To make this tool real, Match Fit would need a NEW public, unauthenticated
 * endpoint (e.g. GET /api/public/trainers/search) that reuses the same
 * nationwide-only (no city/location filter, ever) visibility rules as
 * src/app/api/client/trainers/browse/route.ts — clientDiscoveryVisibleTrainerProfileWhere,
 * isTrainerVisibleInClientDiscovery, publicMarketplaceVisibleTrainerWhere — and
 * returns username/displayName/bio/fitnessNiches/price tier per coach. That is a
 * genuine Match Fit product change, outside this lane's owned files
 * (src/lib/webmcp/tools/mf_search_coaches.ts here), so it is reported rather
 * than built.
 */
export const handler: ToolHandler = async () => ({
  status: "unavailable",
  message:
    "Match Fit has no public coach search API yet — every coach browse/search endpoint (src/app/api/client/trainers/browse) requires a logged-in Match Fit client, and there's no public directory or sitemap of coach usernames either. This tool can't fabricate coach results, so it can't run until Match Fit ships a public, unauthenticated search endpoint. In the meantime, a person can search after creating a free Match Fit client account at https://match-fit.net.",
});
