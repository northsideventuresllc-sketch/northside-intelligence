import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { CatalogProductRow } from "@/lib/store/catalog/products";

function mapRow(row: Record<string, unknown>): CatalogProductRow {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    imageUrl: (row.image_url as string) ?? null,
    category: String(row.category ?? "general"),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    sourcePlatform: String(row.source_platform ?? "curated"),
    supplierCostCents: Number(row.supplier_cost_cents),
    retailPriceCents: Number(row.retail_price_cents),
    currency: String(row.currency ?? "usd"),
    estimatedDeliveryDays: Number(row.estimated_delivery_days ?? 12),
    trendScore: Number(row.trend_score ?? 0),
    siteScore: Number(row.site_score ?? 0),
    reviewRating: row.review_rating != null ? Number(row.review_rating) : null,
    reviewCount: Number(row.review_count ?? 0),
  };
}

interface CuratedSearchOptions {
  category?: string;
  minRetailCents?: number;
  maxRetailCents?: number;
  limit: number;
}

export async function searchCuratedCatalog(
  query: string,
  options: CuratedSearchOptions
): Promise<CatalogProductRow[]> {
  const supabase = createServiceClient();
  let builder = supabase.from("ni_store_catalog").select("*").eq("active", true);

  if (options.category) {
    builder = builder.eq("category", options.category);
  }
  if (options.minRetailCents != null) {
    builder = builder.gte("retail_price_cents", options.minRetailCents);
  }
  if (options.maxRetailCents != null) {
    builder = builder.lte("retail_price_cents", options.maxRetailCents);
  }

  const trimmed = query.trim();
  if (trimmed) {
    const pattern = `%${trimmed.replace(/[%_]/g, "")}%`;
    builder = builder.or(
      `name.ilike.${pattern},description.ilike.${pattern},category.ilike.${pattern}`
    );
  }

  const { data, error } = await builder
    .order("site_score", { ascending: false })
    .order("trend_score", { ascending: false })
    .limit(options.limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function listCatalogCategories(): Promise<string[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_catalog")
    .select("category")
    .eq("active", true);

  if (error) throw new Error(error.message);
  const categories = new Set<string>();
  for (const row of data ?? []) {
    const category = String(row.category ?? "").trim();
    if (category) categories.add(category);
  }
  return Array.from(categories).sort();
}
