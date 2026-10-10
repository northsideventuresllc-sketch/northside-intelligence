import "server-only";

/**
 * Workstream 6 — 7-day free-trial promo.
 *
 * Any new IT subscription (CheckoutButton / toolkit tool subscriptions /
 * NI plan subscriptions / ReplyFlow checkout) created while this promo is
 * active gets `trial_period_days: 7` on the Stripe subscription. The card is
 * collected at checkout; nothing is charged until the trial ends.
 *
 * DATE GATE: the promo applies only to signups before 2026-12-01 00:00 UTC
 * (i.e. through the end of Nov 30, 2026). The check is done server-side at
 * checkout-session creation time, so the promo stops applying automatically
 * after Nov 30 with no manual kill-switch needed.
 */

export const SEVEN_DAY_TRIAL_DAYS = 7;

/** Exclusive cutoff — signups at/after this instant do NOT get the trial. */
export const SEVEN_DAY_TRIAL_PROMO_END_ISO = "2026-12-01T00:00:00.000Z";

export const SEVEN_DAY_TRIAL_PROMO_END_TS = Date.parse(SEVEN_DAY_TRIAL_PROMO_END_ISO);

/** Metadata marker written onto trial-promo checkout sessions / subscriptions. */
export const SEVEN_DAY_TRIAL_PROMO_META = "seven_day_trial_promo_2026";

export function isSevenDayTrialPromoActive(now: Date = new Date()): boolean {
  return now.getTime() < SEVEN_DAY_TRIAL_PROMO_END_TS;
}
