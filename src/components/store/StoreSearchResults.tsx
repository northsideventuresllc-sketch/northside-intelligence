"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogProductView, StoreSearchResponse } from "@/lib/store/catalog/types";
import { DROPSHIP_SOURCE_PLATFORMS } from "@/lib/store/platform-labels";
import { SearchResultCard } from "@/components/store/SearchResultCard";
import { StoreCartLink } from "@/components/store/StoreCartLink";
import type { StoreSearchFilters } from "@/components/store/StorePageClient";

const PLATFORM_OPTIONS = [
  { id: "curated", label: "NI Deals" },
  ...DROPSHIP_SOURCE_PLATFORMS,
] as const;

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  const key = "ni_store_session";
  let id = sessionStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
  }
  return id;
}

async function trackSearch(query: string) {
  try {
    await fetch("/api/store/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventType: "search",
        searchQuery: query,
        sessionId: getSessionId(),
      }),
    });
  } catch {
    /* non-blocking */
  }
}

interface StoreSearchResultsProps {
  query: string;
  draftQuery: string;
  filters: StoreSearchFilters;
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: StoreSearchFilters) => void;
  onSearch: (query: string) => void;
  onBack: () => void;
}

export function StoreSearchResults({
  query,
  draftQuery,
  filters,
  onQueryChange,
  onFiltersChange,
  onSearch,
  onBack,
}: StoreSearchResultsProps) {
  const [category, setCategory] = useState(filters.category);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StoreSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  const runSearch = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set("q", query.trim());
      if (filters.platforms.length) params.set("platforms", filters.platforms.join(","));
      if (category) params.set("category", category);
      if (filters.minPrice) params.set("minPrice", filters.minPrice);
      if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
      params.set("page", String(page));
      params.set("limit", "24");

      const res = await fetch(`/api/store/search?${params.toString()}`);
      const json = (await res.json()) as StoreSearchResponse & { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Search failed");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [query, filters, category, page]);

  useEffect(() => {
    runSearch();
  }, [runSearch]);

  useEffect(() => {
    if (query.trim()) trackSearch(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    onSearch(draftQuery);
  };

  const categories = data?.categories ?? [];

  return (
    <section aria-label="Search results">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-cyan-300 hover:underline"
        >
          ← Back to Deals
        </button>
        <StoreCartLink />
      </div>

      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="search"
          value={draftQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search trending products…"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
          aria-label="Search products"
        />
        <button
          type="submit"
          className="rounded-xl bg-ni-cyan px-5 py-3 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300"
        >
          Search
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        {PLATFORM_OPTIONS.map((option) => {
          const active = filters.platforms.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => {
                const platforms = active
                  ? filters.platforms.filter((p) => p !== option.id)
                  : [...filters.platforms, option.id];
                onFiltersChange({ ...filters, platforms });
                setPage(1);
              }}
              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                active
                  ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-100"
                  : "border-white/10 bg-white/5 text-ni-muted hover:border-white/20"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            onFiltersChange({ ...filters, category: e.target.value });
            setPage(1);
          }}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-400/50 focus:outline-none"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/-/g, " ")}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          value={filters.minPrice}
          onChange={(e) => {
            onFiltersChange({ ...filters, minPrice: e.target.value });
            setPage(1);
          }}
          placeholder="Min price ($)"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={filters.maxPrice}
          onChange={(e) => {
            onFiltersChange({ ...filters, maxPrice: e.target.value });
            setPage(1);
          }}
          placeholder="Max price ($)"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
        />
      </div>

      {loading && <p className="text-center text-sm text-ni-muted">Searching sources…</p>}
      {error && <p className="text-center text-sm text-red-300">{error}</p>}

      {!loading && data && (
        <>
          <p className="mb-4 text-sm text-ni-muted">
            {data.total === 0
              ? query
                ? `No results for “${query}”.`
                : "No products match your filters."
              : `${data.total} result${data.total === 1 ? "" : "s"}${query ? ` for “${query}”` : ""}`}
          </p>

          {data.results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((product: CatalogProductView) => (
                <SearchResultCard key={product.slug} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-ni-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-white/10 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
