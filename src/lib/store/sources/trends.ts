import "server-only";

import { DROPSHIP_SOURCE_PLATFORMS } from "@/lib/store/platform-labels";

export { DROPSHIP_SOURCE_PLATFORMS };

/** Rotating viral keyword themes — refreshed daily in cron to simulate web trend research. */
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
