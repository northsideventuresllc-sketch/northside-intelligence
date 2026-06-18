import "server-only";

import { refreshCjCatalogListings } from "@/lib/store/catalog/refresh-cj";
import { mapRow } from "@/lib/store/catalog/products";
import { createServiceClient } from "@/lib/supabase/server";
import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { ensureStoreEnv } from "@/lib/store/env";
import { fetchCjTrendingProducts } from "@/lib/store/sources/cj";
import { getTodaysTrendTags } from "@/lib/store/sources/trends";
import { EVENT_WEIGHTS, scoreCatalogProduct } from "@/lib/store/viral/scoring";
import type { SourceProductDraft } from "@/lib/store/sources/types";

function utcDateString(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function variantsForDb(draft: SourceProductDraft) {
  return draft.variants.map((v) => ({
    id: v.id,
    name: v.name,
    retail_price_cents: v.retailPriceCents,
    image_url: v.imageUrl,
  }));
}

async function getSiteEventCounts(): Promise<Map<string, number>> {
  const supabase = createServiceClient();
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 7);

  const { data, error } = await supabase
    .from("ni_store_events")
    .select("catalog_id, event_type")
    .gte("created_at", since.toISOString())
    .not("catalog_id", "is", null);

  if (error) throw new Error(error.message);

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const id = String(row.catalog_id);
    const weight = EVENT_WEIGHTS[String(row.event_type)] ?? 1;
    counts.set(id, (counts.get(id) ?? 0) + weight);
  }
  return counts;
}

async function upsertCjProducts(): Promise<void> {
  await ensureStoreEnv();
  const drafts = await fetchCjTrendingProducts(25);
  if (!drafts.length) return;

  const supabase = createServiceClient();
  for (const draft of drafts) {
    const slug = `cj-${draft.sourceProductId}`.toLowerCase().replace(/[^a-z0-9-]/g, "-");
    const retail = calculateRetailPriceCents(draft.supplierCostCents);
    await supabase.from("ni_store_catalog").upsert(
      {
        slug,
        name: draft.name,
        description: draft.description,
        image_url: draft.imageUrl,
        image_source: draft.imageSource,
        category: draft.category,
        tags: draft.tags,
        source_platform: "cj",
        source_product_id: draft.sourceProductId,
        supplier_cost_cents: draft.supplierCostCents,
        retail_price_cents: retail,
        retail_price_min_cents: draft.retailPriceMinCents,
        retail_price_max_cents: draft.retailPriceMaxCents,
        cj_variants: variantsForDb(draft),
        estimated_delivery_days: draft.estimatedDeliveryDays,
        trend_score: 95,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
  }
}

/** Refresh global top-10 viral picks for today (24h cycle). CJ products only. */
export async function refreshDailyViralPicks(): Promise<{ pickDate: string; count: number }> {
  await upsertCjProducts();
  await refreshCjCatalogListings(50);

  const supabase = createServiceClient();
  const pickDate = utcDateString();
  const trendTags = new Set(getTodaysTrendTags());
  const siteCounts = await getSiteEventCounts();

  const { data: catalog, error: catalogError } = await supabase
    .from("ni_store_catalog")
    .select("*")
    .eq("active", true)
    .eq("source_platform", "cj");

  if (catalogError) throw new Error(catalogError.message);

  const scored = (catalog ?? [])
    .map((row) => {
      const product = mapRow(row as Record<string, unknown>);
      const score = scoreCatalogProduct(product, siteCounts, trendTags);
      return { id: product.id, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  await supabase.from("ni_store_viral_picks").delete().eq("pick_date", pickDate);

  if (scored.length) {
    const { error: insertError } = await supabase.from("ni_store_viral_picks").insert(
      scored.map((item, i) => ({
        pick_date: pickDate,
        rank: i + 1,
        catalog_id: item.id,
        viral_score: item.score,
        trend_source: "cj+blended",
      }))
    );
    if (insertError) throw new Error(insertError.message);
  }

  for (const [catalogId, count] of Array.from(siteCounts.entries())) {
    await supabase
      .from("ni_store_catalog")
      .update({ site_score: count, updated_at: new Date().toISOString() })
      .eq("id", catalogId);
  }

  return { pickDate, count: scored.length };
}

export function getNextViralResetIso(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.toISOString();
}

export { utcDateString };
