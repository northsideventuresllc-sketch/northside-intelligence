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

export interface Sector3DefaultMcp {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export const SECTOR3_DEFAULT_MCPS: Record<string, Sector3DefaultMcp[]> = {
  replyflow: [
    { id: "mcp-gmail", name: "Gmail MCP", description: "Ingest customer emails & draft 1-click replies", icon: "✉️" },
    { id: "mcp-zendesk", name: "Zendesk MCP", description: "Sync tickets and resolve inquiries autonomously", icon: "🎧" },
    { id: "mcp-slack", name: "Slack MCP", description: "Monitor support channels and answer customer leads", icon: "💬" },
  ],
  grantbot: [
    { id: "mcp-grants-gov", name: "Grants.gov MCP", description: "Live federal & foundation grant RFP search", icon: "🏛️" },
    { id: "mcp-doc-parser", name: "Doc Parser MCP", description: "Extract guidelines, criteria, and budget sheets", icon: "📄" },
    { id: "mcp-google-docs", name: "Google Docs MCP", description: "Export formatted grant proposals directly to docs", icon: "📝" },
  ],
  signaldesk: [
    { id: "mcp-serp-search", name: "SERP Search MCP", description: "Autonomous competitor and market move scanner", icon: "🔍" },
    { id: "mcp-hn-ph", name: "HN / ProductHunt MCP", description: "Track launch sentiment and developer trend shifts", icon: "🚀" },
    { id: "mcp-github-trends", name: "GitHub Trends MCP", description: "Monitor open-source velocity and repository shifts", icon: "⭐" },
  ],
  gapscan: [
    { id: "mcp-lighthouse", name: "Lighthouse MCP", description: "Deep performance, SEO, and conversion friction audits", icon: "⚡" },
    { id: "mcp-site-crawler", name: "Site Crawler MCP", description: "Map entire user funnels and identify drop-off gaps", icon: "🕷️" },
    { id: "mcp-dom-inspector", name: "DOM Inspector MCP", description: "Detect layout shifts, form failures, and broken UX", icon: "🔬" },
  ],
  bridgeai: [
    { id: "mcp-multi-llm", name: "Multi-LLM Router MCP", description: "Dynamic dispatch between Claude, Gemini, and AXON", icon: "🧠" },
    { id: "mcp-zapier-bridge", name: "Zapier Bridge MCP", description: "Trigger 5,000+ app webhooks and automated workflows", icon: "⚡" },
    { id: "mcp-supabase-db", name: "Supabase DB MCP", description: "Idempotent database sync and data pipeline updates", icon: "💾" },
  ],
};

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
    marketTier: "premium",
    baseMonthlyUsd: 149,
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
    freeTierMonthlyCap: 10,
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

export interface Sector3AgenticPricing {
  standardMonthlyUsd: number;
  agenticMonthlyUsd: number;
  mcps: Sector3DefaultMcp[];
}

export function getSector3AgenticPricing(toolSlug: string): Sector3AgenticPricing {
  const profile = getSector3ToolProfile(toolSlug);
  const base = profile?.baseMonthlyUsd ?? 20;
  return {
    standardMonthlyUsd: base,
    agenticMonthlyUsd: Math.round(base * 2.5),
    mcps: SECTOR3_DEFAULT_MCPS[toolSlug] ?? [],
  };
}
