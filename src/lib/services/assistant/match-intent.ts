import "server-only";

import { generateText } from "ai";
import type {
  ServiceAssistantMessage,
  ServiceAssistantSearchIntent,
} from "@/lib/services/assistant/types";

const INTENT_MODEL = "anthropic/claude-haiku-4.5";

function parseIntentJson(raw: string): ServiceAssistantSearchIntent | null {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
    const termsRaw = parsed.searchTerms ?? parsed.search_terms ?? parsed.queries;
    const searchTerms = Array.isArray(termsRaw)
      ? termsRaw.map(String).map((t) => t.trim()).filter(Boolean)
      : typeof termsRaw === "string" && termsRaw.trim()
        ? [termsRaw.trim()]
        : [];

    const audienceRaw = String(parsed.audience ?? parsed.accountType ?? "").toLowerCase();
    const audience =
      audienceRaw === "individual" || audienceRaw === "personal"
        ? "individual"
        : audienceRaw === "business" || audienceRaw === "enterprise"
          ? "business"
          : audienceRaw === "any"
            ? "any"
            : undefined;

    const maxBudgetUsd = Number(parsed.maxBudgetUsd ?? parsed.max_budget_usd);
    const minBudgetUsd = Number(parsed.minBudgetUsd ?? parsed.min_budget_usd);

    const goalsRaw = parsed.goals ?? parsed.needs;
    const goals = Array.isArray(goalsRaw)
      ? goalsRaw.map(String).map((g) => g.trim()).filter(Boolean)
      : [];

    return {
      searchTerms,
      audience,
      maxBudgetUsd:
        Number.isFinite(maxBudgetUsd) && maxBudgetUsd > 0 ? maxBudgetUsd : undefined,
      minBudgetUsd:
        Number.isFinite(minBudgetUsd) && minBudgetUsd > 0 ? minBudgetUsd : undefined,
      goals,
    };
  } catch {
    return null;
  }
}

function fallbackIntentFromMessage(message: string): ServiceAssistantSearchIntent {
  const cleaned = message
    .replace(/[^\w\s$.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const lower = cleaned.toLowerCase();
  let audience: ServiceAssistantSearchIntent["audience"];
  if (/\b(personal|individual|myself|home|family)\b/.test(lower)) {
    audience = "individual";
  } else if (/\b(business|company|team|enterprise|org)\b/.test(lower)) {
    audience = "business";
  }

  return { searchTerms: cleaned ? [cleaned] : ["automation"], audience };
}

export async function extractServiceSearchIntent(
  messages: ServiceAssistantMessage[]
): Promise<ServiceAssistantSearchIntent> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content.trim()) {
    return { searchTerms: ["automation"] };
  }

  const transcript = messages
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: INTENT_MODEL,
      system: `You extract Intelligence Services search intent from a conversation on northsideintelligence.com/services.
Return ONLY valid JSON with this shape:
{"searchTerms":["primary need","optional alt"],"audience":"individual"|"business"|"any"|null,"maxBudgetUsd":number|null,"minBudgetUsd":number|null,"goals":["short goal phrases"]}

Rules:
- searchTerms: 1-3 phrases describing workflows, automation, research, AI strategy, etc.
- audience: individual for personal/home use; business for teams/companies; any when unclear
- budgets in USD when mentioned (e.g. "under $500" -> maxBudgetUsd 500)
- goals: optional list of what they want to accomplish
- focus on the latest visitor need`,
      prompt: transcript,
      maxOutputTokens: 256,
    });

    const parsed = parseIntentJson(text);
    if (parsed && parsed.searchTerms.length > 0) return parsed;
  } catch (err) {
    console.warn("[services/assistant/intent]", err);
  }

  return fallbackIntentFromMessage(lastUser.content);
}
