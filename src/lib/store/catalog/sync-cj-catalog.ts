import "server-only";

import { upsertCatalogDrafts } from "@/lib/store/search/upsert-catalog";
import { ensureStoreEnv } from "@/lib/store/env";
import {
  CJ_CATALOG_KEYWORD_SLICES,
  fetchCjCatalogPage,
  mapCjListItemToDraftFast,
} from "@/lib/store/sources/cj";
import { createServiceClient } from "@/lib/supabase/server";

/** CJ listV2 returns at most 100 items/page and caps totalRecords at 6000 per keyword slice. */
export const CJ_PAGE_SIZE = 100;
/** Default pages per manual/hourly run. Daily cron passes a higher value. */
export const CJ_PAGES_PER_CRON_RUN = 10;
/** Pages ingested during the daily viral refresh (Hobby-safe once-per-day cadence). */
export const CJ_PAGES_PER_DAILY_RUN = 15;

export interface CjCatalogSyncResult {
  keywordSlice: string;
  pagesProcessed: number;
  productsUpserted: number;
  nextPage: number;
  totalPages: number | null;
  totalRecords: number | null;
  sliceComplete: boolean;
  nextKeywordSlice: string | null;
  catalogUpsertedTotal: number;
}

interface SyncState {
  keyword_slice: string;
  page_number: number;
  total_pages: number | null;
  total_records: number | null;
  products_upserted: number;
}

async function loadSyncState(): Promise<SyncState> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_catalog_sync")
    .select("keyword_slice, page_number, total_pages, total_records, products_upserted")
    .eq("id", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (data) {
    return {
      keyword_slice: String(data.keyword_slice ?? ""),
      page_number: Number(data.page_number ?? 1),
      total_pages: data.total_pages != null ? Number(data.total_pages) : null,
      total_records: data.total_records != null ? Number(data.total_records) : null,
      products_upserted: Number(data.products_upserted ?? 0),
    };
  }

  const { error: insertError } = await supabase.from("ni_store_catalog_sync").insert({
    id: "active",
    keyword_slice: "",
    page_number: 1,
  });
  if (insertError) throw new Error(insertError.message);

  return {
    keyword_slice: "",
    page_number: 1,
    total_pages: null,
    total_records: null,
    products_upserted: 0,
  };
}

async function saveSyncState(state: SyncState): Promise<void> {
  const supabase = createServiceClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("ni_store_catalog_sync")
    .update({
      keyword_slice: state.keyword_slice,
      page_number: state.page_number,
      total_pages: state.total_pages,
      total_records: state.total_records,
      products_upserted: state.products_upserted,
      last_synced_at: now,
      updated_at: now,
    })
    .eq("id", "active");

  if (error) throw new Error(error.message);
}

function advanceKeywordSlice(current: string): string | null {
  const slices = CJ_CATALOG_KEYWORD_SLICES as readonly string[];
  const idx = slices.indexOf(current);
  if (idx < 0) return slices[0] ?? null;
  if (idx + 1 >= slices.length) return null;
  return slices[idx + 1] ?? null;
}

/** Ingest the next batch of CJ listV2 pages into ni_store_catalog (fast list data, no per-SKU enrich). */
export async function syncCjCatalogBatch(
  pagesPerRun = CJ_PAGES_PER_CRON_RUN
): Promise<CjCatalogSyncResult> {
  await ensureStoreEnv();

  const state = await loadSyncState();
  let pagesProcessed = 0;
  let productsUpserted = 0;
  let sliceComplete = false;
  let nextKeywordSlice: string | null = null;

  while (pagesProcessed < pagesPerRun) {
    let pageResult: Awaited<ReturnType<typeof fetchCjCatalogPage>>;
    try {
      pageResult = await fetchCjCatalogPage({
        page: state.page_number,
        size: CJ_PAGE_SIZE,
        keyWord: state.keyword_slice || undefined,
      });
    } catch (err) {
      console.error("[store/catalog-sync] CJ page fetch failed", {
        slice: state.keyword_slice,
        page: state.page_number,
        err,
      });
      await saveSyncState(state);
      throw err;
    }

    if (!pageResult.products.length && state.page_number === 1) {
      sliceComplete = true;
      const nextSlice = advanceKeywordSlice(state.keyword_slice);
      nextKeywordSlice = nextSlice;
      if (nextSlice != null) {
        state.keyword_slice = nextSlice;
        state.page_number = 1;
        state.total_pages = null;
        state.total_records = null;
      }
      await saveSyncState(state);
      break;
    }

    state.total_pages = pageResult.totalPages;
    state.total_records = pageResult.totalRecords;

    const drafts = pageResult.products
      .map((item) => mapCjListItemToDraftFast(item))
      .filter((draft): draft is NonNullable<typeof draft> => Boolean(draft));

    if (drafts.length) {
      await upsertCatalogDrafts(drafts);
      productsUpserted += drafts.length;
      state.products_upserted += drafts.length;
    }

    pagesProcessed += 1;

    const lastPage =
      pageResult.totalPages != null ? Math.min(pageResult.totalPages, 60) : state.page_number;

    if (state.page_number >= lastPage || !pageResult.products.length) {
      sliceComplete = true;
      const nextSlice = advanceKeywordSlice(state.keyword_slice);
      nextKeywordSlice = nextSlice;
      if (nextSlice != null) {
        state.keyword_slice = nextSlice;
        state.page_number = 1;
        state.total_pages = null;
        state.total_records = null;
      } else {
        state.keyword_slice = CJ_CATALOG_KEYWORD_SLICES[0] ?? "";
        state.page_number = 1;
      }
      await saveSyncState(state);
      break;
    }

    state.page_number += 1;
    await saveSyncState(state);
  }

  if (pagesProcessed > 0 && !sliceComplete) {
    await saveSyncState(state);
  }

  return {
    keywordSlice: state.keyword_slice,
    pagesProcessed,
    productsUpserted,
    nextPage: state.page_number,
    totalPages: state.total_pages,
    totalRecords: state.total_records,
    sliceComplete,
    nextKeywordSlice,
    catalogUpsertedTotal: state.products_upserted,
  };
}
