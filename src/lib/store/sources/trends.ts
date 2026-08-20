import "server-only";

import { DROPSHIP_SOURCE_PLATFORMS } from "@/lib/store/platform-labels";

export { DROPSHIP_SOURCE_PLATFORMS };

/**
 * NOT real trend research and NOT AI-generated. This is a fixed, hand-written keyword
 * list keyed by day-of-week (0=Sunday..6=Saturday) — there is no external trend API,
 * no web scraping, and no model call anywhere in this file. It exists to rotate which
 * product tags get a small scoring boost in `scoreCatalogProduct`
 * (`src/lib/store/viral/scoring.ts`) so the "viral picks" list doesn't look static
 * day to day. Confirmed 2026-08-20 (JB build task): making this genuinely
 * trend/AI-driven (a real trend-data source feeding these tags) is a separate, bigger
 * build — do not assume this is live signal anywhere it's read.
 */
export const DAILY_TREND_THEMES: Record<number, string[]> = {
  0: ["portable", "wireless", "smart-home", "viral", "tiktok"],
  1: ["fitness", "health", "kitchen", "meal-prep", "viral"],
  2: ["tech", "office", "remote-work", "audio", "viral"],
  3: ["beauty", "skincare", "wellness", "sleep", "viral"],
  4: ["pets", "home", "decor", "lighting", "viral"],
  5: ["auto", "cleaning", "car", "portable", "viral"],
  6: ["entertainment", "projector", "gaming", "viral", "tiktok"],
};

export function getTodaysTrendTags(): string[] {
  const day = new Date().getUTCDay();
  return DAILY_TREND_THEMES[day] ?? DAILY_TREND_THEMES[0];
}
