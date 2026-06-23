"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ViralProductsCarousel } from "@/components/store/ViralProductsCarousel";
import { PopularItemsMarquee } from "@/components/store/PopularItemsMarquee";
import { StoreSearchSidebar } from "@/components/store/StoreSearchSidebar";
import { StoreSearchResults } from "@/components/store/StoreSearchResults";
import { WebTrackingOptIn } from "@/components/store/WebTrackingOptIn";
import { StoreCartHeader } from "@/components/store/StoreCartHeader";
import { SMART_STORE_NAME } from "@/lib/store/branding";

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
  const initialSurprise = searchParams.get("surprise") === "1";

  const [searchActive, setSearchActive] = useState(Boolean(initialQuery) || initialSurprise);
  const [surpriseMode, setSurpriseMode] = useState(initialSurprise);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<StoreSearchFilters>(DEFAULT_FILTERS);

  const handleSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    setSurpriseMode(false);
    setSubmittedQuery(trimmed);
    setDraftQuery(trimmed);
    setSearchActive(true);
    const url = new URL(window.location.href);
    if (trimmed) url.searchParams.set("q", trimmed);
    else url.searchParams.delete("q");
    url.searchParams.delete("surprise");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleSurprise = useCallback(() => {
    setSurpriseMode(true);
    setSubmittedQuery("");
    setDraftQuery("");
    setSearchActive(true);
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.set("surprise", "1");
    window.history.replaceState({}, "", url.toString());
  }, []);

  const handleBackToDeals = useCallback(() => {
    setSearchActive(false);
    setSurpriseMode(false);
    setSubmittedQuery("");
    setDraftQuery("");
    const url = new URL(window.location.href);
    url.searchParams.delete("q");
    url.searchParams.delete("surprise");
    window.history.replaceState({}, "", url.toString());
  }, []);

  if (searchActive) {
    return (
      <StoreSearchResults
        query={submittedQuery}
        draftQuery={draftQuery}
        filters={filters}
        surpriseMode={surpriseMode}
        onFiltersChange={setFilters}
        onQueryChange={setDraftQuery}
        onSearch={handleSearch}
        onSurprise={handleSurprise}
        onBack={handleBackToDeals}
      />
    );
  }

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Daily Picks
          </p>
          <h1 className="text-3xl font-semibold text-white">{SMART_STORE_NAME}</h1>
          <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted sm:mx-0">
            Ten viral products refreshed every 24 hours — scored from what&apos;s trending online
            and what shoppers love on Northside Intelligence.
          </p>
        </div>
        <StoreCartHeader />
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
            onSurprise={handleSurprise}
          />
        </aside>
      </div>

      <PopularItemsMarquee />

      <p className="mx-auto mt-8 max-w-xl text-center text-sm text-ni-muted">
        NI price = supplier listing price + 10%. Supplier costs are never shown.
      </p>
    </>
  );
}
