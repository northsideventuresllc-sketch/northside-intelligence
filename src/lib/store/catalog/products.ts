import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import type { CatalogProductView } from "@/lib/store/catalog/types";

export interface CatalogProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  category: string;
  tags: string[];
  sourcePlatform: string;
  sourceProductId: string | null;
  supplierCostCents: number;
  retailPriceCents: number;
  currency: string;
  estimatedDeliveryDays: number;
  trendScore: number;
  siteScore: number;
  reviewRating: number | null;
  reviewCount: number;
}

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
    sourceProductId: row.source_product_id != null ? String(row.source_product_id) : null,
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

/** Strip backend-only fields before sending to the browser. */
export function toCatalogProductView(
  row: CatalogProductRow,
  extras?: Partial<Pick<CatalogProductView, "viralRank" | "viralScore" | "personalized">>
): CatalogProductView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    category: row.category,
    tags: row.tags,
    retailPriceCents: row.retailPriceCents,
    currency: row.currency,
    estimatedDeliveryDays: row.estimatedDeliveryDays,
    reviewRating: row.reviewRating,
    reviewCount: row.reviewCount,
    sourcePlatform: row.sourcePlatform,
    ...extras,
  };
}

export async function listActiveCatalogProducts(): Promise<CatalogProductRow[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_catalog")
    .select("*")
    .eq("active", true)
    .order("trend_score", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProductRow | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_catalog")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data) : null;
}

export async function getCatalogProductsByIds(ids: string[]): Promise<CatalogProductRow[]> {
  if (!ids.length) return [];
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("ni_store_catalog").select("*").in("id", ids);

  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((row) => [String(row.id), mapRow(row)]));
  return ids.map((id) => byId.get(id)).filter((p): p is CatalogProductRow => Boolean(p));
}
