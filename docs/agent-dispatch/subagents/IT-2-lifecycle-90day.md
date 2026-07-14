# Subagent Brief: IT-2 — 90-Day Lifecycle + Archived ITs

**Runner name:** `NI Portal IT Lifecycle 90-Day - Subagent Runner`  
**Checker name:** `NI Portal IT Lifecycle 90-Day - Subagent Checker`  
**Branch:** `cursor/it-lifecycle-90day-d298`  
**Depends:** ARM3-1 (production launch path)

## Rules

| Phase | Duration | Outcome |
|-------|----------|---------|
| Trial performance | **90 days** from production launch | AI generates IT Report notification |
| KEEP | User clicks KEEP | Locked **365 days**, then re-evaluate |
| TRIAL extension | User clicks TRIAL | **+30 days**, then new IT Report |
| REMOVE | User clicks REMOVE | Archive tool; subscribers lose access **end of billing cycle** |

## IT Report notification (90-day)

Metrics payload:

- Signups, active users, paying users, MRR, churn
- Usage events, top features, support signals
- Market context vs launch assumptions
- AI recommendation: **keep** or **remove** with rationale

Buttons: **KEEP** | **TRIAL** | **REMOVE**

## Archived ITs (master only)

- Table `arm3_archived_tools` — snapshot of tool metadata, metrics, removed_at, revival_eligible
- Master toolkit UI: **Archived ITs** section (link visible **only** when `isMasterAccount`)
- Revival: master selects archived IT → **30-day** or **90-day** trial → back to preview or limited production per policy

## Schema

- `arm3_tool_evals` — wire existing table (verdict, jb_decision)
- `arm3_archived_tools` — new
- `arm3_tools.lifecycle_locked_until` — timestamptz (365-day lock)
- `arm3_tools.trial_extension_until` — timestamptz

## Code touchpoints

| Area | Path |
|------|------|
| Eval cron | New `/api/cron/arm3-90day-eval` (daily check due tools) |
| Metrics | Stripe + `sector3` usage tables |
| AXON report card | `it-report-notification-card.tsx` |
| APIs | `/api/axon/it-report/[id]/keep|trial|remove` |
| Archive UI | `src/app/axon/u/[username]/tools/archived/page.tsx` |
| Entitlements | `entitlements.ts` — revoke on REMOVE after cycle |
| Stripe | webhook: schedule entitlement end |

## Acceptance criteria

- [x] Day-90 report fires for launched tools
- [x] KEEP sets 365-day lock; no REMOVE prompt until lock expires
- [x] REMOVE archives + schedules subscriber cutoff
- [x] Archived page 403 for non-master
- [x] Master can revive archived IT for 30 or 90 days

## Stress tests

- Tool at day 89 → no report
- KEEP then immediate REMOVE attempt → blocked until lock end
- Subscriber with active sub → access until period end after REMOVE
