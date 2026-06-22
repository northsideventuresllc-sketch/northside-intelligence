import { getNiTierConfig } from "@/lib/billing/ni-tiers";
import {
  getUserBillingState,
  userCanUseTool,
  userHasUnlimitedToolAccess,
} from "@/lib/billing/entitlements";
import {
  getDeploymentTier,
  getTierLimits,
  normalizeGrantBotTier,
  TIER_LABELS,
} from "@/lib/grantbot/tier";

const UNLIMITED_GRANTS = 999999;

export interface GrantBotAccess {
  plan: string;
  planLabel: string;
  grantsLimit: number;
  hasUnlimitedAccess: boolean;
  niTier: string;
  ownsTool: boolean;
  canUseTool: boolean;
}

export async function getGrantBotAccess(userId: string): Promise<GrantBotAccess> {
  const state = await getUserBillingState(userId);
  const canUseTool = userCanUseTool(state, "grantbot");
  const hasUnlimited = userHasUnlimitedToolAccess(state, "grantbot");

  const service = await import("@/lib/supabase/server").then((m) => m.createServiceClient());
  const { data: profile } = await service
    .from("grantbot_profiles")
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  const legacyTier = normalizeGrantBotTier(profile?.tier);
  const deployment = getDeploymentTier();
  const legacyLimits = getTierLimits(deployment);

  if (!canUseTool) {
    return {
      plan: "none",
      planLabel: "Not in Toolkit",
      grantsLimit: 0,
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
      grantsLimit: UNLIMITED_GRANTS,
      hasUnlimitedAccess: true,
      niTier: state.niTier,
      ownsTool: true,
      canUseTool: true,
    };
  }

  const ownsTool = state.ownedToolSlugs.includes("grantbot");
  if (ownsTool) {
    const entry = state.toolkit.find((t) => t.toolSlug === "grantbot");
    if (
      entry?.accessType === "lifetime" ||
      entry?.accessType === "tool_subscription" ||
      entry?.accessType === "ni_plan"
    ) {
      return {
        plan: entry.accessType === "ni_plan" ? state.niTier : entry.accessType,
        planLabel: entry.accessType === "ni_plan" ? `NI ${state.niTier}` : "Tool Subscription",
        grantsLimit: UNLIMITED_GRANTS,
        hasUnlimitedAccess: true,
        niTier: state.niTier,
        ownsTool: true,
        canUseTool: true,
      };
    }
  }

  return {
    plan: legacyTier,
    planLabel: TIER_LABELS[legacyTier],
    grantsLimit: legacyLimits[legacyTier],
    hasUnlimitedAccess: false,
    niTier: state.niTier,
    ownsTool,
    canUseTool: true,
  };
}

export { UNLIMITED_GRANTS };
