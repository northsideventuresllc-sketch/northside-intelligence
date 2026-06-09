import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ToolkitGrid } from "@/components/billing/ToolkitGrid";
import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { INTELLIGENCE_TOOL_SLUGS } from "@/lib/billing/tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export const metadata: Metadata = {
  title: "Toolkit | Northside Intelligence",
  description: "Your subscribed Intelligence Tools",
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

  return (
    <main className="min-h-screen bg-ni-bg">
      <Nav />
      <section className="relative px-6 pb-20 pt-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
              Your Collection
            </p>
            <h1 className="text-3xl font-semibold text-white">Toolkit</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm text-ni-muted">
              Intelligence Tools you are subscribed to — lifetime purchases, individual plans, and
              tools included in your NI subscription.
            </p>
          </div>

          <ToolkitGrid
            toolkit={state.toolkit}
            niTier={state.niTier}
            toolSlotsUsed={state.toolSlotsUsed}
            toolSlotLimit={state.toolSlotLimit}
            canAddNiPlanTool={state.niTier !== "free" && (state.toolSlotLimit === null || state.toolSlotsUsed < (state.toolSlotLimit ?? 0))}
            availableToAdd={availableToAdd}
          />
        </div>
      </section>
      <Footer />
    </main>
  );
}
