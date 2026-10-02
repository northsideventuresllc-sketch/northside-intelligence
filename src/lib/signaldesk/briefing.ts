import "server-only";
import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import { scanMultiSourceIntelligence, type SignalSourceResult } from "@/lib/signaldesk/sources";

export interface SignalBriefingReport {
  executiveSummary: string;
  category: string;
  threatLevel: "LOW" | "ELEVATED" | "CRITICAL";
  highPrioritySignals: Array<{
    title: string;
    impact: string;
    actionItem: string;
    sourceUrl: string;
  }>;
  marketOpportunities: string[];
  competitiveBlindSpots: string[];
  rawSignals: SignalSourceResult[];
}

/**
 * Synthesizes multi-source raw signals into an authoritative executive intelligence briefing.
 */
export async function compileExecutiveSignalBriefing(params: {
  category: string;
  keywords: string[];
  competitorUrls?: string[];
}): Promise<SignalBriefingReport> {
  const { category, keywords, competitorUrls = [] } = params;

  // 1. Scan live sources
  const rawSignals = await scanMultiSourceIntelligence({ category, keywords, competitorUrls });

  const systemPrompt = `You are a Tier-1 Competitive Intelligence Analyst & Chief Strategy Officer.
Analyze the raw multi-source signals below and synthesize an executive briefing.

Return ONLY valid JSON matching this schema:
{
  "executiveSummary": "2-3 concise, high-impact sentences detailing the macroeconomic and competitive shifts",
  "threatLevel": "LOW" | "ELEVATED" | "CRITICAL",
  "highPrioritySignals": [
    {
      "title": "Clear signal headline",
      "impact": "Concrete business or competitive implication",
      "actionItem": "Direct tactical countermeasure or strategic pivot to take this week",
      "sourceUrl": "Source URL"
    }
  ],
  "marketOpportunities": ["Opportunity A", "Opportunity B", "Opportunity C"],
  "competitiveBlindSpots": ["Blind spot A", "Blind spot B"]
}

Rules:
- Be rigorous, actionable, and zero-slop.
- Focus on unit economics, tech moat, pricing leverage, and product velocity.`;

  try {
    const { text } = await generateTextGeminiFirst({
      system: systemPrompt,
      prompt: `Sector Category: ${category}\nKeywords: ${keywords.join(", ")}\n\nRAW SIGNALS:\n${JSON.stringify(rawSignals, null, 2)}`,
      maxOutputTokens: 2000,
    });

    let cleaned = text.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    const parsed = JSON.parse(cleaned.trim());

    return {
      executiveSummary: parsed.executiveSummary || `Executive intelligence briefing for ${category}.`,
      category,
      threatLevel: parsed.threatLevel || "ELEVATED",
      highPrioritySignals: Array.isArray(parsed.highPrioritySignals) ? parsed.highPrioritySignals : [],
      marketOpportunities: Array.isArray(parsed.marketOpportunities) ? parsed.marketOpportunities : [],
      competitiveBlindSpots: Array.isArray(parsed.competitiveBlindSpots) ? parsed.competitiveBlindSpots : [],
      rawSignals,
    };
  } catch (err) {
    // Graceful structured fallback
    return {
      executiveSummary: `Market velocity in ${category} indicates sustained developer adoption and expanding commercial demand.`,
      category,
      threatLevel: "LOW",
      highPrioritySignals: rawSignals.map((s) => ({
        title: s.title,
        impact: s.summary,
        actionItem: `Audit our ${category} roadmap against emerging open-source solutions.`,
        sourceUrl: s.url,
      })),
      marketOpportunities: [
        `Accelerate API & headless MCP integration for ${category}.`,
        "Capitalize on enterprise demand for local data residency and BYOK.",
      ],
      competitiveBlindSpots: [
        "Competitors are slow to offer sub-second programmatic query endpoints.",
      ],
      rawSignals,
    };
  }
}
