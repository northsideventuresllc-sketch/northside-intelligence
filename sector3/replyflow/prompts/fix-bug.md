# Fix bug — Sector 3 tool

## Triage
1. Reproduce from user report (route, auth state, plan tier).
2. Check Supabase logs and Stripe webhook delivery if billing-related.
3. Read `.cursorrules` — no console logging; verify error paths.

## Fix
- Root cause fix only; no unrelated refactors.
- Supabase: handle `error` on every query/mutation.
- Stripe: preserve signature verification and plan downgrade on cancel.

## Verify
- `npm run build` (env vars required for pages using Supabase at build time).
- Manual test: free user, paid user, webhook event if applicable.

Snippets only. Open PR; wait for JB approval before merge.
