"use client";

import { DROPSHIP_SOURCE_PLATFORMS } from "@/lib/store/platform-labels";
import type { StoreSearchFilters } from "@/components/store/StorePageClient";

const PLATFORM_OPTIONS = [
  { id: "curated", label: "NI Deals" },
  ...DROPSHIP_SOURCE_PLATFORMS,
] as const;

interface StoreSearchSidebarProps {
  query: string;
  filters: StoreSearchFilters;
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: StoreSearchFilters) => void;
  onSearch: (query: string) => void;
}

export function StoreSearchSidebar({
  query,
  filters,
  onQueryChange,
  onFiltersChange,
  onSearch,
}: StoreSearchSidebarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const togglePlatform = (id: string) => {
    const platforms = filters.platforms.includes(id)
      ? filters.platforms.filter((p) => p !== id)
      : [...filters.platforms, id];
    onFiltersChange({ ...filters, platforms });
  };

  return (
    <section
      className="glass-panel p-4"
      aria-label="Search products"
    >
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
        Search
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search dropship sources…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
          aria-label="Search products"
        />
        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-ni-cyan py-2.5 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300"
        >
          Search
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {PLATFORM_OPTIONS.map((option) => {
          const active = filters.platforms.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => togglePlatform(option.id)}
              className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold transition ${
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

      <div className="mt-4 space-y-2">
        <input
          type="number"
          min="0"
          step="0.01"
          value={filters.minPrice}
          onChange={(e) => onFiltersChange({ ...filters, minPrice: e.target.value })}
          placeholder="Min price ($)"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
          aria-label="Minimum retail price"
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={filters.maxPrice}
          onChange={(e) => onFiltersChange({ ...filters, maxPrice: e.target.value })}
          placeholder="Max price ($)"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
          aria-label="Maximum retail price"
        />
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-ni-muted">
        Press Enter to search. Retail prices only — supplier costs are never shown.
      </p>
    </section>
  );
}
