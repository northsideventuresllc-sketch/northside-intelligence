# Session Log

Agent session notes. **Read the 🚨 URGENT block first** — do not bury alerts in Carry-over.

## Carry-over

- **ARM3 FIX (NI-ARM3-V) in progress:** Gate IT generation until **2026-09-01** America/New_York. Secrets already hydrated in GH Actions (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`). Pre-gate failure was duplicate `outreachhq` insert — not auth. After merge: expect `[SKIPPED] IT pause until 2026-09-01` + green `workflow_dispatch`.
- **Deploy edge:** `generate-tool` preview-gate from #141 still needs edge redeploy when pause lifts (portal cron gate is defense-in-depth).
- **ARM3 data:** Pre-fix failures; weekly log write-back after green smoke.
