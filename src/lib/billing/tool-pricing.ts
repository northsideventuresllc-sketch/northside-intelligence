import { INTELLIGENCE_TOOLS } from "@/lib/constants";

export interface ToolPricing {
  toolSlug: string;
  baseMonthlyUsd: number;
  monthlyPriceUsd: number;
  annualPriceUsd: number;
  lifetimePriceUsd: number;
  demandMultiplier: number;
  stripeMonthlyPriceId: string | null;
  stripeAnnualPriceId: string | null;
  stripeLifetimePriceId: string | null;
}

const DEMAND_FACTORS: Record<string, number> = {
  high: 1.15,
  medium: 1.0,
  low: 0.9,
};

const DEFAULT_BASE_PRICES: Record<string, number> = {
  replyflow: 19,
  grantbot: 39,
  signaldesk: 24,
  gapscan: 18,
  bridgeai: 29,
};

/** Compute market-adjusted pricing from base monthly and demand signal. */
export function computeToolPricing(
  toolSlug: string,
  baseMonthlyUsd: number,
  demandSignal?: string | null
): Omit<ToolPricing, "toolSlug" | "stripeMonthlyPriceId" | "stripeAnnualPriceId" | "stripeLifetimePriceId"> {
  const signal = (demandSignal ?? "medium").toLowerCase();
  const demandMultiplier = DEMAND_FACTORS[signal] ?? 1.0;
  const monthlyPriceUsd = Math.round(baseMonthlyUsd * demandMultiplier * 100) / 100;
  const annualPriceUsd = Math.round(monthlyPriceUsd * 10 * 100) / 100;
  const lifetimePriceUsd = Math.round(monthlyPriceUsd * 21 * demandMultiplier * 100) / 100;

  return {
    baseMonthlyUsd,
    monthlyPriceUsd,
    annualPriceUsd,
    lifetimePriceUsd,
    demandMultiplier,
  };
}

export function getDefaultBasePrice(toolSlug: string): number {
  return DEFAULT_BASE_PRICES[toolSlug] ?? 19;
}

export function mapDbPricing(row: Record<string, unknown>): ToolPricing {
  return {
    toolSlug: String(row.tool_slug),
    baseMonthlyUsd: Number(row.base_monthly_usd),
    monthlyPriceUsd: Number(row.monthly_price_usd),
    annualPriceUsd: Number(row.annual_price_usd),
    lifetimePriceUsd: Number(row.lifetime_price_usd),
    demandMultiplier: Number(row.demand_multiplier),
    stripeMonthlyPriceId: (row.stripe_monthly_price_id as string) ?? null,
    stripeAnnualPriceId: (row.stripe_annual_price_id as string) ?? null,
    stripeLifetimePriceId: (row.stripe_lifetime_price_id as string) ?? null,
  };
}

export const INTELLIGENCE_TOOL_SLUGS = INTELLIGENCE_TOOLS.map((t) => t.slug);
