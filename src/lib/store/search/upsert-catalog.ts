import "server-only";

import { createServiceClient } from "@/lib/supabase/server";
import { calculateRetailPriceCents } from "@/lib/store/pricing";
import { draftSlug } from "@/lib/store/search/draft-to-view";
import type { SourceProductDraft } from "@/lib/store/sources/types";

/** Persist search hits so PDP routes resolve at /store/p/[slug]. */
export async function upsertSearchDrafts(drafts: SourceProductDraft[]): Promise<void> {
  if (!drafts.length) return;

  const supabase = createServiceClient();
  for (const draft of drafts) {
    const slug = draftSlug(draft);
    const retail = calculateRetailPriceCents(draft.supplierCostCents);
    await supabase.from("ni_store_catalog").upsert(
      {
        slug,
        name: draft.name,
        description: draft.description,
        image_url: draft.imageUrl,
        category: draft.category,
        tags: draft.tags,
        source_platform: draft.sourcePlatform,
        source_product_id: draft.sourceProductId,
        supplier_cost_cents: draft.supplierCostCents,
        retail_price_cents: retail,
        estimated_delivery_days: draft.estimatedDeliveryDays,
        active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
  }
}
