export type NiTier = "free" | "core" | "pro" | "power";

/** @deprecated Legacy tier slugs from pre-rename subscriptions — normalized at read time. */
export type LegacyNiTier = "standard" | "premium" | "ultimate";

export type BillingInterval = "monthly" | "annual";

export interface NiTierConfig {
  tier: NiTier;
  name: string;
  monthlyPriceUsd: number;
  annualMonthlyUsd: number;
  annualTotalUsd: number;
  toolSlots: number | null;
  agenticSlots: number | null;
  /** 0-1 discount on additional IT purchases once slots are full (Power only). */
  overageDiscount: number;
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
    agenticSlots: 0,
    overageDiscount: 0,
    description: "No bundled tools — purchase each IT individually.",
  },
  core: {
    tier: "core",
    name: "Core",
    monthlyPriceUsd: 20,
    annualMonthlyUsd: 13,
    annualTotalUsd: 159,
    toolSlots: 2,
    agenticSlots: 1,
    overageDiscount: 0,
    description: "2 SaaS Access IT slots + 1 Agentic Access IT slot.",
  },
  pro: {
    tier: "pro",
    name: "Pro",
    monthlyPriceUsd: 39,
    annualMonthlyUsd: 27,
    annualTotalUsd: 324,
    toolSlots: 4,
    agenticSlots: 1,
    overageDiscount: 0,
    description: "4 SaaS Access IT slots + 1 Agentic Access IT slot.",
  },
  power: {
    tier: "power",
    name: "Power",
    monthlyPriceUsd: 59,
    annualMonthlyUsd: 47,
    annualTotalUsd: 559,
    toolSlots: 8,
    agenticSlots: 4,
    overageDiscount: 0.5,
    description: "8 SaaS Access IT slots + 4 Agentic Access IT slots, plus 50% off any additional ITs once slots are full.",
  },
};

export const PAID_NI_TIERS: NiTier[] = ["core", "pro", "power"];

const LEGACY_TIER_MAP: Record<LegacyNiTier, NiTier> = {
  standard: "core",
  premium: "pro",
  ultimate: "power",
};

export function normalizeNiTier(tier: string | null | undefined): NiTier {
  if (!tier) return "free";
  if (tier in NI_TIERS) return tier as NiTier;
  if (tier in LEGACY_TIER_MAP) return LEGACY_TIER_MAP[tier as LegacyNiTier];
  return "free";
}

export function getNiTierConfig(tier: string | null | undefined): NiTierConfig {
  return NI_TIERS[normalizeNiTier(tier)];
}

/**
 * No tier has unlimited tool access anymore (Power is 8 SaaS + 4 agentic slots).
 * Master accounts bypass via isMasterAccount checks elsewhere. Kept for
 * backward-compat; always false.
 */
export function tierHasUnlimitedToolAccess(_tier: string | null | undefined): boolean {
  return false;
}

export function getToolSlotLimit(tier: string | null | undefined): number | null {
  return NI_TIERS[normalizeNiTier(tier)].toolSlots;
}

export function getAgenticSlotLimit(tier: string | null | undefined): number | null {
  return NI_TIERS[normalizeNiTier(tier)].agenticSlots;
}

export function formatNiPrice(usd: number): string {
  return usd % 1 === 0 ? usd.toFixed(0) : usd.toFixed(2);
}
