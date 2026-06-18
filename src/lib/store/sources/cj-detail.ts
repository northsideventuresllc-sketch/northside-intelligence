import "server-only";

import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { pickFirstReachableImage, parseCjImageList } from "@/lib/store/images/validate";
import { searchWebProductImage } from "@/lib/store/images/web-search";
import { getCjAccessToken } from "@/lib/store/sources/cj-auth";
import {
  parseCjListingPriceUsd,
  pickCjVariantSupplierUsd,
  supplierCostCentsFromUsd,
} from "@/lib/store/sources/cj-pricing";

export interface CjVariantDetail {
  id: string;
  name: string;
  supplierCostCents: number;
  retailPriceCents: number;
  imageUrl: string | null;
}

export interface CjProductDetail {
  sourceProductId: string;
  name: string;
  supplierCostCents: number;
  supplierCostMinCents: number;
  supplierCostMaxCents: number;
  retailPriceCents: number;
  retailPriceMinCents: number;
  retailPriceMaxCents: number;
  imageUrl: string;
  imageSource: "cj" | "serpapi";
  description: string;
  variants: CjVariantDetail[];
}

interface CjQueryResponse {
  productNameEn?: string;
  nameEn?: string;
  sellPrice?: string;
  description?: string;
  bigImage?: string;
  productImage?: string;
  variants?: Array<{
    vid?: string;
    variantSku?: string;
    variantNameEn?: string;
    variantSellPrice?: number | string;
    variantImage?: string;
  }>;
}

async function fetchCjQuery(pid: string, token: string): Promise<CjQueryResponse | null> {
  const url = new URL("https://developers.cjdropshipping.com/api2.0/v1/product/query");
  url.searchParams.set("pid", pid);
  url.searchParams.set("features", "enable_description");

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "CJ-Access-Token": token },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { data?: CjQueryResponse };
  return json.data ?? null;
}

function variantUsd(raw: number | string | undefined): number | null {
  const n = typeof raw === "string" ? parseCjListingPriceUsd(raw) : Number(raw);
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return n;
}

function buildVariants(detail: CjQueryResponse | null): CjVariantDetail[] {
  if (!detail?.variants?.length) return [];

  const variants: CjVariantDetail[] = [];
  for (const v of detail.variants) {
    const id = v.vid ?? v.variantSku;
    const name = v.variantNameEn?.trim();
    const usd = variantUsd(v.variantSellPrice);
    if (!id || !name || usd == null) continue;
    const supplierCostCents = supplierCostCentsFromUsd(usd);
    variants.push({
      id: String(id),
      name,
      supplierCostCents,
      retailPriceCents: calculateRetailPriceCents(supplierCostCents),
      imageUrl: v.variantImage?.startsWith("http") ? v.variantImage : null,
    });
  }
  return variants.sort((a, b) => a.retailPriceCents - b.retailPriceCents);
}

function rangeFromVariants(variants: CjVariantDetail[]): {
  supplierMin: number;
  supplierMax: number;
  retailMin: number;
  retailMax: number;
  supplierDefault: number;
  retailDefault: number;
} {
  if (!variants.length) {
    return {
      supplierMin: 0,
      supplierMax: 0,
      retailMin: 0,
      retailMax: 0,
      supplierDefault: 0,
      retailDefault: 0,
    };
  }
  const supplierCosts = variants.map((v) => v.supplierCostCents);
  const retailCosts = variants.map((v) => v.retailPriceCents);
  const supplierMax = Math.max(...supplierCosts);
  const retailMax = Math.max(...retailCosts);
  return {
    supplierMin: Math.min(...supplierCosts),
    supplierMax,
    retailMin: Math.min(...retailCosts),
    retailMax,
    supplierDefault: supplierMax,
    retailDefault: retailMax,
  };
}

function supplierUsdFromDetail(
  detail: CjQueryResponse,
  variants: CjVariantDetail[],
  listSellPrice?: string
): number | null {
  if (variants.length) return rangeFromVariants(variants).supplierDefault;
  const fromVariants = pickCjVariantSupplierUsd(detail.variants);
  const fromDetail = parseCjListingPriceUsd(detail.sellPrice);
  const fromList = parseCjListingPriceUsd(listSellPrice);
  const candidates = [fromVariants, fromDetail, fromList].filter(
    (n): n is number => n != null && n > 0
  );
  if (!candidates.length) return null;
  return Math.max(...candidates);
}

export async function enrichCjProductDetail(input: {
  sourceProductId: string;
  name: string;
  listSellPrice?: string;
  listImageUrl?: string;
}): Promise<CjProductDetail | null> {
  const token = await getCjAccessToken();
  if (!token) return null;

  const detail = await fetchCjQuery(input.sourceProductId, token);
  const variants = buildVariants(detail);
  const variantRange = rangeFromVariants(variants);

  const supplierUsd = detail
    ? supplierUsdFromDetail(detail, variants, input.listSellPrice)
    : parseCjListingPriceUsd(input.listSellPrice);
  if (supplierUsd == null || supplierUsd <= 0) return null;

  const exactName =
    detail?.productNameEn?.trim() || detail?.nameEn?.trim() || input.name.trim();

  const imageCandidates = [
    input.listImageUrl ?? "",
    ...parseCjImageList(detail?.productImage),
    detail?.bigImage ?? "",
    ...(detail?.variants?.map((v) => v.variantImage ?? "") ?? []),
    ...(variants.map((v) => v.imageUrl ?? "")),
  ];

  let imageUrl = (await pickFirstReachableImage(imageCandidates)) ?? "";
  let imageSource: "cj" | "serpapi" = "cj";
  if (!imageUrl) {
    imageUrl = (await searchWebProductImage(exactName)) ?? "";
    if (imageUrl) imageSource = "serpapi";
  }

  const supplierCostCents = variants.length
    ? variantRange.supplierDefault
    : supplierCostCentsFromUsd(supplierUsd);
  const retailPriceCents = variants.length
    ? variantRange.retailDefault
    : calculateRetailPriceCents(supplierCostCents);

  return {
    sourceProductId: input.sourceProductId,
    name: exactName,
    supplierCostCents,
    supplierCostMinCents: variants.length
      ? variantRange.supplierMin
      : supplierCostCents,
    supplierCostMaxCents: variants.length
      ? variantRange.supplierMax
      : supplierCostCents,
    retailPriceCents,
    retailPriceMinCents: variants.length ? variantRange.retailMin : retailPriceCents,
    retailPriceMaxCents: variants.length ? variantRange.retailMax : retailPriceCents,
    imageUrl,
    imageSource,
    description: detail?.description?.trim() || exactName,
    variants,
  };
}
