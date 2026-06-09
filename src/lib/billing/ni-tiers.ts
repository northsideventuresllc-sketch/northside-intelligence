export type NiTier = "free" | "standard" | "premium" | "ultimate";
export type BillingInterval = "monthly" | "annual";

export interface NiTierConfig {
  tier: NiTier;
  name: string;
  monthlyPriceUsd: number;
  annualMonthlyUsd: number;
  annualTotalUsd: number;
  toolSlots: number | null;
  description: string;
}

export const NI_TIERS: Record<NiTier, NiTierConfig> = {
  free: {
    tier: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    annualMonthlyUsd: 0,
    annualTotalUsd: 0,
    toolSlots: 0,
    description: "Limited usage across NI tools. Purchase individual tools or upgrade your plan.",
  },
  standard: {
    tier: "standard",
    name: "Standard",
    monthlyPriceUsd: 12,
    annualMonthlyUsd: 10,
    annualTotalUsd: 120,
    toolSlots: 3,
    description: "3 intelligence tools with unlimited usage under your plan.",
  },
  premium: {
    tier: "premium",
    name: "Premium",
    monthlyPriceUsd: 29,
    annualMonthlyUsd: 22,
    annualTotalUsd: 264,
    toolSlots: 10,
    description: "10 intelligence tools with unlimited usage under your plan.",
  },
  ultimate: {
    tier: "ultimate",
    name: "Ultimate",
    monthlyPriceUsd: 59,
    annualMonthlyUsd: 45,
    annualTotalUsd: 540,
    toolSlots: null,
    description: "Unlimited intelligence tools with unlimited usage.",
  },
};

export const PAID_NI_TIERS: NiTier[] = ["standard", "premium", "ultimate"];

export function getNiTierConfig(tier: string | null | undefined): NiTierConfig {
  const key = (tier ?? "free") as NiTier;
  return NI_TIERS[key] ?? NI_TIERS.free;
}

export function tierHasUnlimitedToolAccess(tier: NiTier): boolean {
  return tier === "ultimate";
}

export function getToolSlotLimit(tier: NiTier): number | null {
  return NI_TIERS[tier].toolSlots;
}
