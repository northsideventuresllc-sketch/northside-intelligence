import "server-only";

import type { CatalogVariantView } from "@/lib/store/sources/types";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { sanitizeCjDescription } from "@/lib/store/catalog/description";

export interface CatalogProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string | null;
  imageSource: "cj" | "serpapi" | null;
  category: string;
  tags: string[];
  sourcePlatform: string;
  sourceProductId: string | null;
  supplierCostCents: number;
  retailPriceCents: number;
  retailPriceMinCents: number | null;
  retailPriceMaxCents: number | null;
  currency: string;
  estimatedDeliveryDays: number;
  trendScore: number;
  siteScore: number;
  reviewRating: number | null;
  reviewCount: number;
  variants: CatalogVariantView[];
}

function parseVariants(raw: unknown): CatalogVariantView[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (entry == null || typeof entry !== "object") return null;
      const v = entry as Record<string, unknown>;
      const id = v.id != null ? String(v.id) : "";
      const name = v.name != null ? String(v.name) : "";
      const retailPriceCents = Number(v.retail_price_cents ?? v.retailPriceCents);
      if (!id || !name || !Number.isFinite(retailPriceCents)) return null;
      const imageUrl = v.image_url ?? v.imageUrl;
      const descriptionRaw = v.description ?? v.variant_description;
      return {
        id,
        name,
        retailPriceCents,
        imageUrl: typeof imageUrl === "string" ? imageUrl : null,
        description: typeof descriptionRaw === "string" ? descriptionRaw : undefined,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);
}

export function mapRow(row: Record<string, unknown>): CatalogProductRow {
  const imageSourceRaw = row.image_source as string | null | undefined;
  const imageSource =
    imageSourceRaw === "cj" || imageSourceRaw === "serpapi" ? imageSourceRaw : null;

  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: sanitizeCjDescription(String(row.description ?? "")),
    imageUrl: (row.image_url as string) ?? null,
    imageSource,
    category: String(row.category ?? "general"),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    sourcePlatform: String(row.source_platform ?? "cj"),
    sourceProductId: row.source_product_id != null ? String(row.source_product_id) : null,
    supplierCostCents: Number(row.supplier_cost_cents),
    retailPriceCents: Number(row.retail_price_cents),
    retailPriceMinCents:
      row.retail_price_min_cents != null ? Number(row.retail_price_min_cents) : null,
    retailPriceMaxCents:
      row.retail_price_max_cents != null ? Number(row.retail_price_max_cents) : null,
    currency: String(row.currency ?? "usd"),
    estimatedDeliveryDays: Number(row.estimated_delivery_days ?? 12),
    trendScore: Number(row.trend_score ?? 0),
    siteScore: Number(row.site_score ?? 0),
    reviewRating: row.review_rating != null ? Number(row.review_rating) : null,
    reviewCount: Number(row.review_count ?? 0),
    variants: parseVariants(row.cj_variants),
  };
}

/** Strip backend-only fields before sending to the browser. */
export function toCatalogProductView(
  row: CatalogProductRow,
  extras?: Partial<
    Pick<
      CatalogProductView,
      "viralRank" | "viralScore" | "personalized" | "priceChangeNotice"
    >
  >
): CatalogProductView {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    imageIsStockPhoto: row.imageSource === "serpapi",
    category: row.category,
    tags: row.tags,
    retailPriceCents: row.retailPriceCents,
    retailPriceMinCents: row.retailPriceMinCents,
    retailPriceMaxCents: row.retailPriceMaxCents,
    currency: row.currency,
    estimatedDeliveryDays: row.estimatedDeliveryDays,
    reviewRating: row.reviewRating,
    reviewCount: row.reviewCount,
    sourcePlatform: row.sourcePlatform,
    variants: row.variants,
    ...extras,
  };
}

export async function listActiveCjCatalogProducts(): Promise<CatalogProductRow[]> {
  const supabase = (await import("@/lib/supabase/server")).createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_catalog")
    .select("*")
    .eq("active", true)
    .eq("source_platform", "cj")
    .order("trend_score", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRow);
}

export async function getCatalogProductBySlug(slug: string): Promise<CatalogProductRow | null> {
  const supabase = (await import("@/lib/supabase/server")).createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_catalog")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .eq("source_platform", "cj")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRow(data as Record<string, unknown>) : null;
}

export async function getCatalogProductsByIds(ids: string[]): Promise<CatalogProductRow[]> {
  if (!ids.length) return [];
  const supabase = (await import("@/lib/supabase/server")).createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_catalog")
    .select("*")
    .in("id", ids)
    .eq("source_platform", "cj")
    .eq("active", true);

  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((row) => [String(row.id), mapRow(row as Record<string, unknown>)]));
  return ids.map((id) => byId.get(id)).filter((p): p is CatalogProductRow => Boolean(p));
}

export interface LocalCatalogSearchOptions {
  category?: string;
  minRetailCents?: number;
  maxRetailCents?: number;
  page: number;
  limit: number;
}

export async function searchLocalCatalog(
  options: LocalCatalogSearchOptions
): Promise<{ rows: CatalogProductRow[]; total: number }> {
  const supabase = (await import("@/lib/supabase/server")).createServiceClient();
  const page = Math.max(1, options.page);
  const limit = Math.min(Math.max(1, options.limit), 48);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("ni_store_catalog")
    .select("*", { count: "exact" })
    .eq("active", true)
    .eq("source_platform", "cj");

  if (options.category) query = query.eq("category", options.category);
  if (options.minRetailCents != null) query = query.gte("retail_price_cents", options.minRetailCents);
  if (options.maxRetailCents != null) query = query.lte("retail_price_cents", options.maxRetailCents);

  const { data, error, count } = await query
    .order("trend_score", { ascending: false })
    .order("site_score", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new Error(error.message);

  return {
    rows: (data ?? []).map((row) => mapRow(row as Record<string, unknown>)),
    total: count ?? 0,
  };
}
