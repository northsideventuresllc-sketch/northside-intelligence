"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { CatalogProductView, StoreSearchResponse } from "@/lib/store/catalog/types";
import { DROPSHIP_SOURCE_PLATFORMS } from "@/lib/store/platform-labels";
import { SearchResultCard } from "@/components/store/SearchResultCard";

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

export function StoreSearch() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<StoreSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / data.limit));
  }, [data]);

  const runSearch = useCallback(
    async (searchQuery: string, pageNum: number) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.set("q", searchQuery.trim());
        if (platforms.length) params.set("platforms", platforms.join(","));
        if (category) params.set("category", category);
        if (minPrice) params.set("minPrice", minPrice);
        if (maxPrice) params.set("maxPrice", maxPrice);
        params.set("page", String(pageNum));
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
    },
    [platforms, category, minPrice, maxPrice]
  );

  useEffect(() => {
    runSearch(submittedQuery, page);
  }, [submittedQuery, page, runSearch, category, platforms, minPrice, maxPrice]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setPage(1);
    if (trimmed) trackSearch(trimmed);
  };

  const togglePlatform = (id: string) => {
    setPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    setPage(1);
  };

  const categories = data?.categories ?? [];

  return (
    <section className="mb-12" aria-label="Product search">
      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="flex gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search trending products across dropship sources…"
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
            aria-label="Search products"
          />
          <button
            type="submit"
            className="rounded-xl bg-ni-cyan px-5 py-3 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap gap-2">
        {PLATFORM_OPTIONS.map((option) => {
          const active = platforms.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => togglePlatform(option.id)}
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

      <div className="mx-auto mt-4 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
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
          value={minPrice}
          onChange={(e) => {
            setMinPrice(e.target.value);
            setPage(1);
          }}
          placeholder="Min price ($)"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
          aria-label="Minimum retail price"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={maxPrice}
          onChange={(e) => {
            setMaxPrice(e.target.value);
            setPage(1);
          }}
          placeholder="Max price ($)"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
          aria-label="Maximum retail price"
        />
      </div>

      <p className="mx-auto mt-3 max-w-3xl text-center text-xs text-ni-muted">
        Retail prices only — supplier costs are never shown. AliExpress and Temu appear when API
        keys are configured.
      </p>

      {loading && (
        <p className="mt-8 text-center text-sm text-ni-muted">Searching sources…</p>
      )}
      {error && <p className="mt-8 text-center text-sm text-red-300">{error}</p>}

      {!loading && data && (
        <div className="mt-8">
          <p className="mb-4 text-center text-sm text-ni-muted">
            {data.total === 0
              ? submittedQuery
                ? `No results for “${submittedQuery}”.`
                : "No products match your filters."
              : `${data.total} result${data.total === 1 ? "" : "s"}${
                  submittedQuery ? ` for “${submittedQuery}”` : ""
                }`}
          </p>

          {data.results.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((product: CatalogProductView) => (
                <SearchResultCard key={product.slug} product={product} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-3">
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
        </div>
      )}
    </section>
  );
}
