import "server-only";

import { toCatalogProductView } from "@/lib/store/catalog/products";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { refreshCatalogFromCj } from "@/lib/store/catalog/live-cj";
import { draftToCatalogView } from "@/lib/store/search/draft-to-view";
import { upsertSearchDrafts } from "@/lib/store/search/upsert-catalog";
import { searchCjProducts } from "@/lib/store/sources/cj";
import type { PriceChangeNotice, StoreSearchFilters } from "@/lib/store/sources/types";

function matchesRetailFilters(
  view: CatalogProductView,
  filters: StoreSearchFilters
): boolean {
  const minCheck = view.retailPriceMinCents ?? view.retailPriceCents;
  const maxCheck = view.retailPriceMaxCents ?? view.retailPriceCents;
  if (filters.minRetailCents != null && maxCheck < filters.minRetailCents) return false;
  if (filters.maxRetailCents != null && minCheck > filters.maxRetailCents) return false;
  if (filters.category && view.category !== filters.category) return false;
  return true;
}

export interface StoreSearchResult {
  results: CatalogProductView[];
  total: number;
  page: number;
  limit: number;
  query: string;
  platforms: ["cj"];
  priceChangeNotices: PriceChangeNotice[];
}

export async function searchStoreProducts(
  filters: StoreSearchFilters
): Promise<StoreSearchResult> {
  const query = filters.query.trim();
  const perSourceLimit = Math.min(filters.limit * 2, 40);
  const priceChangeNotices: PriceChangeNotice[] = [];

  if (!query) {
    return {
      results: [],
      total: 0,
      page: filters.page,
      limit: filters.limit,
      query,
      platforms: ["cj"],
      priceChangeNotices,
    };
  }

  const drafts = await searchCjProducts(query, perSourceLimit);
  await upsertSearchDrafts(drafts);

  const merged: CatalogProductView[] = [];

  for (const draft of drafts) {
    const priorView = draftToCatalogView(draft);
    const slug = priorView.slug;

    const { getCatalogProductBySlug } = await import("@/lib/store/catalog/products");
    const row = await getCatalogProductBySlug(slug);
    if (!row) continue;

    const refreshed = await refreshCatalogFromCj(row, priorView.retailPriceCents);
    if (refreshed.unavailable || !refreshed.row) continue;
    if (refreshed.notice) priceChangeNotices.push(refreshed.notice);

    const view = toCatalogProductView(refreshed.row, {
      priceChangeNotice: refreshed.notice ?? undefined,
    });
    if (!matchesRetailFilters(view, filters)) continue;
    merged.push(view);
  }

  merged.sort((a, b) => a.name.localeCompare(b.name));

  const total = merged.length;
  const offset = (filters.page - 1) * filters.limit;
  const results = merged.slice(offset, offset + filters.limit);

  return {
    results,
    total,
    page: filters.page,
    limit: filters.limit,
    query,
    platforms: ["cj"],
    priceChangeNotices,
  };
}
