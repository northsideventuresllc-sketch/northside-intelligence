import "server-only";

import {
  searchLocalCatalog,
  toCatalogProductView,
} from "@/lib/store/catalog/products";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import type { StoreAssistantSearchIntent } from "@/lib/store/assistant/types";
import { searchStoreProducts } from "@/lib/store/search/aggregate";

function dedupeBySlug(products: CatalogProductView[]): CatalogProductView[] {
  const seen = new Set<string>();
  const out: CatalogProductView[] = [];
  for (const product of products) {
    if (seen.has(product.slug)) continue;
    seen.add(product.slug);
    out.push(product);
  }
  return out;
}

async function searchLocalByText(
  query: string,
  intent: StoreAssistantSearchIntent,
  limit: number
): Promise<CatalogProductView[]> {
  const supabase = (await import("@/lib/supabase/server")).createServiceClient();
  const sanitized = query.replace(/[%_]/g, "").trim();
  if (!sanitized) return [];

  const pattern = `%${sanitized}%`;
  let dbQuery = supabase
    .from("ni_store_catalog")
    .select("*")
    .eq("active", true)
    .eq("source_platform", "cj")
    .or(`name.ilike.${pattern},description.ilike.${pattern}`);

  if (intent.category) dbQuery = dbQuery.eq("category", intent.category);
  if (intent.minRetailCents != null) {
    dbQuery = dbQuery.gte("retail_price_cents", intent.minRetailCents);
  }
  if (intent.maxRetailCents != null) {
    dbQuery = dbQuery.lte("retail_price_cents", intent.maxRetailCents);
  }

  const { data, error } = await dbQuery
    .order("trend_score", { ascending: false })
    .order("site_score", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[store/assistant/local-search]", error.message);
    return [];
  }

  const { mapRow } = await import("@/lib/store/catalog/products");
  return (data ?? []).map((row) => toCatalogProductView(mapRow(row as Record<string, unknown>)));
}

export async function findAssistantRecommendations(
  intent: StoreAssistantSearchIntent,
  limit = 6
): Promise<{ products: CatalogProductView[]; primaryQuery: string }> {
  const primaryQuery = intent.searchTerms[0]?.trim() || "trending";
  const collected: CatalogProductView[] = [];

  for (const term of intent.searchTerms.slice(0, 3)) {
    const local = await searchLocalByText(term, intent, limit);
    collected.push(...local);
    if (collected.length >= limit) break;
  }

  if (collected.length < limit && primaryQuery !== "trending") {
    try {
      const live = await searchStoreProducts({
        query: primaryQuery,
        platforms: ["cj"],
        category: intent.category,
        minRetailCents: intent.minRetailCents,
        maxRetailCents: intent.maxRetailCents,
        page: 1,
        limit,
      });
      collected.push(...live.results);
    } catch (err) {
      console.warn("[store/assistant/live-search]", err);
    }
  }

  if (collected.length < limit) {
    const browse = await searchLocalCatalog({
      category: intent.category,
      minRetailCents: intent.minRetailCents,
      maxRetailCents: intent.maxRetailCents,
      page: 1,
      limit,
    });
    collected.push(...browse.rows.map((row) => toCatalogProductView(row)));
  }

  return {
    products: dedupeBySlug(collected).slice(0, limit),
    primaryQuery,
  };
}
