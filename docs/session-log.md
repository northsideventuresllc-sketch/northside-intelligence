# Session Log

Agent session notes. **Read the 🚨 URGENT block first** — do not bury alerts in Carry-over.

## Carry-over

- **ARM3 pipeline:** Service-role auth fixed (edge v8 + portal cron prefers vault key). Smoke `generate-tool` returns **500 `GITHUB_PAT is not configured`** — auth OK; JB must add `GITHUB_PAT` to `ni_platform_secrets` + GitHub Actions for scaffold step.
- **ARM3 data:** `arm3_weekly_logs` last row 2026-06-11; no pipeline cron success in GH Actions history yet.

