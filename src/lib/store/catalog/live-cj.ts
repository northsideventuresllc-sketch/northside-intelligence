import "server-only";

import { enrichCjProductDetail } from "@/lib/store/sources/cj-detail";
import { getCatalogProductBySlug, mapRow } from "@/lib/store/catalog/products";
import type { CatalogProductRow } from "@/lib/store/catalog/products";
import type { PriceChangeNotice } from "@/lib/store/sources/types";

export interface LiveCjRefreshResult {
  row: CatalogProductRow | null;
  unavailable: boolean;
  priceChanged: boolean;
  notice: PriceChangeNotice | null;
}

function variantsForDb(
  variants: Array<{
    id: string;
    name: string;
    retailPriceCents: number;
    imageUrl: string | null;
    description?: string;
  }>
) {
  return variants.map((v) => ({
    id: v.id,
    name: v.name,
    retail_price_cents: v.retailPriceCents,
    image_url: v.imageUrl,
    description: v.description ?? null,
  }));
}

/** Re-fetch CJ listing price, title, images, and variants; persist to catalog. */
export async function refreshCatalogFromCj(
  row: CatalogProductRow,
  previousRetailCents?: number
): Promise<LiveCjRefreshResult> {
  if (row.sourcePlatform !== "cj" || !row.sourceProductId) {
    return { row: null, unavailable: true, priceChanged: false, notice: null };
  }

  const enriched = await enrichCjProductDetail({
    sourceProductId: row.sourceProductId,
    name: row.name,
    listImageUrl: row.imageUrl ?? undefined,
  });

  if (!enriched) {
    return { row: null, unavailable: true, priceChanged: false, notice: null };
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("ni_store_catalog")
    .update({
      name: enriched.name,
      description: enriched.description,
      image_url: enriched.imageUrl || row.imageUrl,
      image_source: enriched.imageSource,
      supplier_cost_cents: enriched.supplierCostCents,
      retail_price_cents: enriched.retailPriceCents,
      retail_price_min_cents: enriched.retailPriceMinCents,
      retail_price_max_cents: enriched.retailPriceMaxCents,
      cj_variants: variantsForDb(enriched.variants),
      updated_at: new Date().toISOString(),
      active: true,
    })
    .eq("id", row.id)
    .select("*")
    .single();

  if (error || !data) {
    return { row: null, unavailable: true, priceChanged: false, notice: null };
  }

  const updated = mapRow(data as Record<string, unknown>);
  const prior = previousRetailCents ?? row.retailPriceCents;
  const priceChanged = prior !== updated.retailPriceCents;
  const notice: PriceChangeNotice | null = priceChanged
    ? {
        slug: updated.slug,
        name: updated.name,
        previousRetailCents: prior,
        currentRetailCents: updated.retailPriceCents,
        reason:
          "Supplier pricing changed since your last view. Review the updated total before checkout.",
      }
    : null;

  return { row: updated, unavailable: false, priceChanged, notice };
}

export async function refreshCatalogBySlug(
  slug: string,
  previousRetailCents?: number
): Promise<LiveCjRefreshResult> {
  const row = await getCatalogProductBySlug(slug);
  if (!row) return { row: null, unavailable: true, priceChanged: false, notice: null };
  return refreshCatalogFromCj(row, previousRetailCents);
}
