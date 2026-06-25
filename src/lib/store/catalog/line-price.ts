import type { CatalogProductRow } from "@/lib/store/catalog/products";
import { STORE_MARKUP_RATE } from "@/lib/store/pricing";

export function resolveCatalogLineRetailCents(
  catalog: CatalogProductRow,
  variantId: string | null | undefined
): number {
  const id = variantId?.trim();
  if (id) {
    const variant = catalog.variants.find((v) => v.id === id);
    if (variant) return variant.retailPriceCents;
  }
  return catalog.retailPriceCents;
}

export function resolveCatalogLineSupplierCents(
  catalog: CatalogProductRow,
  variantId: string | null | undefined
): number {
  const id = variantId?.trim();
  if (id) {
    const variant = catalog.variants.find((v) => v.id === id);
    if (variant) {
      return Math.round(variant.retailPriceCents / (1 + STORE_MARKUP_RATE));
    }
  }
  return catalog.supplierCostCents;
}
