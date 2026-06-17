import { getNiTierConfig } from "@/lib/billing/ni-tiers";
import {
  getUserBillingState,
  userCanUseTool,
  userHasUnlimitedToolAccess,
} from "@/lib/billing/entitlements";
import { getDeploymentTier, getPlanLimits, normalizeUserPlan, PLAN_LABELS } from "@/lib/replyflow/tier";

const UNLIMITED_REPLIES = 999999;

export interface ReplyFlowAccess {
  plan: string;
  planLabel: string;
  repliesLimit: number;
  hasUnlimitedAccess: boolean;
  niTier: string;
  ownsTool: boolean;
  canUseTool: boolean;
}

export async function getReplyFlowAccess(userId: string): Promise<ReplyFlowAccess> {
  const state = await getUserBillingState(userId);
  const canUseTool = userCanUseTool(state, "replyflow");
  const hasUnlimited = userHasUnlimitedToolAccess(state, "replyflow");

  const service = await import("@/lib/supabase/server").then((m) => m.createServiceClient());
  const { data: profile } = await service
    .from("replyflow_profiles")
    .select("plan")
    .eq("id", userId)
    .maybeSingle();

  const legacyPlan = normalizeUserPlan(profile?.plan);
  const deployment = getDeploymentTier();
  const legacyLimits = getPlanLimits(deployment);

  if (!canUseTool) {
    return {
      plan: "none",
      planLabel: "Not in Tool Case",
      repliesLimit: 0,
      hasUnlimitedAccess: false,
      niTier: state.niTier,
      ownsTool: false,
      canUseTool: false,
    };
  }

  if (state.isMasterAccount || hasUnlimited) {
    const tierName = state.isMasterAccount
      ? "Master Account"
      : getNiTierConfig(state.niTier).name;
    return {
      plan: state.isMasterAccount ? "master" : state.niTier,
      planLabel: tierName,
      repliesLimit: UNLIMITED_REPLIES,
      hasUnlimitedAccess: true,
      niTier: state.niTier,
      ownsTool: true,
      canUseTool: true,
    };
  }

  const ownsTool = state.ownedToolSlugs.includes("replyflow");
  if (ownsTool) {
    const entry = state.toolkit.find((t) => t.toolSlug === "replyflow");
    if (entry?.accessType === "lifetime" || entry?.accessType === "tool_subscription" || entry?.accessType === "ni_plan") {
      return {
        plan: entry.accessType === "ni_plan" ? state.niTier : entry.accessType,
        planLabel: entry.accessType === "ni_plan" ? `NI ${state.niTier}` : "Tool Subscription",
        repliesLimit: UNLIMITED_REPLIES,
        hasUnlimitedAccess: true,
        niTier: state.niTier,
        ownsTool: true,
        canUseTool: true,
      };
    }
  }

  return {
    plan: legacyPlan,
    planLabel: PLAN_LABELS[legacyPlan],
    repliesLimit: legacyLimits[legacyPlan],
    hasUnlimitedAccess: false,
    niTier: state.niTier,
    ownsTool,
    canUseTool: true,
  };
}

export { UNLIMITED_REPLIES };
