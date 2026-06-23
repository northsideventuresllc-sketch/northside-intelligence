/**
 * Sector 3 intelligence tool subscription catalog.
 * Prices reflect market value and target audience; synced to ni_tool_pricing via setup scripts.
 */

export type MarketTier = "entry" | "growth" | "premium" | "enterprise-adjacent";

export interface Sector3ToolPricingProfile {
  toolSlug: string;
  name: string;
  targetAudience: string;
  marketTier: MarketTier;
  /** Base monthly subscription before demand multiplier. */
  baseMonthlyUsd: number;
  /** Annual = monthly × this factor (typically 10 months of monthly). */
  annualMonthsFactor: number;
  /** Lifetime ≈ monthly × this factor × demand multiplier. */
  lifetimeMonthsFactor: number;
  demandSignal: "high" | "medium" | "low";
  /** Free tier monthly usage cap (pro deployment). */
  freeTierMonthlyCap: number;
  /** Unit label for free tier usage (e.g. replies, grants, uses). */
  freeTierUnit: string;
}

export interface Sector3FreeTierSpec {
  monthlyCap: number;
  unit: string;
  summary: string;
  features: string[];
}

const DEFAULT_FREE_TIER_FEATURES = [
  "Add to your NI Toolkit",
  "Core AI features included",
  "Upgrade anytime for unlimited access",
] as const;

export const SECTOR3_TOOL_PRICING_CATALOG: Sector3ToolPricingProfile[] = [
  {
    toolSlug: "replyflow",
    name: "ReplyFlow",
    targetAudience: "SMBs, creators, and support teams automating customer replies",
    marketTier: "entry",
    baseMonthlyUsd: 15,
    annualMonthsFactor: 10,
    lifetimeMonthsFactor: 21,
    demandSignal: "medium",
    freeTierMonthlyCap: 10,
    freeTierUnit: "replies",
  },
  {
    toolSlug: "grantbot",
    name: "GrantBot",
    targetAudience: "Nonprofits, researchers, and grant writers pursuing funding",
    marketTier: "premium",
    baseMonthlyUsd: 39,
    annualMonthsFactor: 10,
    lifetimeMonthsFactor: 21,
    demandSignal: "medium",
    freeTierMonthlyCap: 5,
    freeTierUnit: "grants",
  },
  {
    toolSlug: "signaldesk",
    name: "Signal Desk",
    targetAudience: "Analysts, marketers, and operators monitoring market signals",
    marketTier: "growth",
    baseMonthlyUsd: 24,
    annualMonthsFactor: 10,
    lifetimeMonthsFactor: 21,
    demandSignal: "medium",
    freeTierMonthlyCap: 10,
    freeTierUnit: "signals",
  },
  {
    toolSlug: "gapscan",
    name: "GapScan",
    targetAudience: "Product teams and founders identifying market and feature gaps",
    marketTier: "entry",
    baseMonthlyUsd: 18,
    annualMonthsFactor: 10,
    lifetimeMonthsFactor: 21,
    demandSignal: "medium",
    freeTierMonthlyCap: 10,
    freeTierUnit: "scans",
  },
  {
    toolSlug: "bridgeai",
    name: "BridgeAI",
    targetAudience: "Ops and engineering teams bridging workflows with AI orchestration",
    marketTier: "growth",
    baseMonthlyUsd: 29,
    annualMonthsFactor: 10,
    lifetimeMonthsFactor: 21,
    demandSignal: "high",
    freeTierMonthlyCap: 10,
    freeTierUnit: "workflows",
  },
];

const catalogBySlug = new Map(
  SECTOR3_TOOL_PRICING_CATALOG.map((profile) => [profile.toolSlug, profile])
);

export function getSector3ToolProfile(toolSlug: string): Sector3ToolPricingProfile | undefined {
  return catalogBySlug.get(toolSlug);
}

export function getAllSector3ToolProfiles(): Sector3ToolPricingProfile[] {
  return SECTOR3_TOOL_PRICING_CATALOG;
}

export function getSector3FreeTierSpec(toolSlug: string): Sector3FreeTierSpec {
  const profile = getSector3ToolProfile(toolSlug);
  const monthlyCap = profile?.freeTierMonthlyCap ?? 10;
  const unit = profile?.freeTierUnit ?? "uses";
  const summary = `${monthlyCap} ${unit}/month`;

  return {
    monthlyCap,
    unit,
    summary,
    features: [...DEFAULT_FREE_TIER_FEATURES],
  };
}

export function formatFreeTierCapLabel(toolSlug: string): string {
  const { monthlyCap, unit } = getSector3FreeTierSpec(toolSlug);
  return `${monthlyCap} ${unit}/mo`;
}

export function formatFreeTierHeroLabel(toolSlug: string): string {
  const { monthlyCap, unit } = getSector3FreeTierSpec(toolSlug);
  const unitTitle = unit.charAt(0).toUpperCase() + unit.slice(1);
  return `${monthlyCap} ${unitTitle}/Mo`;
}
