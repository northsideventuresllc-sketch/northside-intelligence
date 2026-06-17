import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { ensureStoreEnv } from "@/lib/store/env";
import { enrichCjProductDetail } from "@/lib/store/sources/cj-detail";

/** Re-price and refresh images for existing CJ catalog rows (fixes listV2 low-price parsing). */
export async function refreshCjCatalogListings(limit = 40): Promise<number> {
  await ensureStoreEnv();
  if (!process.env.CJ_DROPSHIPPING_API_KEY?.trim()) return 0;

  const supabase = createServiceClient();
  const { data: rows, error } = await supabase
    .from("ni_store_catalog")
    .select("id, slug, name, source_product_id, supplier_cost_cents, retail_price_cents, image_url")
    .eq("active", true)
    .eq("source_platform", "cj")
    .not("source_product_id", "is", null)
    .order("updated_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);
  if (!rows?.length) return 0;

  let updated = 0;
  for (const row of rows) {
    const sourceProductId = String(row.source_product_id);
    const enriched = await enrichCjProductDetail({
      sourceProductId,
      name: String(row.name),
      listImageUrl: row.image_url ? String(row.image_url) : undefined,
    });
    if (!enriched) continue;

    const retail = calculateRetailPriceCents(enriched.supplierCostCents);
    const needsUpdate =
      enriched.supplierCostCents !== Number(row.supplier_cost_cents) ||
      retail !== Number(row.retail_price_cents) ||
      (enriched.imageUrl && enriched.imageUrl !== row.image_url);

    if (!needsUpdate) continue;

    const { error: updateError } = await supabase
      .from("ni_store_catalog")
      .update({
        supplier_cost_cents: enriched.supplierCostCents,
        retail_price_cents: retail,
        image_url: enriched.imageUrl || row.image_url,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    if (!updateError) updated += 1;
  }

  return updated;
}
