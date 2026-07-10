# Subagent Brief: IT-3 — Monthly Archive Vault Scan

**Runner name:** `NI Portal Archive Vault Scan - Subagent Runner`  
**Checker name:** `NI Portal Archive Vault Scan - Subagent Checker`  
**Branch:** `cursor/it-archive-monthly-scan-d298`  
**Depends:** IT-2 (`arm3_archived_tools`)

## Behavior

**Monthly** (1st of month, 9 AM ET):

1. Load all `arm3_archived_tools` where `revival_eligible = true`
2. Run deep market research (SERPAPI / Anthropic) per archived IT
3. Pattern match against `arm3_pattern_signals` + current market trends
4. If AI score ≥ threshold → create **IT Report (revival candidate)** notification in AXON
5. JB/master sees recommendation: trial revival worth another 30 days?

Uses same IT Report notification shell as IT-2 with `report_type: archive_revival`.

## Code touchpoints

| Area | Path |
|------|------|
| Cron | `.github/workflows/arm3-archive-scan.yml` or `vercel.json` cron |
| Edge | `supabase/functions/arm3-archive-scan/index.ts` |
| Research | Reuse CM research patterns if available |
| Notify | Insert AXON notification via `ni_brain` or preferences API |

## Acceptance criteria

- [ ] Monthly cron runs without archived rows → idle log
- [ ] High-score archive → exactly one revival notification
- [ ] Low-score archive → no notification
- [ ] Revival from notification links to IT-2 revive flow

## Stress tests

- Empty archive table
- 50 archived tools → batch limit / rate limits
- Duplicate month scan → idempotent (no duplicate notifications)
