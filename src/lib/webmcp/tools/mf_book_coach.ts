import type { ToolHandler } from "../types";

/**
 * Checked the Match Fit repo (/home/user/matchfit, 2026-09-23) for a public
 * booking/checkout link per coach before writing this handler:
 *   - src/app/api/client/trainers/[username]/service-checkout/route.ts is the
 *     ONLY service purchase endpoint in the app, and it starts with
 *     getSessionClientId(); no session -> 401 Unauthorized. There is no
 *     guest/public Stripe Checkout link per coach anywhere in the codebase.
 *   - src/app/trainers/[username]/page.tsx (the public profile page) shows a
 *     coach's services but the "Book"/"Purchase" actions on it route into the
 *     same session-gated checkout API above — it is not itself a checkout link.
 * Since NI must never book or charge from its own side (explicit rule) and
 * Match Fit exposes no public checkout link to hand back as the awaiting-payment
 * step, this tool cannot complete a booking honestly. It also cannot validate a
 * real coach_id first, because mf_search_coaches (same lane) is unavailable for
 * the same reason (no public search API) — there is no source of a real
 * coach_id to check the id against without direct DB access, which is out of
 * scope here.
 *
 * To make this real, Match Fit would need a NEW public endpoint that creates a
 * guest Stripe Checkout Session for one coach's service (mirroring
 * service-checkout/route.ts's use of createTrainerServiceSaleStripeCheckoutSession,
 * minus the session requirement) so this tool could return that session's URL
 * as the awaiting_payment checkout step, coach-side, with Match Fit's own
 * webhook handling fulfilment — the same pattern this lane used for
 * ni_store_order against the Smart Store. That is a Match Fit product change
 * outside this lane's owned files, so it is reported rather than built.
 */
export const handler: ToolHandler = async (_tool, params) => {
  const coachId = typeof params.coach_id === "string" ? params.coach_id.trim() : "";
  return {
    status: "unavailable",
    message: coachId
      ? `Can't book coach "${coachId}" — Match Fit has no public booking/checkout link. Every service purchase requires a logged-in Match Fit client account (src/app/api/client/trainers/[username]/service-checkout requires a session), and Northside Intelligence never books or charges on Match Fit's behalf. A person can book directly at https://match-fit.net after creating a free client account.`
      : "Match Fit has no public booking/checkout link for any coach — every service purchase requires a logged-in Match Fit client account, and Northside Intelligence never books or charges on Match Fit's behalf. A person can book directly at https://match-fit.net after creating a free client account.",
  };
};
