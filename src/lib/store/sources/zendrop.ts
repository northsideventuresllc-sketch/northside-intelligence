import "server-only";

import { supplierCostCentsFromUsd } from "@/lib/store/sources/cj-pricing";
import { callZendropMcpTool } from "@/lib/store/sources/zendrop-mcp";
import type { SourceProductDraft } from "@/lib/store/sources/types";

interface ZendropCatalogProduct {
  id?: string | number;
  product_id?: string | number;
  name?: string;
  title?: string;
  description?: string;
  price?: number | string;
  price_usd?: number | string;
  featured_image?: string;
  image?: string;
  images?: string[];
  categories?: string[];
  category?: string;
}

function normalizeCategory(raw: string | undefined, categories?: string[]): string {
  const primary = raw ?? categories?.[0] ?? "general";
  return primary.toLowerCase().replace(/\s+/g, "-").slice(0, 40) || "general";
}

function pickZendropPriceUsd(item: ZendropCatalogProduct): number | null {
  const candidates = [item.price_usd, item.price];
  for (const value of candidates) {
    const n = Number(value);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

function pickZendropImage(item: ZendropCatalogProduct): string {
  if (item.featured_image?.startsWith("http")) return item.featured_image;
  if (item.image?.startsWith("http")) return item.image;
  for (const url of item.images ?? []) {
    if (url.startsWith("http")) return url;
  }
  return "";
}

function mapZendropProduct(item: ZendropCatalogProduct): SourceProductDraft | null {
  const id = item.id ?? item.product_id;
  const name = (item.name ?? item.title)?.trim();
  const supplierUsd = pickZendropPriceUsd(item);
  if (id == null || !name || supplierUsd == null) return null;

  return {
    name,
    description: item.description?.trim() || name,
    imageUrl: pickZendropImage(item),
    category: normalizeCategory(item.category, item.categories),
    tags: ["zendrop", "us-shipping"],
    sourcePlatform: "zendrop",
    sourceProductId: String(id),
    supplierCostCents: supplierCostCentsFromUsd(supplierUsd),
    estimatedDeliveryDays: 7,
  };
}

function extractZendropProducts(payload: unknown): ZendropCatalogProduct[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as ZendropCatalogProduct[];
  if (typeof payload !== "object") return [];

  const root = payload as Record<string, unknown>;
  const candidates = [root.products, root.items, root.results, root.data];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate as ZendropCatalogProduct[];
    if (candidate && typeof candidate === "object") {
      const nested = candidate as Record<string, unknown>;
      if (Array.isArray(nested.products)) return nested.products as ZendropCatalogProduct[];
    }
  }
  return [];
}

/** Zendrop catalog via MCP (catalog:read scope). Requires ZENDROP_API_KEY. */
export async function searchZendropProducts(
  query: string,
  limit = 20
): Promise<SourceProductDraft[]> {
  if (!process.env.ZENDROP_API_KEY?.trim()) return [];

  const trimmed = query.trim();
  if (!trimmed) return [];

  const payload = await callZendropMcpTool<unknown>("get_catalog_products", {
    keyword: trimmed,
    page: 1,
    per_page: Math.min(limit, 60),
  });

  if (!payload) return [];

  const listings = extractZendropProducts(payload);
  const drafts: SourceProductDraft[] = [];
  const seen = new Set<string>();

  for (const item of listings) {
    const draft = mapZendropProduct(item);
    if (!draft || seen.has(draft.sourceProductId)) continue;
    seen.add(draft.sourceProductId);
    drafts.push(draft);
    if (drafts.length >= limit) break;
  }

  return drafts;
}
