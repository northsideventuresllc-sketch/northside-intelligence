import "server-only";

import { generateText } from "ai";
import { isStoreCategoryId } from "@/lib/store/categories";
import type { StoreAssistantMessage, StoreAssistantSearchIntent } from "@/lib/store/assistant/types";

const INTENT_MODEL = "anthropic/claude-haiku-4.5";

function parseIntentJson(raw: string): StoreAssistantSearchIntent | null {
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

    const categoryRaw = parsed.category != null ? String(parsed.category).trim() : "";
    const category = categoryRaw && isStoreCategoryId(categoryRaw) ? categoryRaw : undefined;

    const maxBudgetUsd = Number(parsed.maxBudgetUsd ?? parsed.max_budget_usd);
    const minBudgetUsd = Number(parsed.minBudgetUsd ?? parsed.min_budget_usd);

    return {
      searchTerms,
      category,
      maxRetailCents:
        Number.isFinite(maxBudgetUsd) && maxBudgetUsd > 0
          ? Math.round(maxBudgetUsd * 100)
          : undefined,
      minRetailCents:
        Number.isFinite(minBudgetUsd) && minBudgetUsd > 0
          ? Math.round(minBudgetUsd * 100)
          : undefined,
    };
  } catch {
    return null;
  }
}

function fallbackIntentFromMessage(message: string): StoreAssistantSearchIntent {
  const cleaned = message
    .replace(/[^\w\s$.-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { searchTerms: cleaned ? [cleaned] : ["trending"] };
}

export async function extractSearchIntent(
  messages: StoreAssistantMessage[]
): Promise<StoreAssistantSearchIntent> {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUser?.content.trim()) {
    return { searchTerms: ["trending"] };
  }

  const transcript = messages
    .slice(-8)
    .map((m) => `${m.role === "user" ? "Shopper" : "Assistant"}: ${m.content}`)
    .join("\n");

  try {
    const { text } = await generateText({
      model: INTENT_MODEL,
      system: `You extract Smart Store product search intent from a shopping conversation.
Return ONLY valid JSON with this shape:
{"searchTerms":["primary query","optional alt"],"category":"kitchen|tech|home|pets|health|beauty|fitness|auto|entertainment|smart-home|general","maxBudgetUsd":number|null,"minBudgetUsd":number|null}

Rules:
- searchTerms: 1-3 short product search phrases CJ Dropshipping would understand
- category: only when clearly implied; omit or null otherwise
- budgets in USD when the shopper mentions price limits
- focus on the latest shopper need`,
      prompt: transcript,
      maxOutputTokens: 256,
    });

    const parsed = parseIntentJson(text);
    if (parsed && parsed.searchTerms.length > 0) return parsed;
  } catch (err) {
    console.warn("[store/assistant/intent]", err);
  }

  return fallbackIntentFromMessage(lastUser.content);
}
