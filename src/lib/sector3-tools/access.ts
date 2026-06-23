import { getNiTierConfig } from "@/lib/billing/ni-tiers";
import {
  getUserBillingState,
  userCanUseTool,
  userHasUnlimitedToolAccess,
} from "@/lib/billing/entitlements";
import { createServiceClient } from "@/lib/supabase/server";
import type { Sector3ToolRuntimeConfig } from "./types";

const UNLIMITED = 999999;

export interface Sector3ToolAccess {
  plan: string;
  planLabel: string;
  usageLimit: number;
  hasUnlimitedAccess: boolean;
  niTier: string;
  ownsTool: boolean;
  canUseTool: boolean;
}

function normalizeTier(tier: string | null | undefined): "free" | "lite" | "pro" {
  if (tier === "lite" || tier === "pro") return tier;
  return "free";
}

function legacyLimits(tier: "free" | "lite" | "pro", config: Sector3ToolRuntimeConfig): number {
  const deployment = process.env.TIER === "lite" ? "lite" : "pro";
  if (tier === "pro") return deployment === "lite" ? 50 : UNLIMITED;
  if (tier === "lite") return deployment === "lite" ? 10 : 25;
  return config.freeTierCap;
}

export async function getSector3ToolAccess(
  userId: string,
  config: Sector3ToolRuntimeConfig
): Promise<Sector3ToolAccess> {
  const state = await getUserBillingState(userId);
  const canUse = userCanUseTool(state, config.slug);
  const hasUnlimited = userHasUnlimitedToolAccess(state, config.slug);

  const service = createServiceClient();
  const { data: profile } = await service
    .from(config.profileTable)
    .select("tier")
    .eq("id", userId)
    .maybeSingle();

  const legacyTier = normalizeTier(profile?.tier as string | undefined);

  if (!canUse) {
    return {
      plan: "none",
      planLabel: "Not in Toolkit",
      usageLimit: 0,
      hasUnlimitedAccess: false,
      niTier: state.niTier,
      ownsTool: false,
      canUseTool: false,
    };
  }

  if (state.isMasterAccount || hasUnlimited) {
    return {
      plan: state.isMasterAccount ? "master" : state.niTier,
      planLabel: state.isMasterAccount
        ? "Master Account"
        : getNiTierConfig(state.niTier).name,
      usageLimit: UNLIMITED,
      hasUnlimitedAccess: true,
      niTier: state.niTier,
      ownsTool: true,
      canUseTool: true,
    };
  }

  const ownsTool = state.ownedToolSlugs.includes(config.slug);
  if (ownsTool) {
    const entry = state.toolkit.find((t) => t.toolSlug === config.slug);
    if (
      entry?.accessType === "lifetime" ||
      entry?.accessType === "tool_subscription" ||
      entry?.accessType === "ni_plan"
    ) {
      return {
        plan: entry.accessType === "ni_plan" ? state.niTier : entry.accessType,
        planLabel:
          entry.accessType === "ni_plan" ? `NI ${state.niTier}` : "Tool Subscription",
        usageLimit: UNLIMITED,
        hasUnlimitedAccess: true,
        niTier: state.niTier,
        ownsTool: true,
        canUseTool: true,
      };
    }
  }

  const labels = { free: "Free", lite: "Lite", pro: "Pro" } as const;

  return {
    plan: legacyTier,
    planLabel: labels[legacyTier],
    usageLimit: legacyLimits(legacyTier, config),
    hasUnlimitedAccess: false,
    niTier: state.niTier,
    ownsTool,
    canUseTool: true,
  };
}
