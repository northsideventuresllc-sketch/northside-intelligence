# Infra Health Check

Weekly automated check (Mondays 9am ET) plus manual `npm run infra:health-check`.

## Endpoints

| Service | Ping URL | Expected |
|---------|----------|----------|
| NI Store | `GET https://www.northsideintelligence.com/api/store/webhook` | 200 |
| Match Fit | `GET https://match-fit.net/api/webhooks/stripe` | 200 |

Match Fit must expose a GET health handler on its Stripe webhook route (same pattern as NI Store `pingStoreStripeWebhook()`).

## Failure handling

Failures prepend **🚨 URGENT** to `docs/session-log.md`. The GitHub Actions workflow commits that file to `main` when checks fail.

## Required GitHub Actions secrets

- `GH_PAT` — push urgent session-log commits
- `SUPABASE_SERVICE_KEY` (or `SUPABASE_SERVICE_ROLE_KEY`)
- `VERCEL_TOKEN`
- `ANTHROPIC_API_KEY`
- `SUPABASE_URL` — arm3 table queries
