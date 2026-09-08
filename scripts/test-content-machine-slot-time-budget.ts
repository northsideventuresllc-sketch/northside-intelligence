/**
 * Regression test for the content-machine elapsed-time budget fix
 * (NI-AXONGEN-ALL-TIERS-DOWN-0907, run manually:
 * `npx tsx scripts/test-content-machine-slot-time-budget.ts`).
 *
 * Root cause: generateSlotWithQualityGate() always launched MAX_REGEN_ATTEMPTS + 1 = 3
 * full chain-walks through axonGenerate() regardless of how long the earlier attempts
 * actually took. Bounding a single attempt's local-tier wait (CONTENT_MACHINE_LOCAL_TIER_TIMEOUT_MS)
 * doesn't bound the retry loop itself -- live re-verification after that fix still hit the
 * route's full 300s FUNCTION_INVOCATION_TIMEOUT because the local Ollama tier legitimately
 * takes 60-120s+ per real generation, and 3 attempts of that adds up past budget even though
 * no single call is absurdly slow.
 *
 * This tests the extracted, pure isSlotTimeBudgetExceeded() helper against an injected fake
 * clock (no real ~220s sleep) -- proving:
 *  1. Attempt 1 NEVER trips the budget, no matter how much time has already elapsed (a slot
 *     always gets at least one full chain-walk).
 *  2. Attempt 2+ trips the budget once elapsed time reaches/exceeds the configured budget.
 *  3. Attempt 2+ does NOT trip the budget while comfortably under it (normal/fast runs are
 *     unaffected).
 *  4. The default budget matches CONTENT_MACHINE_SLOT_TIME_BUDGET_MS (220s), safely under this
 *     route's 300s maxDuration.
 */
import { isSlotTimeBudgetExceeded } from "../src/lib/content-machine/slot-time-budget";
import { CONTENT_MACHINE_SLOT_TIME_BUDGET_MS } from "../src/lib/content-machine/constants";

let failed = 0;
function check(cond: boolean, msg: string) {
  if (!cond) {
    failed++;
    console.error(`FAIL: ${msg}`);
  } else {
    console.log(`ok:   ${msg}`);
  }
}

// Fake clock helper: startedAt=0, `now` advances to whatever ms value the test wants.
function fakeNow(ms: number) {
  return () => ms;
}

// 1. Attempt 1 never trips the budget, even if the injected clock says huge elapsed time
//    has already passed (e.g. slow setup work before the loop started its own clock).
check(
  isSlotTimeBudgetExceeded({ attempt: 1, startedAt: 0, budgetMs: 1000, now: fakeNow(999_999) }) === false,
  "attempt 1 never trips the time budget regardless of elapsed time"
);

// 2. Attempt 2+ trips once elapsed time reaches the budget exactly.
check(
  isSlotTimeBudgetExceeded({ attempt: 2, startedAt: 0, budgetMs: 1000, now: fakeNow(1000) }) === true,
  "attempt 2 trips the budget once elapsed time equals budgetMs exactly"
);

// 3. Attempt 2+ trips once elapsed time exceeds the budget.
check(
  isSlotTimeBudgetExceeded({ attempt: 3, startedAt: 0, budgetMs: 1000, now: fakeNow(5000) }) === true,
  "attempt 3 trips the budget once elapsed time is well past budgetMs"
);

// 4. Attempt 2+ does NOT trip while comfortably under budget -- normal/fast runs unaffected.
check(
  isSlotTimeBudgetExceeded({ attempt: 2, startedAt: 0, budgetMs: 1000, now: fakeNow(200) }) === false,
  "attempt 2 does not trip the budget while comfortably under it (fast runs unaffected)"
);

// 5. startedAt offset is honored (elapsed = now - startedAt, not just now).
check(
  isSlotTimeBudgetExceeded({ attempt: 2, startedAt: 10_000, budgetMs: 1000, now: fakeNow(10_500) }) === false,
  "elapsed is computed as now() - startedAt, 500ms elapsed does not trip a 1000ms budget"
);
check(
  isSlotTimeBudgetExceeded({ attempt: 2, startedAt: 10_000, budgetMs: 1000, now: fakeNow(11_200) }) === true,
  "elapsed is computed as now() - startedAt, 1200ms elapsed trips a 1000ms budget"
);

// 6. Default budgetMs/now: called with just attempt+startedAt, using the real
//    CONTENT_MACHINE_SLOT_TIME_BUDGET_MS and Date.now() -- a startedAt far in the past
//    trips it, a startedAt of "just now" does not.
check(
  isSlotTimeBudgetExceeded({ attempt: 2, startedAt: Date.now() - CONTENT_MACHINE_SLOT_TIME_BUDGET_MS - 1_000 }) === true,
  "default budget (CONTENT_MACHINE_SLOT_TIME_BUDGET_MS) trips when startedAt is older than the budget"
);
check(
  isSlotTimeBudgetExceeded({ attempt: 2, startedAt: Date.now() }) === false,
  "default budget does not trip when startedAt is effectively now"
);

if (failed > 0) {
  console.error(`\n${failed} check(s) FAILED`);
  process.exit(1);
} else {
  console.log("\nAll checks passed.");
}
