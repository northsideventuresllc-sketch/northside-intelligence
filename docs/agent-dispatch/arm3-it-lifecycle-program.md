# ARM3 IT Lifecycle Program v2

JB requirements (Jul 2026) decomposed into six dispatchable initiatives.

## Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  M/W/F 10 AM ET — ARM3-1                                        │
│  Discover IT → Preview deploy → Executive summary → AXON notify │
│  [APPROVE] [CHANGE] [DENY]                                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │ APPROVE
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Production on NI Portal + master toolkit + AXON skeleton flag  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ 90 days
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  IT-2 — IT Report: metrics + AI recommendation                  │
│  [KEEP 365d] [TRIAL +30d] [REMOVE → archive]                    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ REMOVE
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  arm3_archived_tools — master-only Archived ITs UI              │
│  Manual revive: 30d or 90d trial                                │
└───────────────────────────┬─────────────────────────────────────┘
                            │ monthly
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  IT-3 — Archive vault scan → revival IT Report if AI agrees       │
└─────────────────────────────────────────────────────────────────┘

Parallel UX: NAV-5/6 (admin removal + dropdown), AXON-4 (test panel)
```

## Initiative map

| JB # | Dispatch ID | Brief |
|------|-------------|-------|
| 1 | ARM3-1 | `subagents/ARM3-1-executive-launch.md` |
| 2 | IT-2 | `subagents/IT-2-lifecycle-90day.md` |
| 3 | IT-3 | `subagents/IT-3-archive-scan.md` |
| 4 | AXON-4 | `subagents/AXON-4-test-notifications.md` |
| 5 | NAV-5 | `subagents/NAV-5-remove-admin.md` |
| 6 | NAV-6 | `subagents/NAV-6-axon-dropdown.md` |

## Existing infrastructure (main @ 2026-07-10)

| Asset | Path | Notes |
|-------|------|-------|
| Dispatch DB | `agent_dispatch` (NI-Brain) | Seeded by migration `20260710120000_*` |
| Dispatch UI | `src/components/axon-ui/dispatch-queue-panel.tsx` | Fire + chat per task |
| Test Mode | `src/components/axon-ui/test-mode-tool.tsx` | Extend for AXON-4 IT types |
| IT Builder | `src/components/axon-ui/it-builder-tool.tsx` | AXON tool skeleton after ARM3-1 APPROVE |

**Note:** `NI-AXON-ADMIN` was marked done in dispatch history but `/admin` route still exists — NAV-5 still required.


- ARM3 scaffolds GitHub only — no AI summary, no preview gate, no AXON buttons
- `arm3_tool_evals` / `arm3_pattern_signals` exist in SQL — **no app code**
- Admin dashboard stub at `/admin` — to be removed (NAV-5)
- Flat AXON nav link — needs dropdown (NAV-6)
- Test notifications: outreach/pipeline only — not IT types (AXON-4)

## Checker requirements (all initiatives)

Every PR must pass:

1. **Subagent Checker** (different model than runner)
2. `npm run build`
3. Brief acceptance criteria checklist
4. Master-only gates verified
5. No production launch without APPROVE

## How JB dispatches

In NI Portal Manager chat:

```
dispatch NAV-5
dispatch NAV-6
dispatch ARM3-1
```

Or human manual dispatch in Cloud Agents UI with brief path pasted into prompt.

## AXON Manager handoff

When initiative touches AXON embedded UI, AXON Manager runs parallel brief with same ID; `sync-ni-portal.yml` merges to NI.
