import { generateSignalDeskBrief } from "@/lib/sector3-tools/ai";
import { computeToolPricingFromProfile } from "@/lib/billing/tool-pricing";
import { getSector3ToolProfile } from "@/lib/billing/sector3-tool-pricing";
import { createWebmcpCheckout } from "../checkout";
import type { FulfilHandler, ToolHandler } from "../types";

const MAX_SIGNALS_LEN = 6000;

/**
 * Signal Desk — single-purchase prioritized market signal brief for an industry vertical.
 * The web app (`/api/signaldesk/generate`) takes a `rawSignals` block a logged-in user pastes
 * in (headlines, metrics, etc). Webmcp callers have no session and the manifest only asks for
 * `industry_vertical`, so an optional `signals`/`raw_signals` string is accepted for a caller
 * that already has source text; otherwise we seed the same generator with a request to brief
 * the named vertical from its own knowledge. This tool does not fetch live sources — there is
 * no signal-fetching lib in this repo to reuse, and the manifest's "Agentic Tier with SERP/HN/
 * ProductHunt MCPs" is not implemented anywhere; see the report for this gap.
 * Only a one-time single brief is sold here (guest Stripe Checkout via createWebmcpCheckout),
 * not the manifest's recurring "standard"/"agentic" plans or its unused `payment_token` field.
 */
export const handler: ToolHandler = async (tool, params) => {
  const vertical = typeof params.industry_vertical === "string" ? params.industry_vertical.trim() : "";
  if (!vertical) {
    return { status: "invalid_input", message: "industry_vertical is required — the industry or market sector to brief (e.g. \"fintech\", \"climate tech\")." };
  }

  const rawSignalsInput =
    (typeof params.signals === "string" && params.signals.trim()) ||
    (typeof params.raw_signals === "string" && params.raw_signals.trim()) ||
    "";
  if (rawSignalsInput.length > MAX_SIGNALS_LEN) {
    return { status: "invalid_input", message: `signals is too long (max ${MAX_SIGNALS_LEN} characters).` };
  }

  const profile = getSector3ToolProfile("signaldesk");
  const pricing = computeToolPricingFromProfile(profile);
  if (!profile || !pricing) {
    return { status: "unavailable", message: "Signal Desk pricing is not configured." };
  }

  const requestedTier = typeof params.tier === "string" ? params.tier.trim() : "";
  const tierNote =
    requestedTier && requestedTier !== "single"
      ? ` Only a one-time single brief (no recurring "${requestedTier}" plan, no live source fetching) is available through this agent checkout.`
      : "";

  const result = await createWebmcpCheckout({
    tool: tool.name,
    productName: `Signal Desk — Brief (${vertical})`,
    mode: "payment",
    amountCents: Math.round(pricing.monthlyPriceUsd * 100),
    params: { industry_vertical: vertical, signals: rawSignalsInput },
  });

  if (result.status === "awaiting_payment" && tierNote) {
    return { ...result, message: `${result.message}${tierNote}` };
  }
  return result;
};

export const fulfil: FulfilHandler = async (_order, params) => {
  const vertical = typeof params.industry_vertical === "string" ? params.industry_vertical : "";
  const suppliedSignals = typeof params.signals === "string" ? params.signals.trim() : "";

  const rawSignals =
    suppliedSignals ||
    [
      `Industry / market vertical: ${vertical}`,
      "",
      "No source signals were supplied by the caller. Using your own knowledge, identify the most",
      "important current market, product, funding, and competitive signals for this vertical, and",
      "brief them as if they were just gathered from recent headlines and data.",
    ].join("\n");

  const report = await generateSignalDeskBrief(rawSignals, vertical || "General");
  return {
    tool: "Signal Desk",
    industry_vertical: vertical,
    used_supplied_signals: Boolean(suppliedSignals),
    report,
  };
};
