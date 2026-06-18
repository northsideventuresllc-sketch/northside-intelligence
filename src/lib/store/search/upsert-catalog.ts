import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { draftSlug } from "@/lib/store/search/draft-to-view";
import type { SourceProductDraft } from "@/lib/store/sources/types";

function variantsForDb(draft: SourceProductDraft) {
  return draft.variants.map((v) => ({
    id: v.id,
    name: v.name,
    retail_price_cents: v.retailPriceCents,
    image_url: v.imageUrl,
  }));
}

/** Persist CJ search hits so PDP routes resolve at /store/p/[slug]. */
export async function upsertSearchDrafts(drafts: SourceProductDraft[]): Promise<void> {
  if (!drafts.length) return;

  const supabase = createServiceClient();
  for (const draft of drafts) {
    if (draft.sourcePlatform !== "cj") continue;
    const slug = draftSlug(draft);
    const retail = calculateRetailPriceCents(draft.supplierCostCents);
    await supabase.from("ni_store_catalog").upsert(
      {
        slug,
        name: draft.name,
        description: draft.description,
        image_url: draft.imageUrl,
        image_source: draft.imageSource,
        category: draft.category,
        tags: draft.tags,
        source_platform: "cj",
        source_product_id: draft.sourceProductId,
        supplier_cost_cents: draft.supplierCostCents,
        retail_price_cents: retail,
        retail_price_min_cents: draft.retailPriceMinCents,
        retail_price_max_cents: draft.retailPriceMaxCents,
        cj_variants: variantsForDb(draft),
        estimated_delivery_days: draft.estimatedDeliveryDays,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
  }
}
