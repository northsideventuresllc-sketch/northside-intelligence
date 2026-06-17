import "server-only";

import { pickFirstReachableImage, parseCjImageList } from "@/lib/store/images/validate";
import { searchWebProductImage } from "@/lib/store/images/web-search";
import { getCjAccessToken } from "@/lib/store/sources/cj-auth";
import {
  parseCjListingPriceUsd,
  pickCjVariantSupplierUsd,
  supplierCostCentsFromUsd,
} from "@/lib/store/sources/cj-pricing";

export interface CjProductDetail {
  sourceProductId: string;
  supplierCostCents: number;
  imageUrl: string;
  description: string;
}

interface CjQueryResponse {
  sellPrice?: string;
  description?: string;
  bigImage?: string;
  productImage?: string;
  variants?: Array<{
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
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;

  const json = (await res.json()) as { data?: CjQueryResponse };
  return json.data ?? null;
}

function supplierUsdFromDetail(
  detail: CjQueryResponse,
  listSellPrice?: string
): number | null {
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
  const supplierUsd = detail
    ? supplierUsdFromDetail(detail, input.listSellPrice)
    : parseCjListingPriceUsd(input.listSellPrice);
  if (supplierUsd == null || supplierUsd <= 0) return null;

  const imageCandidates = [
    input.listImageUrl ?? "",
    ...parseCjImageList(detail?.productImage),
    detail?.bigImage ?? "",
    ...(detail?.variants?.map((v) => v.variantImage ?? "") ?? []),
  ];

  let imageUrl = (await pickFirstReachableImage(imageCandidates)) ?? "";
  if (!imageUrl) {
    imageUrl = (await searchWebProductImage(input.name)) ?? "";
  }

  return {
    sourceProductId: input.sourceProductId,
    supplierCostCents: supplierCostCentsFromUsd(supplierUsd),
    imageUrl,
    description: detail?.description?.trim() || input.name,
  };
}
