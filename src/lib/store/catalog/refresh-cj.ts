import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { normalizeStoreCategory } from "@/lib/store/catalog/classify-category";
import { ensureStoreEnv } from "@/lib/store/env";
import { enrichCjProductDetail } from "@/lib/store/sources/cj-detail";

function variantsForDb(
  variants: Array<{ id: string; name: string; retailPriceCents: number; imageUrl: string | null }>
) {
  return variants.map((v) => ({
    id: v.id,
    name: v.name,
    retail_price_cents: v.retailPriceCents,
    image_url: v.imageUrl,
  }));
}

/** Re-price and refresh images for existing CJ catalog rows (fixes listV2 low-price parsing). */
export async function refreshCjCatalogListings(limit = 40): Promise<number> {
  await ensureStoreEnv();
  if (!process.env.CJ_DROPSHIPPING_API_KEY?.trim()) return 0;

  const supabase = createServiceClient();
  const { data: rows, error } = await supabase
    .from("ni_store_catalog")
    .select("id, slug, name, category, source_product_id, supplier_cost_cents, retail_price_cents, image_url")
    .eq("active", true)
    .eq("source_platform", "cj")
    .not("source_product_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!rows?.length) return 0;

  let updated = 0;
  for (const row of rows) {
    const enriched = await enrichCjProductDetail({
      sourceProductId: String(row.source_product_id),
      name: String(row.name),
      listImageUrl: row.image_url ? String(row.image_url) : undefined,
    });
    if (!enriched) continue;

    const category = await normalizeStoreCategory({
      name: enriched.name,
      description: enriched.description,
      existingCategory: row.category != null ? String(row.category) : null,
    });

    const { error: updateError } = await supabase
      .from("ni_store_catalog")
      .update({
        name: enriched.name,
        description: enriched.description,
        category,
        supplier_cost_cents: enriched.supplierCostCents,
        retail_price_cents: enriched.retailPriceCents,
        retail_price_min_cents: enriched.retailPriceMinCents,
        retail_price_max_cents: enriched.retailPriceMaxCents,
        image_url: enriched.imageUrl || row.image_url,
        image_source: enriched.imageSource,
        cj_variants: variantsForDb(enriched.variants),
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!updateError) updated += 1;
  }

  return updated;
}
