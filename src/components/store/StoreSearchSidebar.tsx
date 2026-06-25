"use client";

import { STORE_ITEM_CATEGORIES, formatCategoryLabel } from "@/lib/store/categories";
import type { StoreSearchFilters } from "@/components/store/StorePageClient";

interface StoreSearchSidebarProps {
  query: string;
  filters: StoreSearchFilters;
  onQueryChange: (query: string) => void;
  onFiltersChange: (filters: StoreSearchFilters) => void;
  onSearch: (query: string) => void;
  onSurprise: () => void;
}

export function StoreSearchSidebar({
  query,
  filters,
  onQueryChange,
  onFiltersChange,
  onSearch,
  onSurprise,
}: StoreSearchSidebarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <section className="glass-panel p-4" aria-label="Search products">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
        Search
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search products…"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/50 focus:outline-none"
          aria-label="Search products"
        />
        <div className="mt-2 flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-xl bg-ni-cyan py-2.5 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300"
          >
            Search
          </button>
          <button
            type="button"
            onClick={onSurprise}
            className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          >
            SUPRISE ME
          </button>
        </div>
      </form>

      <div className="mt-4">
        <label htmlFor="store-category-filter" className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-ni-muted">
          Category
        </label>
        <select
          id="store-category-filter"
          value={filters.category}
          onChange={(e) => onFiltersChange({ ...filters, category: e.target.value })}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white focus:border-cyan-400/50 focus:outline-none"
        >
          <option value="">All Categories</option>
          {STORE_ITEM_CATEGORIES.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>
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
        Press Enter to search. Prices are verified at checkout.
      </p>
      {filters.category && (
        <p className="mt-2 text-[10px] text-ni-muted">
          Filtering: {formatCategoryLabel(filters.category)}
        </p>
      )}
    </section>
  );
}
