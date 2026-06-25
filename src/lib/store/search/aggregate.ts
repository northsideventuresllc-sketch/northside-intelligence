import "server-only";

import {
  searchLocalCatalog,
  toCatalogProductView,
} from "@/lib/store/catalog/products";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { refreshCatalogFromCj } from "@/lib/store/catalog/live-cj";
import { draftToCatalogView } from "@/lib/store/search/draft-to-view";
import { upsertCatalogDrafts } from "@/lib/store/search/upsert-catalog";
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
  source: "local" | "cj-live" | "surprise";
}

function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

async function searchSurpriseProducts(
  filters: StoreSearchFilters
): Promise<StoreSearchResult> {
  const pool = await searchLocalCatalog({
    category: filters.category,
    minRetailCents: filters.minRetailCents,
    maxRetailCents: filters.maxRetailCents,
    page: 1,
    limit: 200,
  });

  const seed = filters.surpriseSeed ?? `${Date.now()}`;
  const shuffled = seededShuffle(pool.rows, seed);

  // Rotate starting offset based on seed for different page-1 results each click
  let offsetHash = 0;
  for (let i = 0; i < seed.length; i++) {
    offsetHash = (offsetHash * 17 + seed.charCodeAt(i)) >>> 0;
  }
  const rotateBy = pool.rows.length > 0 ? offsetHash % pool.rows.length : 0;
  const rotated = [...shuffled.slice(rotateBy), ...shuffled.slice(0, rotateBy)];

  const offset = (filters.page - 1) * filters.limit;
  const pageRows = rotated.slice(offset, offset + filters.limit);

  return {
    results: pageRows.map((row) => toCatalogProductView(row)),
    total: rotated.length,
    page: filters.page,
    limit: filters.limit,
    query: "",
    platforms: ["cj"],
    priceChangeNotices: [],
    source: "surprise",
  };
}

export async function searchStoreProducts(
  filters: StoreSearchFilters
): Promise<StoreSearchResult> {
  if (filters.surprise) {
    return searchSurpriseProducts(filters);
  }

  const query = filters.query.trim();
  const priceChangeNotices: PriceChangeNotice[] = [];

  if (!query) {
    const local = await searchLocalCatalog({
      category: filters.category,
      minRetailCents: filters.minRetailCents,
      maxRetailCents: filters.maxRetailCents,
      page: filters.page,
      limit: filters.limit,
    });

    return {
      results: local.rows.map((row) => toCatalogProductView(row)),
      total: local.total,
      page: filters.page,
      limit: filters.limit,
      query,
      platforms: ["cj"],
      priceChangeNotices,
      source: "local",
    };
  }

  const perSourceLimit = Math.min(filters.limit * 2, 40);

  const drafts = await searchCjProducts(query, perSourceLimit);
  await upsertCatalogDrafts(drafts);

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
    source: "cj-live",
  };
}
