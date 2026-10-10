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
      "10 free trial runs across each Intelligence Tool every month",
      "Purchase individual tools à la carte (monthly, annual, or lifetime)",
      "Access to the Smart Store and your personal Toolkit",
      "Upgrade anytime for unlimited web runs and Autopilot app connections",
    ],
  },
  core: {
    tier: "core",
    headline: "Essential access for focused workflows",
    idealFor: "Individuals who rely on a few core tools daily",
    features: [
      "2 SaaS Access IT slots in your Toolkit",
      "1 Agentic Access IT slot included (covers SaaS + agentic for that tool)",
      "Unlimited usage on tools assigned to your plan",
      "Add or swap tools within your slot limit anytime",
      "Direct line to submit new tool ideas and feedback",
    ],
  },
  pro: {
    tier: "pro",
    headline: "Broader coverage for power users & teams",
    idealFor: "Teams and operators running multiple automated workflows",
    features: [
      "4 SaaS Access IT slots in your Toolkit",
      "1 Agentic Access IT slot included (covers SaaS + agentic for that tool)",
      "Priority AI processing speed and higher throughput",
      "Custom app and internal tool connections enabled",
      "Add or swap tools within your slot limit",
    ],
  },
  power: {
    tier: "power",
    headline: "Full ecosystem access with overage savings",
    idealFor: "Organizations that need every Intelligence Tool on full autopilot",
    features: [
      "8 SaaS Access IT slots in your Toolkit",
      "4 Agentic Access IT slots across all present and future tools",
      "50% off any additional ITs once your slots are full",
      "Maximum priority AI computing power",
      "Zero swap cooldowns across all tools",
      "Early access to downloadable local software",
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
