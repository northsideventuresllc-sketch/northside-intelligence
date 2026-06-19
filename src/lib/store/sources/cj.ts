import "server-only";

import { calculateRetailPriceCents } from "@/lib/store/pricing";
import {
  classifyStoreCategory,
  classifyStoreCategoryByKeywords,
} from "@/lib/store/catalog/classify-category";
import { enrichCjProductDetail } from "@/lib/store/sources/cj-detail";
import { getCjAccessToken } from "@/lib/store/sources/cj-auth";
import { parseCjListingPriceUsd, supplierCostCentsFromUsd } from "@/lib/store/sources/cj-pricing";
import type { SourceProductDraft } from "@/lib/store/sources/types";

/**
 * CJ Dropshipping API integration.
 * Requires CJ_DROPSHIPPING_API_KEY — returns [] when not configured.
 */
const VIRAL_KEYWORDS = ["portable", "wireless", "led", "pet", "kitchen", "phone"];

/** Keyword slices for bulk catalog sync — CJ caps each slice at 6000 SKUs. */
export const CJ_CATALOG_KEYWORD_SLICES = [
  "",
  "kitchen",
  "phone",
  "home",
  "beauty",
  "pet",
  "car",
  "toy",
  "wireless",
  "led",
  "fitness",
  "health",
  "smart",
  "outdoor",
  "jewelry",
  "watch",
  "bag",
  "shirt",
  "tool",
  "baby",
  "office",
  "garden",
  "camera",
  "speaker",
  "lamp",
] as const;

interface CjListV2Product {
  id?: string;
  nameEn?: string;
  sku?: string;
  bigImage?: string;
  sellPrice?: string;
  listedNum?: number;
  threeCategoryName?: string | null;
}

interface CjListV2Response {
  products: CjListV2Product[];
  pageNumber: number;
  totalPages: number | null;
  totalRecords: number | null;
}

async function fetchCjListV2Raw(
  token: string,
  params: Record<string, string>
): Promise<CjListV2Response> {
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
    return { products: [], pageNumber: 1, totalPages: null, totalRecords: null };
  }

  const json = (await res.json()) as {
    data?: {
      content?: Array<{ productList?: CjListV2Product[] }>;
      list?: CjListV2Product[];
      pageNumber?: number;
      totalPages?: number;
      totalRecords?: number;
    };
  };

  const fromContent =
    json.data?.content?.flatMap((group) => group.productList ?? []) ?? [];
  const products = fromContent.length ? fromContent : (json.data?.list ?? []);

  return {
    products,
    pageNumber: Number(json.data?.pageNumber ?? params.page ?? 1),
    totalPages: json.data?.totalPages != null ? Number(json.data.totalPages) : null,
    totalRecords: json.data?.totalRecords != null ? Number(json.data.totalRecords) : null,
  };
}

async function fetchCjListV2(
  token: string,
  params: Record<string, string>
): Promise<CjListV2Product[]> {
  const result = await fetchCjListV2Raw(token, params);
  return result.products;
}

export interface CjCatalogPageResult {
  products: CjListV2Product[];
  pageNumber: number;
  totalPages: number | null;
  totalRecords: number | null;
}

export async function fetchCjCatalogPage(options: {
  page: number;
  size: number;
  keyWord?: string;
}): Promise<CjCatalogPageResult> {
  const token = await getCjAccessToken();
  if (!token) {
    return { products: [], pageNumber: options.page, totalPages: null, totalRecords: null };
  }

  const params: Record<string, string> = {
    page: String(Math.max(1, options.page)),
    size: String(Math.min(Math.max(1, options.size), 100)),
    orderBy: "3",
    sort: "desc",
  };
  if (options.keyWord?.trim()) params.keyWord = options.keyWord.trim();

  const result = await fetchCjListV2Raw(token, params);
  return {
    products: result.products,
    pageNumber: result.pageNumber,
    totalPages: result.totalPages,
    totalRecords: result.totalRecords,
  };
}

/** Fast listV2 → draft mapping for bulk sync (no product/query enrich, keyword categories only). */
export function mapCjListItemToDraftFast(
  item: CjListV2Product,
  tags: string[] = ["cj", "catalog-sync"]
): SourceProductDraft | null {
  const id = item.id ?? item.sku;
  const name = item.nameEn?.trim();
  if (!id || !name) return null;

  const supplierUsd = parseCjListingPriceUsd(item.sellPrice);
  if (supplierUsd == null || supplierUsd <= 0) return null;

  const supplierCostCents = supplierCostCentsFromUsd(supplierUsd);
  const retail = calculateRetailPriceCents(supplierCostCents);
  const category = classifyStoreCategoryByKeywords(name);

  return {
    name,
    description: name,
    imageUrl: item.bigImage || "",
    imageSource: "cj",
    category,
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
    const category = await classifyStoreCategory({ name: listName, description: listName });
    return {
      name: listName,
      description: listName,
      imageUrl: item.bigImage || "",
      imageSource: item.bigImage ? "cj" : "serpapi",
      category,
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

  const category = await classifyStoreCategory({
    name: enriched.name,
    description: enriched.description,
  });

  return {
    name: enriched.name,
    description: enriched.description,
    imageUrl: enriched.imageUrl || item.bigImage || "",
    imageSource: enriched.imageSource,
    category,
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
