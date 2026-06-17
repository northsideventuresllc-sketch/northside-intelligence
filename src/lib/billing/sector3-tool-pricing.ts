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
}

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
  },
  {
    toolSlug: "signaldesk",
    name: "SignalDesk",
    targetAudience: "Analysts, marketers, and operators monitoring market signals",
    marketTier: "growth",
    baseMonthlyUsd: 24,
    annualMonthsFactor: 10,
    lifetimeMonthsFactor: 21,
    demandSignal: "medium",
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
