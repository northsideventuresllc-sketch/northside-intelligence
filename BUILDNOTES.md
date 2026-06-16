# NI Store v1 — Build Notes

Physical merchandise storefront for Northside Intelligence (`shop.northsideintelligence.com` → `/store`).

## Architecture

| Layer | Path / service | Purpose |
|-------|----------------|---------|
| Storefront | `/store` | Product catalog (mock seeds until CJ wired) |
| Checkout API | `/api/store/checkout` | Stripe Checkout (gated) |
| Stripe webhook | `/api/store/webhooks/stripe` | Order fulfillment trigger |
| Make.com | `MAKE_STORE_WEBHOOK_URL` | Routes paid orders to CJDropshipping workflow |
| Database | `ni_store_*` tables (NI-Brain) | Products, orders, line items |

## Gating (required before launch)

Checkout stays **disabled** until all are true:

1. `CJ_DROPSHIPPING_API_KEY` is set (CJ API wired)
2. `MAKE_STORE_WEBHOOK_URL` is set (Make scenario live)
3. `NI_STORE_LIVE=true` (manual launch flag)

While gated, `/store` shows a **Coming Soon** banner and mock products cannot reach Stripe.

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `STRIPE_SECRET_KEY` | Yes | Shared with portal billing |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Client-side Stripe.js (future) |
| `STRIPE_WEBHOOK_SECRET_STORE` | Yes | Signing secret for `/api/store/webhooks/stripe` only |
| `MAKE_STORE_WEBHOOK_URL` | Yes (for live) | Make.com custom webhook URL |
| `CJ_DROPSHIPPING_API_KEY` | Yes (for live) | CJDropshipping API key |
| `NI_STORE_LIVE` | Launch flag | Default unset/false |
| `ANTHROPIC_API_KEY` | Optional | Product copy tooling (ReplyFlow) |

Secrets may also live in `ni_platform_secrets` when absent from Vercel.

## Deployment checklist

1. Verify Vercel env: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. Add `STRIPE_WEBHOOK_SECRET_STORE`, `MAKE_STORE_WEBHOOK_URL` to Vercel (or `ni_platform_secrets`)
3. Run `supabase/migrations/002_ni_store.sql` on NI-Brain (`kxijunwgbrlfzvgkhklo`)
4. Register Stripe webhook: `https://northsideintelligence.com/api/store/webhooks/stripe`
5. Add domain `shop.northsideintelligence.com` on Vercel project `northside-intelligence`
6. `npm run build` → merge `feature/ni-store-v1` → `main`

## Stripe webhook events

- `checkout.session.completed`

## Mock products

Seeded in migration with `is_mock = true`. Checkout API rejects mock SKUs even if gating were bypassed.
