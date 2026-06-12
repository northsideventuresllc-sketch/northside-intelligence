import { NextResponse } from "next/server";
import { getUserBillingState } from "@/lib/billing/entitlements";
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
    ownedToolSlugs: state.ownedToolSlugs,
    niTier: state.niTier,
    billingInterval: state.billingInterval,
    currentPeriodEnd: state.currentPeriodEnd,
    isMasterAccount: state.isMasterAccount,
    toolkit: state.toolkit,
    toolSlotsUsed: state.toolSlotsUsed,
    toolSlotLimit: state.toolSlotLimit,
    hasNiPaidPlan: state.hasNiPaidPlan,
    canAddNiPlanTool:
      !state.isMasterAccount &&
      state.niTier !== "free" &&
      (state.toolSlotLimit === null || state.toolSlotsUsed < state.toolSlotLimit),
  });
}
