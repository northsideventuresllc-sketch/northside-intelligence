import { searchGrantListings } from "@/lib/grantbot/ai";
import { createWebmcpCheckout } from "../checkout";
import { buildGrantOrgDescription, disciplineToCategory } from "../lane3/grant-category";
import { getToolCallPriceUsd, normalizeTier, usdToCents } from "../lane3/pricing";
import type { FulfilHandler, ToolHandler } from "../types";

const TOOL_SLUG = "grantbot";

export const handler: ToolHandler = async (tool, params) => {
  const discipline = typeof params.discipline === "string" ? params.discipline.trim() : "";
  if (!discipline) {
    return { status: "invalid_input", message: "discipline is required (e.g. music, tech, community)." };
  }

  const tier = normalizeTier(params.tier);
  const priceUsd = getToolCallPriceUsd(TOOL_SLUG, tier, tool.floor_price_usd);
  const tierLabel = tier === "agentic" ? "Agentic" : "Standard";

  return createWebmcpCheckout({
    tool: tool.name,
    mode: "payment",
    amountCents: usdToCents(priceUsd),
    productName: `GrantBot ${tierLabel} grant search — ${discipline}`,
    params: { discipline, tier },
  });
};

export const fulfil: FulfilHandler = async (_order, params) => {
  const discipline = typeof params.discipline === "string" ? params.discipline : "";
  const tier = normalizeTier(params.tier);
  const category = disciplineToCategory(discipline);
  const orgDescription = buildGrantOrgDescription(discipline);

  const grants = await searchGrantListings(category, orgDescription);

  return {
    discipline,
    tier,
    category,
    grants,
    count: grants.length,
    message:
      grants.length > 0
        ? "Real grant listings matched to this discipline via GrantBot."
        : "GrantBot found no matching open grants for this discipline right now.",
  };
};
