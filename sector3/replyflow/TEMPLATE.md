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

## Generation UX (required for all Sector 3 tools)

- **Loading bar**: Mount `Sector3LoadingBar` on every tool dashboard. Pass `loading={true}` while any generation request is in flight (search, draft, reply, etc.). Use `variant="replyflow"` or your tool’s theme key.
- **Result bubbles**: Generated output panels use `animate-bubble-in` (one-shot diagonal entrance, then static). Do **not** use `animate-float-bubble` on results — that class is for decorative background skeletons only.

## Portal-hosted tool UI (Signal Desk, GapScan, BridgeAI, future ITs)

When launching a tool inside `northside-intelligence` (not a standalone fork), use the shared factories in `src/lib/sector3-tools/`:

| Surface | Factory / component | Requirements |
|---------|---------------------|--------------|
| Logged-out landing | `createSector3LandingPage` | Title Case headlines (`"Signal Intelligence"` not `"Signal intelligence"`). Centered hero, brand gradient, animated badge, glass preview card. |
| Logged-in dashboard | `createSector3DashboardPage` + `Sector3ToolDashboard` | Centered `max-w-3xl` layout (match ReplyFlow / GrantBot). Glass panels, chip selectors for enum fields (`chipOptions`), usage bar, recent sessions below results. |
| **Generation results** | `Sector3ToolResult` + tool-specific panel in `src/components/sector3/results/` | **Never** show raw markdown (`##`, `**`) to users. Parse AI output into branded UI: urgency badges (Signal Desk), severity cards (GapScan), step timeline (BridgeAI), message bubble (ReplyFlow). GrantBot uses structured JSON + `GrantListingBubble` — keep that pattern. |
| **Simple vs Technical view** | `Sector3PresentationToggle` + `presentation-mode.ts` | **Default to Simple View** — plain-language sections only, no workflows/API jargon. Put technical detail **after** a `---TECHNICAL---` marker in AI prompts (`ai.ts`). **Technical View** unlocks only for paid NI plans, master accounts, or unlimited tool access (`canAccessTechnicalView` in `access.ts`). ReplyFlow and GrantBot stay simple-only. |
| **Results view** | `Sector3DashboardToolbar` | When results appear, **hide the input form**. Show toolbar with **Edit Prompt** (or tool-specific label) to return to inputs. Optional **AI chat** button per tool — coded individually in `chat-content.ts` (`replyflow` disables chat). |
| **AI follow-up chat** | `Sector3ToolChatModal` + `/api/sector3/[slug]/chat` | Per-tool chat config in `chat-content.ts` with custom welcome, button label, and system prompt context. Wire chat only where the tool benefits (GrantBot, Signal Desk, GapScan, BridgeAI). ReplyFlow typically skips chat. |
| Help | `Sector3ToolDashboardFooter` + `help-content.ts` | Footer summary of what the tool does; `?` button opens FAQ modal with **Other** → `/api/sector3/[slug]/help` AI answers. |
| Config | `configs.ts` + `help-content.ts` | Register in `SECTOR3_TOOL_CONFIGS`; add FAQs and summary before shipping. |

**Do not** pass functions from Server Components into client dashboards. The generate API receives field `values` JSON directly.

When adding a new tool, create a dedicated result component (e.g. `MyToolResult.tsx`) and register it in `Sector3ToolResult.tsx`. Use `parseSectionsForMode` from `src/lib/sector3-tools/parse-result.ts` to turn structured AI output into cards, badges, and timelines — not plain text boxes.

**AI prompt pattern for tools with a technical layer:**

```text
## In Plain English
(everyday summary — no jargon)

## Your Step-by-Step Guide
(numbered actions anyone can follow)

---TECHNICAL---
## Integration Goal
(implementation detail for paid Technical View)
```

Register the slug in `TOOLS_WITH_TECHNICAL_VIEW` (`presentation-mode.ts`) and add `presentationMode` prop support in your result component.

Example dashboard field with chips:

```ts
{ id: "scanType", label: "Scan Type", chipOptions: ["Workflow", "Product", "Market"] }
```

## Deploy

Merge to `main` → GitHub Actions runs `npm run build` and `vercel --prod` with `VERCEL_TOKEN`.
