import { NI_TIERS, PAID_NI_TIERS, type NiTier } from "@/lib/billing/ni-tiers";

export interface NiTierDetail {
  tier: NiTier;
  headline: string;
  features: string[];
  idealFor: string;
}

export const NI_TIER_DETAILS: Record<NiTier, NiTierDetail> = {
  free: {
    tier: "free",
    headline: "Get started at no cost",
    idealFor: "Exploring NI tools before committing to a plan",
    features: [
      "Limited usage across all Intelligence Tools",
      "Purchase individual tools à la carte (monthly, annual, or lifetime)",
      "Access to the Smart Store and your personal Toolkit",
      "Upgrade to a paid plan anytime for unlimited usage",
    ],
  },
  core: {
    tier: "core",
    headline: "Essential access for focused workflows",
    idealFor: "Individuals who rely on a few core Intelligence Tools daily",
    features: [
      "3 Intelligence Tool slots in your Toolkit",
      "Unlimited usage on tools assigned to your plan",
      "Add or swap tools within your slot limit",
      "Monthly or annual billing — save with annual",
      "All current and future NI tools eligible for assignment",
    ],
  },
  pro: {
    tier: "pro",
    headline: "Broader coverage for power users",
    idealFor: "Teams and professionals running multiple intelligence workflows",
    features: [
      "10 Intelligence Tool slots in your Toolkit",
      "Unlimited usage on tools assigned to your plan",
      "Add or swap tools within your slot limit",
      "Monthly or annual billing — save with annual",
      "Priority access to new Intelligence Tools as they launch",
    ],
  },
  power: {
    tier: "power",
    headline: "Full ecosystem access",
    idealFor: "Organizations that need every Intelligence Tool without limits",
    features: [
      "Unlimited Intelligence Tool slots",
      "Unlimited usage across all assigned tools",
      "Swap unlimited-access tools on a 72-hour cooldown",
      "Monthly or annual billing — save with annual",
      "Complete access to the entire NI Intelligence ecosystem",
    ],
  },
};

export const ALL_NI_TIERS: NiTier[] = ["free", ...PAID_NI_TIERS];

export function getNiTierDetail(tier: NiTier): NiTierDetail {
  return NI_TIER_DETAILS[tier];
}

export function formatToolSlotLabel(toolSlots: number | null): string {
  if (toolSlots === null) return "Unlimited tool slots";
  if (toolSlots === 0) return "No plan tool slots";
  return `${toolSlots} tool slot${toolSlots === 1 ? "" : "s"}`;
}

export function getTierPriceSummary(tier: NiTier, annual: boolean): string {
  const plan = NI_TIERS[tier];
  if (tier === "free") return "$0/mo";

  if (annual) {
    return `$${plan.annualMonthlyUsd}/mo billed annually ($${plan.annualTotalUsd}/yr)`;
  }

  return `$${plan.monthlyPriceUsd}/mo`;
}
