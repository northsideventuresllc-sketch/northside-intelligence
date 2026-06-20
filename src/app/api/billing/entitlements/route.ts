import { NextResponse } from "next/server";
import { getUserBillingState } from "@/lib/billing/entitlements";
import { INTELLIGENCE_TOOL_SLUGS } from "@/lib/billing/tool-pricing";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function GET() {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ownedToolSlugs: [], niTier: "free", toolkit: [] });
  }

  const state = await getUserBillingState(user.id);
  return NextResponse.json({
    ownedToolSlugs: state.isMasterAccount ? INTELLIGENCE_TOOL_SLUGS : state.ownedToolSlugs,
    niTier: state.niTier,
    billingInterval: state.billingInterval,
    currentPeriodEnd: state.currentPeriodEnd,
    niStripeSubscriptionId: state.niStripeSubscriptionId,
    isMasterAccount: state.isMasterAccount,
    toolkit: state.toolkit,
    toolSlotsUsed: state.toolSlotsUsed,
    toolSlotLimit: state.toolSlotLimit,
    hasNiPaidPlan: state.hasNiPaidPlan,
    canSwapUnlimitedTool: state.canSwapUnlimitedTool,
    nextUnlimitedSwapAt: state.nextUnlimitedSwapAt,
    lastUnlimitedSwapAt: state.lastUnlimitedSwapAt,
    canAddNiPlanTool:
      !state.isMasterAccount &&
      state.niTier !== "free" &&
      (state.toolSlotLimit === null || state.toolSlotsUsed < state.toolSlotLimit),
  });
}
