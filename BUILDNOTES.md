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
| Sources | `src/lib/store/sources/` | CJ live search; AliExpress/Temu stubs for future keys |
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
| `ALIEXPRESS_API_KEY` | Future | AliExpress Open Platform (see below) |
| `TEMU_API_KEY` | Future | Temu partner API (see below) |

## Adding AliExpress and Temu (next dropship platforms)

Both adapters are stubbed in `src/lib/store/sources/aliexpress.ts` and `temu.ts`. They return `[]` until credentials are set. Follow this pattern to go live:

### 1. Partner API access

**AliExpress**

1. Register at [AliExpress Open Platform](https://openservice.aliexpress.com/) (Affiliate or Dropshipping program).
2. Create an app and obtain **App Key** + **App Secret** (OAuth or server-to-server depending on program).
3. Enable product search / item detail APIs for your app scope.
4. Store credentials in `ni_platform_secrets` as `ALIEXPRESS_API_KEY` (or split into `ALIEXPRESS_APP_KEY` / `ALIEXPRESS_APP_SECRET` if you extend the adapter).

**Temu**

1. Apply for [Temu Open Platform](https://partner.temu.com/) seller or partner API access (program availability varies by region).
2. Obtain API credentials for product catalog search.
3. Store in `ni_platform_secrets` as `TEMU_API_KEY`.

### 2. Implement the source adapter

Mirror `src/lib/store/sources/cj.ts`:

| Step | What to build |
|------|----------------|
| Auth | `aliexpress-auth.ts` / `temu-auth.ts` — token refresh if needed |
| Search | `searchAliExpressProducts(query, limit)` → `SourceProductDraft[]` |
| Pricing | Parse supplier USD cost; never expose to client |
| Images | Use platform image URL; fallback to `searchWebProductImage(name)` |
| Detail | Optional enrich endpoint for accurate variant price + gallery |

Each draft must set: `name`, `description`, `imageUrl`, `category` (item type, e.g. `kitchen`), `tags`, `sourceProductId`, `supplierCostCents`, `estimatedDeliveryDays`, `sourcePlatform: "aliexpress" | "temu"`.

Retail is always `calculateRetailPriceCents(supplierCostCents)` — supplier + 10%.

### 3. Wire into search aggregation

`src/lib/store/search/aggregate.ts` already imports both stubs. Once adapters return data, hits are upserted via `upsertSearchDrafts()` and appear in search + PDP.

Add platform labels in `src/lib/store/platform-labels.ts` if not present.

### 4. Hydrate secrets at runtime

`src/lib/hydrate-platform-env.ts` already loads `ALIEXPRESS_API_KEY` and `TEMU_API_KEY` from `ni_platform_secrets`. Add rows:

```sql
INSERT INTO ni_platform_secrets (key, value) VALUES
  ('ALIEXPRESS_API_KEY', 'your-key'),
  ('TEMU_API_KEY', 'your-key')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
```

### 5. Fulfillment (Make.com)

Extend your Make scenario to route orders by `source_platform`:

- `cj` → existing CJDropshipping module
- `aliexpress` → AliExpress order API
- `temu` → Temu order API

Webhook payload from `/api/store/webhooks/stripe` includes `source_platform` and `source_product_id` per line item.

### 6. Images in Next.js

Store components use `StoreProductImage` with `unoptimized` so AliExpress/Temu CDN hostnames work without editing `next.config.mjs` for every domain.

### 7. Test checklist

- [ ] Search returns mixed CJ + AliExpress + Temu results
- [ ] Retail = supplier listing + 10% on PDP and cards
- [ ] Supplier name only in small footer (“via AliExpress”), not in category filters
- [ ] Checkout webhook sends correct platform per SKU

## Stripe webhook events

- `checkout.session.completed`
