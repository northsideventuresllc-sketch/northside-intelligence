import "server-only";

import {
  getCatalogProductsByIds,
  toCatalogProductView,
  type CatalogProductRow,
} from "@/lib/store/catalog/products";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { createServiceClient } from "@/lib/supabase/server";
import { blendPersonalizedScore, scoreCatalogProduct } from "@/lib/store/viral/scoring";
import { getTodaysTrendTags } from "@/lib/store/sources/trends";
import { getNextViralResetIso, refreshDailyViralPicks, utcDateString } from "@/lib/store/viral/refresh";
import { getUserNicheWeights, getUserStorePreferences } from "@/lib/store/personalization/preferences";

async function loadGlobalPicks(pickDate: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ni_store_viral_picks")
    .select("rank, viral_score, catalog_id")
    .eq("pick_date", pickDate)
    .order("rank", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

async function buildPersonalizedPicks(
  globalProducts: CatalogProductRow[],
  nicheWeights: Record<string, number>
): Promise<CatalogProductView[]> {
  const trendTags = new Set(getTodaysTrendTags());
  const siteCounts = new Map<string, number>();

  const scored = globalProducts
    .map((product) => {
      const global = scoreCatalogProduct(product, siteCounts, trendTags);
      const blended = blendPersonalizedScore(global, product, nicheWeights);
      return { product, blended };
    })
    .sort((a, b) => b.blended - a.blended)
    .slice(0, 10);

  return scored.map(({ product, blended }, i) =>
    toCatalogProductView(product, {
      viralRank: i + 1,
      viralScore: Math.round(blended * 100) / 100,
      personalized: true,
    })
  );
}

export async function getViralPicksForUser(userId: string | null): Promise<{
  picks: CatalogProductView[];
  pickDate: string;
  personalized: boolean;
  resetsAt: string;
  webTrackingEnabled: boolean;
}> {
  const pickDate = utcDateString();
  let rows = await loadGlobalPicks(pickDate);

  if (!rows.length) {
    await refreshDailyViralPicks();
    rows = await loadGlobalPicks(pickDate);
  }

  const catalogIds = rows.map((r) => String(r.catalog_id));
  const products = await getCatalogProductsByIds(catalogIds);
  const byId = new Map(products.map((p) => [p.id, p]));

  let prefs = null;
  if (userId) {
    prefs = await getUserStorePreferences(userId);
  }

  const hasPersonalization =
    Boolean(userId) &&
    (Object.keys(prefs?.nicheWeights ?? {}).length > 0 || prefs?.webTrackingEnabled);

  if (hasPersonalization && userId) {
    const nicheWeights = prefs?.nicheWeights ?? (await getUserNicheWeights(userId));
    const allCatalog = products.length ? products : await getCatalogProductsByIds(catalogIds);
    const personalized = await buildPersonalizedPicks(allCatalog, nicheWeights);
    if (personalized.length) {
      return {
        picks: personalized,
        pickDate,
        personalized: true,
        resetsAt: getNextViralResetIso(),
        webTrackingEnabled: prefs?.webTrackingEnabled ?? false,
      };
    }
  }

  const picks = rows
    .map((row) => {
      const product = byId.get(String(row.catalog_id));
      if (!product) return null;
      return toCatalogProductView(product, {
        viralRank: Number(row.rank),
        viralScore: Number(row.viral_score),
        personalized: false,
      });
    })
    .filter((p): p is CatalogProductView => Boolean(p));

  return {
    picks,
    pickDate,
    personalized: false,
    resetsAt: getNextViralResetIso(),
    webTrackingEnabled: prefs?.webTrackingEnabled ?? false,
  };
}
