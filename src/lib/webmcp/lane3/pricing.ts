import { getSector3ToolProfile } from "@/lib/billing/sector3-tool-pricing";
import { computeToolPricingFromProfile } from "@/lib/billing/tool-pricing";

export type ToolCallTier = "standard" | "agentic";

/**
 * The Agentic tier surcharge advertised in the WebMCP manifest (e.g. GrantBot
 * $39/mo standard -> $58.50/mo agentic, BridgeAI $29/mo -> $43.50/mo) is exactly
 * 1.5x the standard tier in both cases. Reuse that ratio here rather than invent
 * a new one.
 */
const AGENTIC_MULTIPLIER = 1.5;

/**
 * Real, market-adjusted monthly USD price for a Sector 3 tool, computed the same
 * way the in-app pricing catalog computes it (base price x demand multiplier via
 * `computeToolPricingFromProfile`). Falls back to the manifest's floor price only
 * if the tool has no catalog profile, which should not happen for a cataloged tool.
 */
export function getToolCallPriceUsd(toolSlug: string, tier: ToolCallTier, fallbackUsd: number): number {
  const profile = getSector3ToolProfile(toolSlug);
  const computed = profile ? computeToolPricingFromProfile(profile) : null;
  const base = computed?.monthlyPriceUsd ?? fallbackUsd;
  const price = tier === "agentic" ? base * AGENTIC_MULTIPLIER : base;
  return Math.round(price * 100) / 100;
}

export function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

export function normalizeTier(raw: unknown): ToolCallTier {
  return raw === "agentic" ? "agentic" : "standard";
}
