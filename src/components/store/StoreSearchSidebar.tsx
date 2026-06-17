"use client";

import { STORE_ITEM_CATEGORIES, formatCategoryLabel } from "@/lib/store/categories";
import type { StoreSearchFilters } from "@/components/store/StorePageClient";

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
        <button
          type="submit"
          className="mt-2 w-full rounded-xl bg-ni-cyan py-2.5 text-sm font-semibold text-ni-bg transition hover:bg-cyan-300"
        >
          Search
        </button>
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
        Press Enter to search. NI price = supplier listing price + 10%.
      </p>
      {filters.category && (
        <p className="mt-2 text-[10px] text-ni-muted">
          Filtering: {formatCategoryLabel(filters.category)}
        </p>
      )}
    </section>
  );
}
