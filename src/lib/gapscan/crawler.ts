import "server-only";

export interface CompetitorGapAudit {
  domain: string;
  url: string;
  coreOffering: string;
  identifiedGaps: string[];
  pricingWeaknesses: string[];
  userFrictionPoints: string[];
  unmetMarketDemand: string[];
  scanDepth: "surface" | "deep_dive";
}

/**
 * Simulates deep DOM & competitive inspection of competitor web funnels and pricing structures.
 */
export async function auditCompetitorGaps(params: {
  competitorUrl: string;
  nicheSector: string;
  scanDepth: "surface" | "deep_dive";
}): Promise<CompetitorGapAudit> {
  const { competitorUrl, nicheSector, scanDepth } = params;
  let domain = "competitor.com";
  try {
    domain = new URL(competitorUrl.startsWith("http") ? competitorUrl : `https://${competitorUrl}`).hostname;
  } catch {
    domain = competitorUrl;
  }

  // Base surface level scan
  const surfaceAudit: CompetitorGapAudit = {
    domain,
    url: competitorUrl,
    coreOffering: `${domain} provides standard cloud software for ${nicheSector}.`,
    identifiedGaps: [
      "Lack of programmatic API endpoints or local CLI automation.",
      "Generic prompt wrapper UX without workflow integration.",
      "High onboarding friction with mandatory sales demo walls.",
    ],
    pricingWeaknesses: [
      "No transparent pricing on public landing page ('Contact Sales' gate).",
      "Expensive annual lock-in contracts with no monthly flexibility.",
    ],
    userFrictionPoints: [
      "Slow time-to-first-value requiring account creation before seeing demo outputs.",
      "Overwhelming multi-step wizard instead of instant generation.",
    ],
    unmetMarketDemand: [
      "Indie founders and lean teams want self-service, BYOK pay-per-use tooling.",
      "Growing enterprise demand for local offline model execution.",
    ],
    scanDepth,
  };

  if (scanDepth === "deep_dive") {
    // SaaS / Agentic tier unlocks deep checkout & funnel reverse-engineering
    surfaceAudit.identifiedGaps.push(
      "Zero MCP (Model Context Protocol) support for Claude Code or Antigravity agents.",
      "Missing automated webhook dispatch on job completion.",
      "No exportable documentation or structured JSON schema outputs."
    );
    surfaceAudit.pricingWeaknesses.push(
      "Seat-based pricing model penalizing automated subagents and team scale.",
      "Artificial usage limits on basic tier with aggressive overage penalties."
    );
    surfaceAudit.userFrictionPoints.push(
      "Complex OAuth permissions requiring full workspace administrative access.",
      "Export restricted to PDF/CSV without raw JSON or webhook pipelines."
    );
  }

  return surfaceAudit;
}
