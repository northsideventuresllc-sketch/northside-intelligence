# NI Store — Build Notes

Dropship storefront for Northside Intelligence (`shop.northsideintelligence.com` → `/store`).

## Phase 1 (shipped): Viral carousel + personalization loop

| Layer | Path / service | Purpose |
|-------|----------------|---------|
| Storefront | `/store` | Top 10 viral products carousel (24h reset) |
| Product preview | `/store/p/[slug]` | Catalog product detail (cart in Phase 4) |
| Viral API | `GET /api/store/viral` | Global + personalized daily picks |
| Events API | `POST /api/store/events` | Self-learning: views, clicks, searches |
| Preferences | `/api/store/preferences` | Web tracking opt-in per user |
| Cron | `GET /api/cron/store-viral-refresh` | Daily viral re-rank (06:00 UTC) |
| Database | `ni_store_catalog`, `ni_store_viral_picks`, `ni_store_events`, `ni_store_user_preferences` | Catalog, picks, feedback loop |

**Pricing rule:** UI shows `retail_price_cents` only (= supplier cost + 10%). `supplier_cost_cents` is server-only.

**Viral scoring:** 55% web trend score + 35% on-site events + 10% daily theme boost. Logged-in users with activity get a personalized top 10 blend.

## Phase 2 (shipped): Multi-source search

| Layer | Path / service | Purpose |
|-------|----------------|---------|
| Search API | `GET /api/store/search` | CJ + curated catalog search with filters |
| Search UI | `StoreSearch` on `/store` | Query, platform pills, category, retail price range |
| Sources | `src/lib/store/sources/` | CJ live search; AliExpress/Temu stubs for future keys |

Search returns `CatalogProductView[]` only — supplier costs never exposed. CJ hits are upserted into `ni_store_catalog` for PDP links.

## Phase 3 (shipped): Full product landing pages

| Layer | Path | Purpose |
|-------|------|---------|
| PDP | `/store/p/[slug]` | Image, retail price, reviews, source, ETA, expedited shipping |
| Purchase | `ProductPurchasePanel` | Standard vs expedited shipping, Add to Cart |

## Phase 4 (shipped): Cart + checkout

| Layer | Path | Purpose |
|-------|------|---------|
| Cart | `/store/cart` | Line items, shipping tier, estimated S&H |
| Checkout API | `POST /api/store/checkout` | Stripe Checkout with retail + estimated shipping |
| Webhook | `/api/store/webhooks/stripe` | Catalog orders + Make fulfillment |
| Gate API | `GET /api/store/gate` | Checkout live status for UI |

## Legacy merch tables

`ni_store_products` / checkout webhook remain for original NI merch mock catalog.

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `CJ_DROPSHIPPING_API_KEY` | Recommended | Pulls live trending SKUs into daily picks |
| `CRON_SECRET` | Production cron | Bearer token for viral refresh (also in `ni_platform_secrets`) |
| `STRIPE_SECRET_KEY` | Checkout phases | Shared with portal billing |
| `STRIPE_WEBHOOK_SECRET_STORE` | Checkout phases | Store webhook only |
| `MAKE_STORE_WEBHOOK_URL` | Fulfillment | Make → CJDropshipping |
| `NI_STORE_LIVE` | Launch flag | Enables live checkout when wired |

## Stripe webhook events

- `checkout.session.completed`
