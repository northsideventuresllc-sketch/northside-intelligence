import { generateBridgeAIPlan } from "@/lib/sector3-tools/ai";
import { createWebmcpCheckout } from "../checkout";
import { getToolCallPriceUsd, normalizeTier, usdToCents } from "../lane3/pricing";
import type { FulfilHandler, ToolHandler } from "../types";

const TOOL_SLUG = "bridgeai";
const TARGET_SYSTEM = "AI agent endpoint";

export const handler: ToolHandler = async (tool, params) => {
  const workflowType = typeof params.workflow_type === "string" ? params.workflow_type.trim() : "";
  if (!workflowType) {
    return { status: "invalid_input", message: "workflow_type is required (the legacy workflow to bridge)." };
  }

  const tier = normalizeTier(params.tier);
  const priceUsd = getToolCallPriceUsd(TOOL_SLUG, tier, tool.floor_price_usd);
  const tierLabel = tier === "agentic" ? "Agentic" : "Standard";

  return createWebmcpCheckout({
    tool: tool.name,
    mode: "payment",
    amountCents: usdToCents(priceUsd),
    productName: `BridgeAI ${tierLabel} workflow bridge — ${workflowType}`,
    params: { workflow_type: workflowType, tier },
  });
};

export const fulfil: FulfilHandler = async (_order, params) => {
  const workflowType = typeof params.workflow_type === "string" ? params.workflow_type : "";
  const tier = normalizeTier(params.tier);
  const goal = `Bridge the existing "${workflowType}" workflow to an AI agent endpoint without a code rebuild.`;

  const plan = await generateBridgeAIPlan(workflowType, TARGET_SYSTEM, goal);

  return {
    workflow_type: workflowType,
    tier,
    plan,
  };
};
