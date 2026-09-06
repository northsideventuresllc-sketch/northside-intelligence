import { buildVariantDescriptionParts } from "@/lib/store/catalog/description";
import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { parseCjListingPriceUsd, supplierCostCentsFromUsd } from "@/lib/store/sources/cj-pricing";

export interface CjVariantDetail {
  id: string;
  name: string;
  supplierCostCents: number;
  retailPriceCents: number;
  imageUrl: string | null;
  description: string;
}

export interface CjVariantInput {
  vid?: string;
  variantSku?: string;
  variantNameEn?: string;
  variantKey?: string;
  variantSellPrice?: number | string;
  variantImage?: string;
}

function variantUsd(raw: number | string | undefined): number | null {
  const n = typeof raw === "string" ? parseCjListingPriceUsd(raw) : Number(raw);
  if (n == null || !Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function buildVariants(
  variantInputs: CjVariantInput[] | undefined,
  productDescription: string,
  productName: string
): CjVariantDetail[] {
  if (!variantInputs?.length) return [];

  const variants: CjVariantDetail[] = [];
  for (const v of variantInputs) {
    const id = v.vid ?? v.variantSku;
    // NI-STORE-SHIP-OVERESTIMATE-0817: CJ leaves variantNameEn blank for many
    // single-SKU products (confirmed live on cj-1992903820062793730 - real vid
    // and price, empty variantNameEn) - falling back to variantKey/variantSku
    // instead of dropping the variant. A dropped variant here means the item
    // never gets a variantId anywhere downstream: shipping-quote.ts silently
    // falls back to flat-rate AND fulfill-order.ts refuses to submit the CJ
    // order at all ("no CJ line items with variant IDs") - a paid order that
    // never ships.
    const name = v.variantNameEn?.trim() || v.variantKey?.trim() || v.variantSku?.trim() || productName;
    const usd = variantUsd(v.variantSellPrice);
    if (!id || !name || usd == null) continue;
    const supplierCostCents = supplierCostCentsFromUsd(usd);
    const parts = buildVariantDescriptionParts(productDescription, name, productName);
    const variantDescription = parts.variation
      ? `${parts.overview} ${parts.variation}`
      : parts.overview;
    variants.push({
      id: String(id),
      name,
      supplierCostCents,
      retailPriceCents: calculateRetailPriceCents(supplierCostCents),
      imageUrl: v.variantImage?.startsWith("http") ? v.variantImage : null,
      description: variantDescription,
    });
  }
  return variants.sort((a, b) => a.retailPriceCents - b.retailPriceCents);
}
