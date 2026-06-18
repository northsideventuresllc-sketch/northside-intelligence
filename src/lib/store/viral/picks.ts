import "server-only";

import {
  getCatalogProductsByIds,
  toCatalogProductView,
  type CatalogProductRow,
} from "@/lib/store/catalog/products";
import { refreshCatalogFromCj } from "@/lib/store/catalog/live-cj";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import type { PriceChangeNotice } from "@/lib/store/sources/types";
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

async function liveRefreshProducts(
  products: CatalogProductRow[]
): Promise<CatalogProductView[]> {
  const refreshed = await Promise.all(
    products.map(async (row) => {
      const result = await refreshCatalogFromCj(row, row.retailPriceCents);
      if (result.unavailable || !result.row) return null;
      return {
        row: result.row,
        notice: result.notice,
      };
    })
  );

  return refreshed
    .filter((entry): entry is { row: CatalogProductRow; notice: PriceChangeNotice | null } =>
      Boolean(entry)
    )
    .map(({ row, notice }) =>
      toCatalogProductView(row, { priceChangeNotice: notice ?? undefined })
    );
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

  let prefs = null;
  if (userId) {
    prefs = await getUserStorePreferences(userId);
  }

  const hasPersonalization =
    Boolean(userId) &&
    (Object.keys(prefs?.nicheWeights ?? {}).length > 0 || prefs?.webTrackingEnabled);

  if (hasPersonalization && userId) {
    const nicheWeights = prefs?.nicheWeights ?? (await getUserNicheWeights(userId));
    const refreshedRows = (
      await Promise.all(
        products.map(async (row) => {
          const result = await refreshCatalogFromCj(row, row.retailPriceCents);
          return result.unavailable || !result.row ? null : result.row;
        })
      )
    ).filter((row): row is CatalogProductRow => Boolean(row));

    if (refreshedRows.length) {
      const personalized = await buildPersonalizedPicks(refreshedRows, nicheWeights);
      const liveById = new Map((await liveRefreshProducts(refreshedRows)).map((p) => [p.id, p]));
      const picks: CatalogProductView[] = [];
      personalized.forEach((pick, i) => {
        const live = liveById.get(pick.id);
        if (!live) return;
        picks.push({
          ...live,
          viralRank: i + 1,
          viralScore: pick.viralScore,
          personalized: true,
        });
      });

      if (picks.length) {
        return {
          picks: picks.slice(0, 10),
          pickDate,
          personalized: true,
          resetsAt: getNextViralResetIso(),
          webTrackingEnabled: prefs?.webTrackingEnabled ?? false,
        };
      }
    }
  }

  const liveProducts = await liveRefreshProducts(products);
  const liveById = new Map(liveProducts.map((p) => [p.id, p]));

  const picks: CatalogProductView[] = [];
  for (const row of rows) {
    const product = liveById.get(String(row.catalog_id));
    if (!product) continue;
    picks.push({
      ...product,
      viralRank: Number(row.rank),
      viralScore: Number(row.viral_score),
      personalized: false,
    });
  }

  return {
    picks: picks.slice(0, 10),
    pickDate,
    personalized: false,
    resetsAt: getNextViralResetIso(),
    webTrackingEnabled: prefs?.webTrackingEnabled ?? false,
  };
}
