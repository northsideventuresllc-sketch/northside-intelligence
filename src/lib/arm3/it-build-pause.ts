/** Shared IT Build Pause gate — no new Sector 3 IT generation before this date. */
export const IT_PAUSE_UNTIL = "2026-09-01";

/** True when today's calendar date in America/New_York is before IT_PAUSE_UNTIL. */
export function isItBuildPaused(now = new Date()): boolean {
  const etDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  return etDate < IT_PAUSE_UNTIL;
}
