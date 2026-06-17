"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ViralProductsCarousel } from "@/components/store/ViralProductsCarousel";
import { StoreSearchSidebar } from "@/components/store/StoreSearchSidebar";
import { StoreSearchResults } from "@/components/store/StoreSearchResults";
import { WebTrackingOptIn } from "@/components/store/WebTrackingOptIn";
import { StoreCartLink } from "@/components/store/StoreCartLink";

export interface StoreSearchFilters {
  category: string;
  minPrice: string;
  maxPrice: string;
}

const DEFAULT_FILTERS: StoreSearchFilters = {
  category: "",
  minPrice: "",
  maxPrice: "",
};

export function StorePageClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q")?.trim() ?? "";

  const [searchActive, setSearchActive] = useState(Boolean(initialQuery));
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<StoreSearchFilters>(DEFAULT_FILTERS);

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    setSubmittedQuery(trimmed);
    setDraftQuery(trimmed);
    setSearchActive(true);
    const url = new URL(window.location.href);
    if (trimmed) url.searchParams.set("q", trimmed);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleBackToDeals = useCallback(() => {
    setSearchActive(false);
    setSubmittedQuery("");
    setDraftQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    window.history.replaceState({}, "", url.toString());
  }, []);

  if (searchActive) {
    return (
      <StoreSearchResults
        query={submittedQuery}
        draftQuery={draftQuery}
        filters={filters}
        onFiltersChange={setFilters}
        onQueryChange={setDraftQuery}
        onSearch={handleSearch}
        onBack={handleBackToDeals}
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            NI Deals
          </p>
          <h1 className="text-3xl font-semibold text-white">NI Store</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted sm:mx-0">
            Ten viral products refreshed every 24 hours — scored from what&apos;s trending online
            and what shoppers love on NI.
          </p>
        </div>
        <StoreCartLink />
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start">
        <div className="min-w-0">
          <ViralProductsCarousel />
          <WebTrackingOptIn />
        </div>

        <aside className="lg:sticky lg:top-28">
          <StoreSearchSidebar
            query={draftQuery}
            filters={filters}
            onQueryChange={setDraftQuery}
            onFiltersChange={setFilters}
            onSearch={handleSearch}
          />
        </aside>
      </div>

      <p className="mt-8 text-center text-xs text-ni-muted lg:text-left">
        NI price = supplier listing price + 10%. Supplier costs are never shown.
      </p>
    </>
  );
}
