import "server-only";

import { calculateRetailPriceCents } from "@/lib/store/pricing";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import type { SourceProductDraft } from "@/lib/store/sources/types";

export function draftSlug(draft: SourceProductDraft): string {
  return `${draft.sourcePlatform}-${draft.sourceProductId}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
}

export function draftToCatalogView(draft: SourceProductDraft): CatalogProductView {
  const slug = draftSlug(draft);
  return {
    id: slug,
    slug,
    name: draft.name,
    description: draft.description,
    imageUrl: draft.imageUrl || null,
    category: draft.category,
    tags: draft.tags,
    retailPriceCents: calculateRetailPriceCents(draft.supplierCostCents),
    currency: "usd",
    estimatedDeliveryDays: draft.estimatedDeliveryDays,
    reviewRating: null,
    reviewCount: 0,
    sourcePlatform: draft.sourcePlatform,
  };
}
