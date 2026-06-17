import "server-only";

import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { getCjAccessToken } from "@/lib/store/sources/cj-auth";

/**
 * CJ Dropshipping API integration.
 * Requires CJ_DROPSHIPPING_API_KEY — returns [] when not configured.
 * Docs: https://developers.cjdropshipping.com/
 */
export interface CjProductDraft {
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  tags: string[];
  sourceProductId: string;
  supplierCostCents: number;
  estimatedDeliveryDays: number;
}

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
    next: { revalidate: 3600 },
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

function mapCjProduct(item: CjListV2Product): CjProductDraft | null {
  const id = item.id ?? item.sku;
  const name = item.nameEn?.trim();
  if (!id || !name) return null;

  const sell = parseFloat(item.sellPrice ?? "0");
  if (!Number.isFinite(sell) || sell <= 0) return null;

  const category = (item.threeCategoryName ?? "general")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .slice(0, 40);

  return {
    name,
    description: name,
    imageUrl: item.bigImage ?? "",
    category: category || "general",
    tags: ["cj", "trending"],
    sourceProductId: id,
    supplierCostCents: Math.round(sell * 100),
    estimatedDeliveryDays: 12,
  };
}

export async function fetchCjTrendingProducts(limit = 10): Promise<CjProductDraft[]> {
  const token = await getCjAccessToken();
  if (!token) return [];

  try {
    const seen = new Set<string>();
    const drafts: CjProductDraft[] = [];

    const trending = await fetchCjListV2(token, {
      page: "1",
      size: String(Math.min(limit, 20)),
      orderBy: "1",
      sort: "desc",
    });

    for (const item of trending) {
      const draft = mapCjProduct(item);
      if (!draft || seen.has(draft.sourceProductId)) continue;
      seen.add(draft.sourceProductId);
      drafts.push(draft);
      if (drafts.length >= limit) break;
    }

    if (drafts.length >= limit) return drafts;

    for (const keyword of VIRAL_KEYWORDS) {
      const batch = await fetchCjListV2(token, {
        page: "1",
        size: "5",
        keyWord: keyword,
        orderBy: "1",
        sort: "desc",
      });
      for (const item of batch) {
        const draft = mapCjProduct(item);
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

/** Retail price with NI 10% markup for CJ drafts. */
export function cjDraftRetailCents(draft: CjProductDraft): number {
  return calculateRetailPriceCents(draft.supplierCostCents);
}
