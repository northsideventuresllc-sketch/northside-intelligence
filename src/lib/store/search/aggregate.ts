import "server-only";

import { toCatalogProductView } from "@/lib/store/catalog/products";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { draftToCatalogView } from "@/lib/store/search/draft-to-view";
import { upsertSearchDrafts } from "@/lib/store/search/upsert-catalog";
import { searchCuratedCatalog } from "@/lib/store/sources/curated-search";
import { searchCjProducts } from "@/lib/store/sources/cj";
import { searchAliExpressProducts } from "@/lib/store/sources/aliexpress";
import { searchTemuProducts } from "@/lib/store/sources/temu";
import type { DropshipPlatform, StoreSearchFilters } from "@/lib/store/sources/types";

const SOURCE_SEARCHERS: Record<
  Exclude<DropshipPlatform, "curated">,
  (query: string, limit: number) => Promise<import("@/lib/store/sources/types").SourceProductDraft[]>
> = {
  cj: searchCjProducts,
  aliexpress: searchAliExpressProducts,
  temu: searchTemuProducts,
};

function dedupeKey(slug: string): string {
  return slug;
}

function matchesRetailFilters(
  retailCents: number,
  filters: StoreSearchFilters
): boolean {
  if (filters.minRetailCents != null && retailCents < filters.minRetailCents) return false;
  if (filters.maxRetailCents != null && retailCents > filters.maxRetailCents) return false;
  return true;
}

export interface StoreSearchResult {
  results: CatalogProductView[];
  total: number;
  page: number;
  limit: number;
  query: string;
  platforms: DropshipPlatform[];
}

export async function searchStoreProducts(
  filters: StoreSearchFilters
): Promise<StoreSearchResult> {
  const query = filters.query.trim();
  const perSourceLimit = Math.min(filters.limit * 2, 40);
  const enabledPlatforms = filters.platforms.length
    ? filters.platforms
    : (["cj", "aliexpress", "temu", "curated"] as DropshipPlatform[]);

  const seen = new Set<string>();
  const merged: CatalogProductView[] = [];

  const remotePlatforms = enabledPlatforms.filter(
    (p): p is Exclude<DropshipPlatform, "curated"> => p !== "curated"
  );

  if (query) {
    const remoteDrafts = (
      await Promise.all(
        remotePlatforms.map((platform) => SOURCE_SEARCHERS[platform](query, perSourceLimit))
      )
    ).flat();

    await upsertSearchDrafts(remoteDrafts);

    for (const draft of remoteDrafts) {
      const view = draftToCatalogView(draft);
      if (filters.category && view.category !== filters.category) continue;
      if (!matchesRetailFilters(view.retailPriceCents, filters)) continue;
      const key = dedupeKey(view.slug);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(view);
    }
  }

  if (enabledPlatforms.includes("curated")) {
    const curated = await searchCuratedCatalog(query, {
      category: filters.category,
      minRetailCents: filters.minRetailCents,
      maxRetailCents: filters.maxRetailCents,
      limit: perSourceLimit,
    });

    for (const row of curated) {
      const key = dedupeKey(row.slug);
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(toCatalogProductView(row));
    }
  }

  merged.sort((a, b) => {
    const scoreA = (a.reviewCount ?? 0) + (a.viralScore ?? 0);
    const scoreB = (b.reviewCount ?? 0) + (b.viralScore ?? 0);
    return scoreB - scoreA || a.name.localeCompare(b.name);
  });

  const total = merged.length;
  const offset = (filters.page - 1) * filters.limit;
  const results = merged.slice(offset, offset + filters.limit);

  return {
    results,
    total,
    page: filters.page,
    limit: filters.limit,
    query,
    platforms: enabledPlatforms,
  };
}
