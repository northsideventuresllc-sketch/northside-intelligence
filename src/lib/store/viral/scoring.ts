import "server-only";

/**
 * Smart Store "viral picks" ranking is a deterministic formula, NOT AI and NOT a real
 * trend-analysis feature — no model is called anywhere in this module. `trendTagBoost`
 * comes from `getTodaysTrendTags()` (`src/lib/store/sources/trends.ts`), a fixed
 * hardcoded keyword list rotated by day-of-week, not any live trend source. Real
 * signal only enters via `product.trendScore`/`product.siteScore` (CJ supplier data)
 * and `siteEventCounts` (actual on-site shopper activity). Confirmed 2026-08-20 (JB
 * build task) — flagging here so this isn't mistaken for AI/real trend intelligence
 * by a future reader. Building genuine AI/trend-driven ranking is a separate, larger
 * project, not a drop-in change here.
 */
import type { CatalogProductRow } from "@/lib/store/catalog/products";

const EVENT_WEIGHTS: Record<string, number> = {
  view: 1,
  carousel_impression: 0.5,
  click: 3,
  search: 2,
  purchase: 10,
};

export function scoreCatalogProduct(
  product: CatalogProductRow,
  siteEventCounts: Map<string, number>,
  trendTagBoost: Set<string>
): number {
  const siteEvents = siteEventCounts.get(product.id) ?? 0;
  let trendBoost = 0;
  for (const tag of product.tags) {
    if (trendTagBoost.has(tag)) trendBoost += 5;
  }
  if (trendTagBoost.has(product.category)) trendBoost += 3;

  return product.trendScore * 0.55 + siteEvents * 0.35 + trendBoost * 0.1 + product.siteScore;
}

export function blendPersonalizedScore(
  globalScore: number,
  product: CatalogProductRow,
  nicheWeights: Record<string, number>
): number {
  let nicheBoost = 0;
  for (const tag of product.tags) {
    nicheBoost += nicheWeights[tag] ?? 0;
  }
  nicheBoost += nicheWeights[product.category] ?? 0;
  return globalScore * 0.4 + nicheBoost * 0.6;
}

export { EVENT_WEIGHTS };
