import "server-only";

import { mapRow, toCatalogProductView } from "@/lib/store/catalog/products";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { createServiceClient } from "@/lib/supabase/server";
import { getNextViralResetIso, utcDateString } from "@/lib/store/viral/refresh";

const CAROUSEL_LIMIT = 24;
const POOL_SIZE = 48;

function hashSeed(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic daily shuffle — stable for 24h, refreshes on UTC date change. */
function seededShuffle<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  let state = hashSeed(seed);

  for (let i = copy.length - 1; i > 0; i--) {
    state = Math.imul(state ^ (state >>> 15), 2246822507);
    state = Math.imul(state ^ (state >>> 13), 3266489909);
    // Math.imul can go negative; plain % would yield negative indices and corrupt the array.
    const j = (state >>> 0) % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

export async function getPopularCarouselPicks(): Promise<{
  picks: CatalogProductView[];
  pickDate: string;
  resetsAt: string;
}> {
  const pickDate = utcDateString();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("ni_store_catalog")
    .select("*")
    .eq("active", true)
    .eq("source_platform", "cj")
    .order("trend_score", { ascending: false })
    .order("site_score", { ascending: false })
    .limit(POOL_SIZE);

  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
  const shuffled = seededShuffle(rows, pickDate);

  return {
    picks: shuffled.slice(0, CAROUSEL_LIMIT).map((row) => toCatalogProductView(row)),
    pickDate,
    resetsAt: getNextViralResetIso(),
  };
}
