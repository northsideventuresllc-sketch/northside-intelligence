# Agent Dispatch Queue — northside-intelligence

**Program:** ARM3 IT Lifecycle v2 (Jul 2026)  
**Last updated:** 2026-07-10

| ID | Initiative | Repo | Status | Depends | Next action |
|----|------------|------|--------|---------|-------------|
| ARM3-1 | M/W/F launch + executive summary + APPROVE/CHANGE/DENY | NI + AXON | **shipped** | — | Deploy edge `generate-tool`; wire Vercel preview API |
| IT-2 | 90-day eval + KEEP/TRIAL/REMOVE + Archived ITs (master only) | NI + AXON | **shipped** | ARM3-1 | Wire Stripe revoke + trial follow-up cron |
| IT-3 | Monthly archive vault scan + revival IT report | NI | **shipped** | IT-2 | Replace heuristic scorer with research edge |
| AXON-4 | IT notification type test buttons | NI + AXON | **shipped** | ARM3-1 notification types | — |
| NAV-5 | Remove Admin Dashboard; AXON = admin | NI | **shipped** | — | — |
| NAV-6 | AXON nav dropdown (Home / Dash) | NI | **shipped** | NAV-5 | — |

## Shipped (skip)

| ID | Note |
|----|------|
| ARM3-verify | Service-role auth NI #138; GITHUB_PAT in vault |
| Track-B | Outreach PATCH API live (`e0af2b4`, `b69234f`) |
| ARM3 IT Lifecycle v2 | Dispatch system + v1 implementation (Jul 2026) |

## Dispatch order (recommended)

```
NAV-5 → NAV-6 → ARM3-1 → AXON-4 → IT-2 → IT-3
```

All six initiatives have v1 code on `main` after merge. Follow-up: Vercel preview deploy, Stripe cutoff on REMOVE, AI metrics in 90-day reports.
