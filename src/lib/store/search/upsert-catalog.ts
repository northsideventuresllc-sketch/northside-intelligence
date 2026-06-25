import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { draftSlug } from "@/lib/store/search/draft-to-view";
import type { SourceProductDraft } from "@/lib/store/sources/types";

function variantsForDb(draft: SourceProductDraft) {
  return draft.variants.map((v) => ({
    id: v.id,
    name: v.name,
    retail_price_cents: v.retailPriceCents,
    image_url: v.imageUrl,
    description: v.description ?? null,
  }));
}

function rowFromDraft(draft: SourceProductDraft) {
  const slug = draftSlug(draft);
  const retail = calculateRetailPriceCents(draft.supplierCostCents);
  return {
    slug,
    name: draft.name,
    description: draft.description,
    image_url: draft.imageUrl,
    image_source: draft.imageSource,
    category: draft.category,
    tags: draft.tags,
    source_platform: "cj" as const,
    source_product_id: draft.sourceProductId,
    supplier_cost_cents: draft.supplierCostCents,
    retail_price_cents: retail,
    retail_price_min_cents: draft.retailPriceMinCents,
    retail_price_max_cents: draft.retailPriceMaxCents,
    cj_variants: variantsForDb(draft),
    estimated_delivery_days: draft.estimatedDeliveryDays,
    active: true,
    updated_at: new Date().toISOString(),
  };
}

/** Persist CJ catalog drafts (search hits, viral ingest, bulk sync). */
export async function upsertCatalogDrafts(drafts: SourceProductDraft[]): Promise<number> {
  const cjDrafts = drafts.filter((d) => d.sourcePlatform === "cj");
  if (!cjDrafts.length) return 0;

  const supabase = createServiceClient();
  const rows = cjDrafts.map(rowFromDraft);

  const { error } = await supabase.from("ni_store_catalog").upsert(rows, { onConflict: "slug" });
  if (error) throw new Error(error.message);

  return rows.length;
}

/** @deprecated Use upsertCatalogDrafts */
export async function upsertSearchDrafts(drafts: SourceProductDraft[]): Promise<void> {
  await upsertCatalogDrafts(drafts);
}
