import "server-only";

import {
  INTELLIGENCE_SERVICES,
  formatPriceTier,
  getServicePriceLines,
  type ServiceOffering,
} from "@/lib/services/offerings";
import type {
  ServiceAssistantRecommendation,
  ServiceAssistantSearchIntent,
} from "@/lib/services/assistant/types";

const SERVICE_KEYWORDS: Record<string, string[]> = {
  "tailored-intelligence-server": [
    "custom",
    "server",
    "build",
    "bespoke",
    "infrastructure",
    "deploy",
    "setup",
    "automation",
    "workflow",
    "integrate",
    "personal",
    "home",
  ],
  "intelligence-audit": [
    "audit",
    "gap",
    "assessment",
    "review",
    "roadmap",
    "evaluate",
    "analysis",
    "where to start",
    "before building",
  ],
  "personal-intelligence-setup": [
    "personal",
    "productivity",
    "individual",
    "myself",
    "home office",
    "daily",
    "tools",
    "stack",
    "configure",
  ],
  "ai-research-assistant": [
    "research",
    "assistant",
    "sources",
    "citations",
    "insights",
    "study",
    "learning",
    "investigate",
  ],
  "personal-knowledge-base": [
    "notes",
    "knowledge",
    "knowledge base",
    "second brain",
    "organize",
    "search",
    "retrieval",
    "notion",
    "obsidian",
  ],
  "executive-briefing-intelligence": [
    "briefing",
    "news",
    "digest",
    "daily",
    "weekly",
    "markets",
    "executive",
    "staying informed",
    "newsletter",
  ],
  "enterprise-ai-strategy": [
    "strategy",
    "enterprise",
    "adoption",
    "roadmap",
    "roi",
    "board",
    "leadership",
    "organization",
    "company-wide",
  ],
  "workflow-integration": [
    "integration",
    "automate",
    "automation",
    "connect",
    "pipeline",
    "handoff",
    "zapier",
    "api",
    "operations",
  ],
  "ai-governance-compliance": [
    "governance",
    "compliance",
    "policy",
    "regulation",
    "risk",
    "legal",
    "eu ai act",
    "audit trail",
  ],
  "team-intelligence-training": [
    "training",
    "onboarding",
    "team",
    "workshop",
    "adoption",
    "teach",
    "employees",
    "cohort",
  ],
  "custom-web-design-management": [
    "website",
    "web design",
    "web site",
    "portfolio",
    "landing page",
    "cms",
    "hosting",
    "maintenance",
    "redesign",
    "wordpress",
    "web presence",
    "site management",
  ],
};

function parsePriceRangeUsd(amount: string): { min: number; max: number } | null {
  const numbers: number[] = [];
  const pattern = /\$([\d,]+(?:\.\d+)?)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(amount)) !== null) {
    numbers.push(Number(match[1].replace(/,/g, "")));
  }
  if (numbers.length === 0) return null;
  if (numbers.length === 1) return { min: numbers[0], max: numbers[0] };
  return { min: Math.min(...numbers), max: Math.max(...numbers) };
}

function servicePriceLabel(service: ServiceOffering, preferIndividual: boolean): string {
  const lines = getServicePriceLines(service.pricing, service.audience);
  if (lines.length === 0) return "Contact for pricing";

  if (preferIndividual) {
    const individual = lines.find((l) => l.label === "Individual" || l.label === "Price");
    if (individual) return individual.price;
  }

  const business = lines.find((l) => l.label === "Business");
  if (business) return business.price;

  return lines[0].price;
}

function servicePriceNote(service: ServiceOffering, preferIndividual: boolean): string | undefined {
  const tier = preferIndividual
    ? service.pricing.individual ?? service.pricing.business
    : service.pricing.business ?? service.pricing.individual;
  return tier?.note;
}

function scoreService(
  service: ServiceOffering,
  intent: ServiceAssistantSearchIntent,
  queryText: string
): number {
  let score = 0;
  const keywords = SERVICE_KEYWORDS[service.slug] ?? [];
  const haystack = `${queryText} ${intent.goals?.join(" ") ?? ""}`.toLowerCase();

  for (const keyword of keywords) {
    if (haystack.includes(keyword)) score += keyword.includes(" ") ? 4 : 2;
  }

  for (const term of intent.searchTerms) {
    const t = term.toLowerCase();
    if (service.name.toLowerCase().includes(t)) score += 5;
    if (service.description.toLowerCase().includes(t)) score += 3;
    for (const highlight of service.highlights) {
      if (highlight.toLowerCase().includes(t)) score += 2;
    }
  }

  const preferIndividual = intent.audience === "individual";
  const preferBusiness = intent.audience === "business";

  if (preferIndividual) {
    if (service.audience === "individual") score += 6;
    if (service.audience === "both") score += 3;
    if (service.audience === "business") score -= 4;
  }

  if (preferBusiness) {
    if (service.audience === "business") score += 6;
    if (service.audience === "both") score += 3;
    if (service.audience === "individual") score -= 4;
  }

  if (intent.maxBudgetUsd != null) {
    const tier = preferIndividual
      ? service.pricing.individual ?? service.pricing.business
      : service.pricing.business ?? service.pricing.individual;
    if (tier) {
      const range = parsePriceRangeUsd(tier.amount);
      if (range && range.min > intent.maxBudgetUsd) score -= 8;
      if (range && range.max <= intent.maxBudgetUsd) score += 4;
    }
  }

  if (service.status !== "LIVE") score -= 20;

  return score;
}

function toRecommendation(
  service: ServiceOffering,
  preferIndividual: boolean
): ServiceAssistantRecommendation {
  return {
    slug: service.slug,
    name: service.name,
    description: service.description,
    audience: service.audience,
    priceLabel: servicePriceLabel(service, preferIndividual),
    priceNote: servicePriceNote(service, preferIndividual),
  };
}

export function findServiceRecommendations(
  intent: ServiceAssistantSearchIntent,
  limit = 4
): { recommendations: ServiceAssistantRecommendation[]; primaryQuery: string } {
  const primaryQuery = intent.searchTerms[0]?.trim() || "automation";
  const queryText = intent.searchTerms.join(" ");
  const preferIndividual = intent.audience !== "business";

  const ranked = INTELLIGENCE_SERVICES.map((service) => ({
    service,
    score: scoreService(service, intent, queryText),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const top = ranked.length > 0 ? ranked : INTELLIGENCE_SERVICES.map((service) => ({
    service,
    score: 1,
  }));

  const recommendations = top
    .slice(0, limit)
    .map(({ service }) => toRecommendation(service, preferIndividual));

  return { recommendations, primaryQuery };
}

export function formatRecommendationLine(
  index: number,
  rec: ServiceAssistantRecommendation
): string {
  const audience =
    rec.audience === "both"
      ? "Individuals & Business"
      : rec.audience === "individual"
        ? "Individuals"
        : "Business";
  return `${index + 1}. ${rec.name} — ${rec.priceLabel} (${audience})`;
}

export { formatPriceTier };
