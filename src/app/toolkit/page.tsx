import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ToolkitGrid } from "@/components/billing/ToolkitGrid";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { canAddNiPlanTool, getUserBillingState } from "@/lib/billing/entitlements";
import { shouldShowPermanentAccessOffer } from "@/lib/billing/permanent-access-offer";
import { INTELLIGENCE_TOOL_SLUGS, mapDbPricing } from "@/lib/billing/tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { createServiceClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Tool Case | Northside Intelligence",
  description: "Your Intelligence Tools collection",
};

export default async function ToolkitPage() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?returnTo=/toolkit");
  }

  const state = await getUserBillingState(user.id);
  const owned = new Set(state.ownedToolSlugs);
  const availableToAdd = INTELLIGENCE_TOOL_SLUGS.filter((slug) => !owned.has(slug));

  const service = createServiceClient();
  const { data: pricingRows } = await service.from("ni_tool_pricing").select("*");
  const toolPricingBySlug = Object.fromEntries(
    (pricingRows ?? []).map((row) => [String(row.tool_slug), mapDbPricing(row)])
  );

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
              Your Collection
            </p>
            <h1 className="text-3xl font-semibold text-white">Tool Case</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
              Add Intelligence Tools to your Tool Case to use them. Assign unlimited access from
              your NI plan, or subscribe per tool at any time.
            </p>
          </div>

          <ToolkitGrid
            toolkit={state.toolkit}
            niTier={state.niTier}
            toolSlotsUsed={state.toolSlotsUsed}
            toolSlotLimit={state.toolSlotLimit}
            canAddNiPlanTool={canAddNiPlanTool(state)}
            availableToAdd={availableToAdd}
            isMasterAccount={state.isMasterAccount}
            canSwapUnlimitedTool={state.canSwapUnlimitedTool}
            nextUnlimitedSwapAt={state.nextUnlimitedSwapAt}
            toolPricingBySlug={toolPricingBySlug}
            showPermanentOfferFor={(slug) => shouldShowPermanentAccessOffer(slug, user.id)}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
