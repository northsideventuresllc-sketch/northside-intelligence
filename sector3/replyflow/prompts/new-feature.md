# New feature — Sector 3 tool

## Before coding
- Read `.cursorrules` and relevant routes under `src/app/`.
- Confirm auth requirement (public vs dashboard vs API).
- If feature touches usage or billing, read `src/lib/tier.ts` and `replyflow_profiles`.

## Implementation
- App Router: prefer server components; API routes for mutations and webhooks.
- Read user plan from Supabase; enforce limits via `PLAN_LIMITS`.
- Snippets only; match naming and file layout of neighboring code.

## Done when
- Types compile; no new `console.*` calls.
- Supabase/Stripe calls check errors.
- User-facing errors are JSON messages with appropriate HTTP status.

Wait for JB PR approval before merging.
