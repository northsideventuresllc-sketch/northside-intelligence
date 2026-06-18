# Smart Store — Build Notes

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

**Pricing rule:** UI shows `retail_price_cents` only (= supplier listing price + 10%). `supplier_cost_cents` is server-only.

CJ `listV2` returns price ranges like `"0.66 -- 3.54"`. We parse the **listing high** via `parseCjListingPriceUsd()` in `src/lib/store/sources/cj-pricing.ts`, then enrich each SKU with `product/query` for variant prices and images. Verify locally: `npm run verify:cj-pricing`.

**Images:** CJ `productImage`, `bigImage`, and variant images are tried first (`enrichCjProductDetail`). If none load, optional SerpAPI Google Images fallback (`SERPAPI_API_KEY`) searches by product name.

**Viral scoring:** 55% web trend score + 35% on-site events + 10% daily theme boost. Logged-in users with activity get a personalized top 10 blend.

Daily cron also runs `refreshCjCatalogListings()` to re-price existing CJ rows in `ni_store_catalog`.

## Phase 2 (shipped): CJ search with live pricing

| Layer | Path / service | Purpose |
|-------|----------------|---------|
| Search API | `GET /api/store/search` | CJ-only search with live price refresh on every query |
| Search UI | `StoreSearchSidebar` + `StoreSearchResults` on `/store` | Query, item-type category filter, retail price range |
| Sources | `src/lib/store/sources/cj.ts` | CJ product search; NI Deals / curated rows excluded |
| Categories | `src/lib/store/categories.ts` | Item-type filters (kitchen, tech, etc.) — not supplier platforms |

Search returns exact CJ listing titles and live NI retail prices (CJ listing + 10%). Price change notices appear when CJ pricing shifts between searches.

## Phase 3 (shipped): Full product landing pages

| Layer | Path | Purpose |
|-------|------|---------|
| PDP | `/store/p/[slug]` | Live CJ refresh, exact title, variants, stock-image disclaimer |
| Purchase | `ProductPurchasePanel` | CJ variation selector, standard vs expedited shipping, Add to Cart |

## Phase 4 (shipped): Cart + checkout

| Layer | Path | Purpose |
|-------|------|---------|
| Cart | `/store/cart` | Persistent saved cart (`localStorage`), live CJ verify on load |
| Cart verify | `POST /api/store/cart/verify` | Re-price saved cart lines from CJ |
| Checkout API | `POST /api/store/checkout` | Stripe Checkout; 409 + disclaimer if CJ prices changed |
| Webhook | `/api/store/webhooks/stripe` | Catalog orders + Make fulfillment |
| Gate API | `GET /api/store/gate` | Checkout live status for UI |

## Legacy merch tables

`ni_store_products` / checkout webhook remain for original NI merch mock catalog.

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `CJ_DROPSHIPPING_API_KEY` | Recommended | Pulls live trending SKUs into daily picks |
| `SERPAPI_API_KEY` | Optional | Web image fallback when supplier image is missing |
| `CRON_SECRET` | Production cron | Bearer token for viral refresh (also in `ni_platform_secrets`) |
| `STRIPE_SECRET_KEY` | Checkout phases | Shared with portal billing |
| `STRIPE_WEBHOOK_SECRET_STORE` | Checkout phases | Store webhook only |
| `MAKE_STORE_WEBHOOK_URL` | Fulfillment | Make → CJDropshipping |
| `NI_STORE_LIVE` | Launch flag | Enables live checkout when wired |

## Dropship platform (CJ only)

| Platform | Role | Credentials |
|----------|------|-------------|
| **CJ Dropshipping** | Sole supplier — search, viral picks, checkout | `CJ_DROPSHIPPING_API_KEY` ✅ |

Retail = CJ listing price (or selected variation price) + 10%. SerpAPI is used only when CJ has no reachable product image; those cards show a stock-photo disclaimer.

### Fulfillment (Make.com)

Stripe webhook payload includes per line item:

- `sourcePlatform` — `cj`
- `sourceProductId` — CJ product id
- `variantId` — CJ variation when selected

Route in Make: `cj` → CJDropshipping module.

### Test checklist

- [ ] Search returns CJ results only (no NI Deals)
- [ ] Product titles match CJ listings copy/paste
- [ ] Retail = CJ listing + 10%; variant prices on PDP
- [ ] Stock-image disclaimer when SerpAPI fallback used
- [ ] Saved cart persists; checkout 409 when CJ price changes

## Stripe webhook events

- `checkout.session.completed`
