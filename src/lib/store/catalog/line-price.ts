import type { CatalogProductRow } from "@/lib/store/catalog/products";

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
