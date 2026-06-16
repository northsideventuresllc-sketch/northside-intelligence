import type { UserBillingState } from "@/lib/billing/entitlements";
import { getNiTierConfig, NI_TIERS, PAID_NI_TIERS, type NiTier } from "@/lib/billing/ni-tiers";

export const HIGHEST_PAID_NI_TIER: NiTier = "power";

export function isHighestPaidNiTier(tier: NiTier): boolean {
  return tier === HIGHEST_PAID_NI_TIER;
}

export function getNextNiTier(tier: NiTier): NiTier | null {
  if (tier === "free") return "core";
  if (tier === "core") return "pro";
  if (tier === "pro") return "power";
  return null;
}

export function getPausableSubscriptionId(
  state: UserBillingState,
  context: "portal" | "tool",
  toolSlug?: string
): string | null {
  if (context === "tool" && toolSlug) {
    const toolEntry = state.toolkit.find(
      (entry) =>
        entry.toolSlug === toolSlug &&
        entry.accessType === "tool_subscription" &&
        entry.stripeSubscriptionId
    );
    if (toolEntry?.stripeSubscriptionId) return toolEntry.stripeSubscriptionId;
  }
  return state.niStripeSubscriptionId;
}

export function hasPausableSubscription(
  state: UserBillingState,
  context: "portal" | "tool",
  toolSlug?: string
): boolean {
  return getPausableSubscriptionId(state, context, toolSlug) !== null;
}

export function getUpgradeCheckoutPayload(state: UserBillingState): {
  type: "ni_subscription";
  tier: NiTier;
  interval: "monthly" | "annual";
} | null {
  const nextTier = getNextNiTier(state.niTier);
  if (!nextTier) return null;
  return {
    type: "ni_subscription",
    tier: nextTier,
    interval: state.billingInterval ?? "monthly",
  };
}

export function getCurrentPlanSummary(state: UserBillingState): {
  tierName: string;
  description: string;
} {
  if (state.isMasterAccount) {
    return {
      tierName: "Master Account",
      description: "Unlimited access to all Intelligence Tools.",
    };
  }
  const config = getNiTierConfig(state.niTier);
  return {
    tierName: config.name,
    description: config.description,
  };
}

export function formatTierPrice(tier: NiTier, annual: boolean): string {
  const plan = NI_TIERS[tier];
  if (tier === "free") return "$0/mo";
  const price = annual ? plan.annualMonthlyUsd : plan.monthlyPriceUsd;
  return `$${price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}/mo`;
}

export const PAID_NI_TIER_ORDER = PAID_NI_TIERS;
