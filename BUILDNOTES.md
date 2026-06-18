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

**Pricing rule:** UI shows `retail_price_cents` only (= supplier listing price + 10%). `supplier_cost_cents` is server-only.

CJ `listV2` returns price ranges like `"0.66 -- 3.54"`. We parse the **listing high** via `parseCjListingPriceUsd()` in `src/lib/store/sources/cj-pricing.ts`, then enrich each SKU with `product/query` for variant prices and images. Verify locally: `npm run verify:cj-pricing`.

**Images:** CJ `productImage`, `bigImage`, and variant images are tried first (`enrichCjProductDetail`). If none load, optional SerpAPI Google Images fallback (`SERPAPI_API_KEY`) searches by product name.

**Viral scoring:** 55% web trend score + 35% on-site events + 10% daily theme boost. Logged-in users with activity get a personalized top 10 blend.

Daily cron also runs `refreshCjCatalogListings()` to re-price existing CJ rows in `ni_store_catalog`.

## Phase 2 (shipped): Multi-source search

| Layer | Path / service | Purpose |
|-------|----------------|---------|
| Search API | `GET /api/store/search` | CJ + curated catalog search with filters |
| Search UI | `StoreSearchSidebar` + `StoreSearchResults` on `/store` | Query, item-type category filter, retail price range |
| Sources | `src/lib/store/sources/` | CJ + Spocket + Zendrop search; curated NI deals |
| Categories | `src/lib/store/categories.ts` | Item-type filters (kitchen, tech, etc.) — not supplier platforms |

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
| `SERPAPI_API_KEY` | Optional | Web image fallback when supplier image is missing |
| `CRON_SECRET` | Production cron | Bearer token for viral refresh (also in `ni_platform_secrets`) |
| `STRIPE_SECRET_KEY` | Checkout phases | Shared with portal billing |
| `STRIPE_WEBHOOK_SECRET_STORE` | Checkout phases | Store webhook only |
| `MAKE_STORE_WEBHOOK_URL` | Fulfillment | Make → CJDropshipping |
| `NI_STORE_LIVE` | Launch flag | Enables live checkout when wired |
| `SPOCKET_API_KEY` | Recommended | US/EU fast-ship catalog via Spocket REST API |
| `ZENDROP_API_KEY` | Recommended | US fast-ship catalog via Zendrop MCP (`catalog:read`) |

## Dropship platforms (CJ + Spocket + Zendrop)

| Platform | Role | Credentials |
|----------|------|-------------|
| **CJ Dropshipping** | Global viral catalog, low cost | `CJ_DROPSHIPPING_API_KEY` ✅ |
| **Spocket** | US/EU suppliers, 2–7 day shipping | `SPOCKET_API_KEY` |
| **Zendrop** | US warehouse catalog, fast shipping | `ZENDROP_API_KEY` (MCP token) |

Search aggregates all three plus curated NI deals. Retail = supplier listing + 10%.

### Spocket setup

1. Sign up at [spocket.co](https://www.spocket.co/) and choose a plan with API access.
2. In the Spocket dashboard, open **Settings → API** (or Integrations) and copy your **API key**.
3. Store as `SPOCKET_API_KEY` in `ni_platform_secrets` and Vercel (`northside-intelligence`).

Adapter: `src/lib/store/sources/spocket.ts` → `GET https://api.spocket.co/v1/products` with Bearer auth.

### Zendrop setup

1. Sign up at [zendrop.com](https://www.zendrop.com/).
2. In account settings, generate an **MCP access token** with **`catalog:read`** scope (and `orders:write` when ready for fulfillment).
3. Store as `ZENDROP_API_KEY` in `ni_platform_secrets` and Vercel.

Adapter: `src/lib/store/sources/zendrop.ts` → Zendrop MCP `get_catalog_products` at `https://app.zendrop.com/mcp/v1`.

### Vault insert (NI Brain)

```sql
INSERT INTO ni_platform_secrets (key, value) VALUES
  ('SPOCKET_API_KEY', 'your-spocket-key'),
  ('ZENDROP_API_KEY', 'your-zendrop-mcp-token')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
```

Or run: `SPOCKET_API_KEY=... ZENDROP_API_KEY=... ./scripts/set-vercel-infra.sh` (with `VERCEL_TOKEN` set).

### Fulfillment (Make.com)

Stripe webhook payload includes per line item:

- `sourcePlatform` — `cj` | `spocket` | `zendrop`
- `sourceProductId` — supplier SKU id
- `cjProductId` — legacy field (CJ only)

Route in Make:

- `cj` → CJDropshipping module
- `spocket` → Spocket order API
- `zendrop` → Zendrop order fulfillment

### Test checklist

- [ ] Search returns CJ + Spocket + Zendrop results
- [ ] Retail = supplier listing + 10%
- [ ] Footer shows “via Spocket” / “via Zendrop” (not in category filters)
- [ ] Make receives `sourcePlatform` + `sourceProductId` per item

## Stripe webhook events

- `checkout.session.completed`
