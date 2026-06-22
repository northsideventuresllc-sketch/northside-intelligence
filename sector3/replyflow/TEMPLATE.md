# NI Sector 3 — Tool Pipeline Template (ReplyFlow base)

Fork this repo to launch a new Sector 3 tool. Keep the same stack: **Next.js App Router**, **Supabase** (NI Brain project), **Stripe**, **Vercel**.

## Fork checklist

1. Copy repo → rename in `package.json` and README.
2. Replace table prefix: `replyflow_*` → `{tool}_*` (migrations + all queries).
3. Create Stripe products/prices; update env price IDs.
4. Register subdomain in `vercel.json` and Vercel project.
5. Add tool entry to `northside-intelligence` → `src/lib/tools.ts`.
6. Configure GitHub Actions secrets (see `.github/workflows/deploy.yml`).
7. Add a **tool-specific favicon** (`src/app/icon.svg`) derived from `public/logos/{tool}.svg` — never reuse the NI portal hex emblem (`/icon.svg` on northsideintelligence.com).

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (NI Brain) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon key (client + SSR) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role for webhooks and server-side writes |
| Vercel AI Gateway | Yes (prod) | OIDC on Vercel; enable in project settings |
| `AI_GATEWAY_API_KEY` | Optional | Local dev / CI fallback for AI Gateway |
| `ANTHROPIC_API_KEY` | Optional | Legacy direct Anthropic fallback |
| `STRIPE_SECRET_KEY` | Yes | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | Signing secret for `/api/webhooks/stripe` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Yes | Stripe.js publishable key |
| `STRIPE_SOLO_PRICE_ID` | Yes | Price ID for entry paid tier |
| `STRIPE_TEAM_PRICE_ID` | Yes | Price ID for mid tier |
| `STRIPE_AGENCY_PRICE_ID` | Yes | Price ID for top tier |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical app URL (checkout redirects) |
| `TIER` | Yes | Deployment tier: `lite` (capped limits) or `pro` (full limits) |
| `VERCEL_TOKEN` | CI only | Vercel deploy token (GitHub Actions) |
| `VERCEL_ORG_ID` | CI only | Vercel team/org ID |
| `VERCEL_PROJECT_ID` | CI only | Vercel project ID |

Never commit secrets. Use `.env.local` locally and Vercel/GitHub encrypted secrets in production.

## Supabase tables (prefix convention)

All tool tables use **`{tool}_`** prefix on the shared NI Brain project.

| Table | Purpose |
|-------|---------|
| `{tool}_profiles` | Per-user row keyed by `auth.users.id` (uuid): `plan`, Stripe IDs, usage counters |

ReplyFlow reference: `replyflow_profiles`

- `plan`: `free` \| `solo` \| `team` \| `agency` (subscription tier from Stripe)
- `stripe_customer_id`, `stripe_subscription_id`
- `replies_used_this_month`, `replies_reset_at`

Enable RLS; users read/update own row; service role for webhooks.

## Stripe webhook events

Handled in `src/app/api/webhooks/stripe/route.ts`:

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `plan` + Stripe IDs on profile (`metadata.userId`) |
| `customer.subscription.deleted` | Downgrade `plan` to `free`, clear subscription id |
| `customer.subscription.updated` | Active → sync plan from price; canceled/unpaid → `free` |

## Billing section (landing `#pricing`)

Every Sector 3 tool landing page must show **two plans side by side**:

| Plan | Price | Specs |
|------|-------|-------|
| **Free** | $0/mo | Monthly usage cap (e.g. 10 replies/month), add to NI Toolkit, core AI features |
| **Unlimited** | Base monthly from catalog | Unlimited usage, no cap, cancel anytime |

Canonical free-tier caps and units live in `northside-intelligence` → `src/lib/billing/sector3-tool-pricing.ts`. Portal tools use `ToolFreemiumPricingGrid` (`ToolFreePricingCard` + `ToolMonthlyPricingCard`).

When forking this template, update the `plans` array in `src/app/page.tsx` with your tool’s free cap and paid monthly price.

## Tier gating

- **Deployment**: `TIER` env (`lite` \| `pro`) caps `PLAN_LIMITS` in `src/lib/tier.ts`.
- **Per user**: Read `plan` from `{tool}_profiles` in API routes — never hardcode.

## Deploy

Merge to `main` → GitHub Actions runs `npm run build` and `vercel --prod` with `VERCEL_TOKEN`.
