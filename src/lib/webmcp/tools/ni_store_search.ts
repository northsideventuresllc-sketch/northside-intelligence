import { ensureStoreEnv } from "@/lib/store/env";
import { searchStoreProducts } from "@/lib/store/search/aggregate";
import { storeAppUrl } from "@/lib/store/stripe";
import type { ToolHandler } from "../types";

const SITE = "https://www.northsideintelligence.com";

/**
 * Free catalog search — no payment, so this always returns status: "ok" (never
 * a checkout). Real Smart Store inventory via searchStoreProducts (same aggregate
 * used by /api/store/search), CJ-sourced.
 */
export const handler: ToolHandler = async (_tool, params) => {
  const query = typeof params.query === "string" ? params.query.trim() : "";
  const maxPriceRaw = params.max_price;
  const maxPrice =
    typeof maxPriceRaw === "number" && Number.isFinite(maxPriceRaw) && maxPriceRaw > 0
      ? maxPriceRaw
      : undefined;

  await ensureStoreEnv();

  let base: string;
  try {
    base = storeAppUrl() || SITE;
  } catch {
    base = SITE;
  }

  try {
    const result = await searchStoreProducts({
      query,
      platforms: ["cj"],
      maxRetailCents: maxPrice != null ? Math.round(maxPrice * 100) : undefined,
      page: 1,
      limit: 20,
    });

    const products = result.results.map((p) => ({
      product_id: p.slug,
      name: p.name,
      price_usd: Math.round(p.retailPriceCents) / 100,
      currency: p.currency,
      url: `${base}/store/p/${p.slug}`,
    }));

    return {
      status: "ok",
      data: { products, total: result.total, query },
      message: products.length
        ? `Found ${products.length} product(s). Pass a product_id to ni_store_order to buy.`
        : "No products matched that search.",
    };
  } catch (err) {
    console.error("[webmcp] ni_store_search failed:", err);
    return { status: "unavailable", message: "Store search is temporarily unavailable." };
  }
};
