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
    description: "Limited usage across NI tools. Purchase individual tools or upgrade your plan.",
  },
  core: {
    tier: "core",
    name: "Core",
    monthlyPriceUsd: 20,
    annualMonthlyUsd: 13,
    annualTotalUsd: 159,
    toolSlots: 3,
    agenticSlots: 1,
    description: "3 intelligence tools with unlimited SaaS usage + 1 autonomous Agentic headless worker slot.",
  },
  pro: {
    tier: "pro",
    name: "Pro",
    monthlyPriceUsd: 39,
    annualMonthlyUsd: 27,
    annualTotalUsd: 324,
    toolSlots: 10,
    agenticSlots: 3,
    description: "10 intelligence tools with unlimited SaaS usage + 3 autonomous Agentic headless worker slots & MCP keys.",
  },
  power: {
    tier: "power",
    name: "Power",
    monthlyPriceUsd: 59,
    annualMonthlyUsd: 47,
    annualTotalUsd: 559,
    toolSlots: null,
    agenticSlots: null,
    description: "Unlimited intelligence tools with unlimited SaaS usage + unlimited autonomous Agentic headless worker execution.",
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

export function tierHasUnlimitedToolAccess(tier: string | null | undefined): boolean {
  return normalizeNiTier(tier) === "power";
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
