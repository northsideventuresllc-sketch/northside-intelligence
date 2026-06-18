import "server-only";

import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { enrichCjProductDetail } from "@/lib/store/sources/cj-detail";
import { getCjAccessToken } from "@/lib/store/sources/cj-auth";
import { parseCjListingPriceUsd, supplierCostCentsFromUsd } from "@/lib/store/sources/cj-pricing";
import type { SourceProductDraft } from "@/lib/store/sources/types";

/**
 * CJ Dropshipping API integration.
 * Requires CJ_DROPSHIPPING_API_KEY — returns [] when not configured.
 */
const VIRAL_KEYWORDS = ["portable", "wireless", "led", "pet", "kitchen", "phone"];

interface CjListV2Product {
  id?: string;
  nameEn?: string;
  sku?: string;
  bigImage?: string;
  sellPrice?: string;
  listedNum?: number;
  threeCategoryName?: string | null;
}

async function fetchCjListV2(
  token: string,
  params: Record<string, string>
): Promise<CjListV2Product[]> {
  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/listV2");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "CJ-Access-Token": token },
    cache: "no-store",
  });

  if (!res.ok) {
    console.warn("[store/cj] listV2 failed:", res.status);
    return [];
  }

  const json = (await res.json()) as {
    data?: {
      content?: Array<{ productList?: CjListV2Product[] }>;
      list?: CjListV2Product[];
    };
  };

  const fromContent =
    json.data?.content?.flatMap((group) => group.productList ?? []) ?? [];
  if (fromContent.length) return fromContent;
  return json.data?.list ?? [];
}

async function mapCjProduct(
  item: CjListV2Product,
  tags = ["cj", "trending"]
): Promise<SourceProductDraft | null> {
  const id = item.id ?? item.sku;
  const listName = item.nameEn?.trim();
  if (!id || !listName) return null;

  const enriched = await enrichCjProductDetail({
    sourceProductId: id,
    name: listName,
    listSellPrice: item.sellPrice,
    listImageUrl: item.bigImage,
  });

  if (!enriched) {
    const supplierUsd = parseCjListingPriceUsd(item.sellPrice);
    if (supplierUsd == null || supplierUsd <= 0) return null;
    const supplierCostCents = supplierCostCentsFromUsd(supplierUsd);
    const retail = calculateRetailPriceCents(supplierCostCents);
    return {
      name: listName,
      description: listName,
      imageUrl: item.bigImage || "",
      imageSource: item.bigImage ? "cj" : "serpapi",
      category: normalizeCategory(item.threeCategoryName),
      tags,
      sourcePlatform: "cj",
      sourceProductId: id,
      supplierCostCents,
      supplierCostMinCents: supplierCostCents,
      supplierCostMaxCents: supplierCostCents,
      retailPriceMinCents: retail,
      retailPriceMaxCents: retail,
      variants: [],
      estimatedDeliveryDays: 12,
    };
  }

  return {
    name: enriched.name,
    description: enriched.description,
    imageUrl: enriched.imageUrl || item.bigImage || "",
    imageSource: enriched.imageSource,
    category: normalizeCategory(item.threeCategoryName),
    tags,
    sourcePlatform: "cj",
    sourceProductId: id,
    supplierCostCents: enriched.supplierCostCents,
    supplierCostMinCents: enriched.supplierCostMinCents,
    supplierCostMaxCents: enriched.supplierCostMaxCents,
    retailPriceMinCents: enriched.retailPriceMinCents,
    retailPriceMaxCents: enriched.retailPriceMaxCents,
    variants: enriched.variants.map((v) => ({
      id: v.id,
      name: v.name,
      retailPriceCents: v.retailPriceCents,
      imageUrl: v.imageUrl,
    })),
    estimatedDeliveryDays: 12,
  };
}

function normalizeCategory(raw: string | null | undefined): string {
  return (raw ?? "general").toLowerCase().replace(/\s+/g, "-").slice(0, 40) || "general";
}

export async function searchCjProducts(query: string, limit = 20): Promise<SourceProductDraft[]> {
  const token = await getCjAccessToken();
  if (!token) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const items = await fetchCjListV2(token, {
      page: "1",
      size: String(Math.min(limit, 40)),
      keyWord: trimmed,
      orderBy: "1",
      sort: "desc",
    });

    const seen = new Set<string>();
    const drafts: SourceProductDraft[] = [];
    for (const item of items) {
      const draft = await mapCjProduct(item, ["cj", "search"]);
      if (!draft || seen.has(draft.sourceProductId)) continue;
      seen.add(draft.sourceProductId);
      drafts.push(draft);
      if (drafts.length >= limit) break;
    }
    return drafts;
  } catch (err) {
    console.warn("[store/cj] search error:", err);
    return [];
  }
}

export async function fetchCjTrendingProducts(limit = 20): Promise<SourceProductDraft[]> {
  const token = await getCjAccessToken();
  if (!token) return [];

  try {
    const seen = new Set<string>();
    const drafts: SourceProductDraft[] = [];

    const trending = await fetchCjListV2(token, {
      page: "1",
      size: String(Math.min(limit, 30)),
      orderBy: "1",
      sort: "desc",
    });

    for (const item of trending) {
      const draft = await mapCjProduct(item);
      if (!draft || seen.has(draft.sourceProductId)) continue;
      seen.add(draft.sourceProductId);
      drafts.push(draft);
      if (drafts.length >= limit) break;
    }

    if (drafts.length >= limit) return drafts;

    for (const keyword of VIRAL_KEYWORDS) {
      const batch = await fetchCjListV2(token, {
        page: "1",
        size: "8",
        keyWord: keyword,
        orderBy: "1",
        sort: "desc",
      });
      for (const item of batch) {
        const draft = await mapCjProduct(item);
        if (!draft || seen.has(draft.sourceProductId)) continue;
        seen.add(draft.sourceProductId);
        drafts.push(draft);
        if (drafts.length >= limit) return drafts;
      }
    }

    return drafts;
  } catch (err) {
    console.warn("[store/cj] fetch error:", err);
    return [];
  }
}
