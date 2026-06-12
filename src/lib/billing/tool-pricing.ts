import { INTELLIGENCE_TOOLS } from "@/lib/constants";
import {
  getAllSector3ToolProfiles,
  getSector3ToolProfile,
} from "@/lib/billing/sector3-tool-pricing";

export interface ToolPricing {
  toolSlug: string;
  baseMonthlyUsd: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  lifetimePriceUsd: number;
  demandMultiplier: number;
  targetAudience: string;
  marketTier: string;
  stripeMonthlyPriceId: string | null;
  stripeAnnualPriceId: string | null;
  stripeLifetimePriceId: string | null;
}

const DEMAND_FACTORS: Record<string, number> = {
  high: 1.15,
  medium: 1.0,
  low: 0.9,
};

/** Compute market-adjusted subscription pricing from a Sector 3 catalog profile. */
export function computeToolPricingFromProfile(
  profile: ReturnType<typeof getSector3ToolProfile>
): Omit<
  ToolPricing,
  "toolSlug" | "stripeMonthlyPriceId" | "stripeAnnualPriceId" | "stripeLifetimePriceId"
> | null {
  if (!profile) return null;

  const demandMultiplier = DEMAND_FACTORS[profile.demandSignal] ?? 1.0;
  const monthlyPriceUsd = Math.round(profile.baseMonthlyUsd * demandMultiplier);
  const annualPriceUsd = Math.round(monthlyPriceUsd * profile.annualMonthsFactor);
  const lifetimePriceUsd = Math.round(
    monthlyPriceUsd * profile.lifetimeMonthsFactor * demandMultiplier
  );

  return {
    baseMonthlyUsd: profile.baseMonthlyUsd,
    monthlyPriceUsd,
    annualPriceUsd,
    lifetimePriceUsd,
    demandMultiplier,
    targetAudience: profile.targetAudience,
    marketTier: profile.marketTier,
  };
}

/** Compute market-adjusted pricing from base monthly and demand signal. */
export function computeToolPricing(
  toolSlug: string,
  baseMonthlyUsd: number,
  demandSignal?: string | null
): Omit<
  ToolPricing,
  | "toolSlug"
  | "stripeMonthlyPriceId"
  | "stripeAnnualPriceId"
  | "stripeLifetimePriceId"
  | "targetAudience"
  | "marketTier"
> {
  const profile = getSector3ToolProfile(toolSlug);
  if (profile) {
    const computed = computeToolPricingFromProfile(profile);
    if (computed) return computed;
  }

  const signal = (demandSignal ?? "medium").toLowerCase();
  const demandMultiplier = DEMAND_FACTORS[signal] ?? 1.0;
  const monthlyPriceUsd = Math.round(baseMonthlyUsd * demandMultiplier);
  const annualPriceUsd = Math.round(monthlyPriceUsd * 10);
  const lifetimePriceUsd = Math.round(monthlyPriceUsd * 21 * demandMultiplier);

  return {
    baseMonthlyUsd,
    monthlyPriceUsd,
    annualPriceUsd,
    lifetimePriceUsd,
    demandMultiplier,
  };
}

export function getDefaultBasePrice(toolSlug: string): number {
  return getSector3ToolProfile(toolSlug)?.baseMonthlyUsd ?? 19;
}

export function mapDbPricing(row: Record<string, unknown>): ToolPricing {
  const toolSlug = String(row.tool_slug);
  const profile = getSector3ToolProfile(toolSlug);

  return {
    toolSlug,
    baseMonthlyUsd: Number(row.base_monthly_usd),
    monthlyPriceUsd: Number(row.monthly_price_usd),
    annualPriceUsd: Number(row.annual_price_usd),
    lifetimePriceUsd: Number(row.lifetime_price_usd),
    demandMultiplier: Number(row.demand_multiplier),
    targetAudience: profile?.targetAudience ?? "Intelligence tool subscribers",
    marketTier: profile?.marketTier ?? "growth",
    stripeMonthlyPriceId: (row.stripe_monthly_price_id as string) ?? null,
    stripeAnnualPriceId: (row.stripe_annual_price_id as string) ?? null,
    stripeLifetimePriceId: (row.stripe_lifetime_price_id as string) ?? null,
  };
}

export const INTELLIGENCE_TOOL_SLUGS = INTELLIGENCE_TOOLS.map((t) => t.slug);

export function getCatalogSeedRows(): Array<{
  tool_slug: string;
  base_monthly_usd: number;
  monthly_price_usd: number;
  annual_price_usd: number;
  lifetime_price_usd: number;
  demand_multiplier: number;
}> {
  return getAllSector3ToolProfiles().map((profile) => {
    const computed = computeToolPricingFromProfile(profile)!;
    return {
      tool_slug: profile.toolSlug,
      base_monthly_usd: computed.baseMonthlyUsd,
      monthly_price_usd: computed.monthlyPriceUsd,
      annual_price_usd: computed.annualPriceUsd,
      lifetime_price_usd: computed.lifetimePriceUsd,
      demand_multiplier: computed.demandMultiplier,
    };
  });
}
