import { CONTENT_MACHINE_SLOT_TIME_BUDGET_MS } from "./constants";

/**
 * Pure elapsed-time-budget check used by generateSlotWithQualityGate()'s retry loop
 * (NI-AXONGEN-ALL-TIERS-DOWN-0907). Kept in its own module — with no import of
 * generator.ts/gemini-first.ts's "server-only"-tainted chain — so it can be unit tested
 * directly with an injected fake clock instead of a real ~220s sleep, the same way
 * scripts/test-content-machine-brand-fix.ts already tests quality-gate.ts in isolation.
 *
 * `now` defaults to `Date.now()` for real callers; tests pass a fake clock function instead.
 * Never trips on attempt 1 — a slot always gets at least one full chain-walk regardless of
 * how long setup before startedAt took.
 */
export function isSlotTimeBudgetExceeded(args: {
  attempt: number;
  startedAt: number;
  budgetMs?: number;
  now?: () => number;
}): boolean {
  const { attempt, startedAt, budgetMs = CONTENT_MACHINE_SLOT_TIME_BUDGET_MS, now = Date.now } = args;
  return attempt > 1 && now() - startedAt >= budgetMs;
}
