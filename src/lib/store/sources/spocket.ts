import "server-only";

import { supplierCostCentsFromUsd } from "@/lib/store/sources/cj-pricing";
import type { SourceProductDraft } from "@/lib/store/sources/types";

const SPOCKET_API_BASE = "https://api.spocket.co";

interface SpocketListing {
  id?: string | number;
  title?: string;
  name?: string;
  description?: string;
  image_url?: string;
  image?: string;
  images?: Array<string | { url?: string }>;
  price?: number | string;
  price_cents?: number;
  shipping_time?: number | string;
  processing_time?: number | string;
  category?: string;
  tags?: string[];
}

function pickSpocketImage(item: SpocketListing): string {
  if (item.image_url?.startsWith("http")) return item.image_url;
  if (item.image?.startsWith("http")) return item.image;
  for (const entry of item.images ?? []) {
    if (typeof entry === "string" && entry.startsWith("http")) return entry;
    if (typeof entry === "object" && entry.url?.startsWith("http")) return entry.url;
  }
  return "";
}

function pickSpocketPriceUsd(item: SpocketListing): number | null {
  if (typeof item.price_cents === "number" && item.price_cents > 0) {
    return item.price_cents / 100;
  }
  const price = Number(item.price);
  if (Number.isFinite(price) && price > 0) return price;
  return null;
}

function normalizeCategory(raw: string | undefined): string {
  const text = (raw ?? "general").toLowerCase().replace(/\s+/g, "-").slice(0, 40);
  return text || "general";
}

function mapSpocketProduct(item: SpocketListing): SourceProductDraft | null {
  const id = item.id != null ? String(item.id) : "";
  const name = (item.title ?? item.name)?.trim();
  const supplierUsd = pickSpocketPriceUsd(item);
  if (!id || !name || supplierUsd == null) return null;

  const processingDays = Number(item.shipping_time ?? item.processing_time);
  const estimatedDeliveryDays =
    Number.isFinite(processingDays) && processingDays > 0
      ? Math.min(Math.max(Math.round(processingDays), 3), 14)
      : 7;

  return {
    name,
    description: item.description?.trim() || name,
    imageUrl: pickSpocketImage(item),
    category: normalizeCategory(item.category),
    tags: ["spocket", ...(item.tags ?? [])],
    sourcePlatform: "spocket",
    sourceProductId: id,
    supplierCostCents: supplierCostCentsFromUsd(supplierUsd),
    estimatedDeliveryDays,
  };
}

function extractSpocketListings(json: unknown): SpocketListing[] {
  if (!json || typeof json !== "object") return [];
  const root = json as Record<string, unknown>;
  const candidates = [root.products, root.data, root.items, root.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as SpocketListing[];
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.products)) return nested.products as SpocketListing[];
      if (Array.isArray(nested.items)) return nested.items as SpocketListing[];
    }
  }
  if (Array.isArray(json)) return json as SpocketListing[];
  return [];
}

/** Spocket REST API — US/EU suppliers. Requires SPOCKET_API_KEY. */
export async function searchSpocketProducts(
  query: string,
  limit = 20
): Promise<SourceProductDraft[]> {
  const apiKey = process.env.SPOCKET_API_KEY?.trim();
  if (!apiKey) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const params = new URLSearchParams({
      page: "1",
      per_page: String(Math.min(limit, 40)),
      keywords: trimmed,
    });

    const res = await fetch(`${SPOCKET_API_BASE}/v1/products?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn("[store/spocket] search failed:", res.status);
      return [];
    }

    const json = (await res.json()) as unknown;
    const listings = extractSpocketListings(json);
    const drafts: SourceProductDraft[] = [];
    const seen = new Set<string>();

    for (const item of listings) {
      const draft = mapSpocketProduct(item);
      if (!draft || seen.has(draft.sourceProductId)) continue;
      seen.add(draft.sourceProductId);
      drafts.push(draft);
      if (drafts.length >= limit) break;
    }

    return drafts;
  } catch (err) {
    console.warn("[store/spocket] search error:", err);
    return [];
  }
}
