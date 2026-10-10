import { describe, expect, it } from "vitest";
import {
  isSevenDayTrialPromoActive,
  SEVEN_DAY_TRIAL_DAYS,
  SEVEN_DAY_TRIAL_PROMO_END_TS,
} from "./seven-day-trial-promo";

describe("seven-day trial promo date gate (workstream 6)", () => {
  it("ends exactly at 2026-12-01 00:00 UTC", () => {
    expect(SEVEN_DAY_TRIAL_PROMO_END_TS).toBe(Date.UTC(2026, 11, 1, 0, 0, 0, 0));
  });

  it("trial is 7 days", () => {
    expect(SEVEN_DAY_TRIAL_DAYS).toBe(7);
  });

  it("is active on the last promo day (Nov 30, 2026)", () => {
    expect(isSevenDayTrialPromoActive(new Date(Date.UTC(2026, 10, 30, 23, 59, 59)))).toBe(true);
  });

  it("is inactive at the cutoff and after", () => {
    expect(isSevenDayTrialPromoActive(new Date(Date.UTC(2026, 11, 1, 0, 0, 0)))).toBe(false);
    expect(isSevenDayTrialPromoActive(new Date(Date.UTC(2026, 11, 1, 0, 0, 1)))).toBe(false);
    expect(isSevenDayTrialPromoActive(new Date(Date.UTC(2027, 0, 1)))).toBe(false);
  });
});
