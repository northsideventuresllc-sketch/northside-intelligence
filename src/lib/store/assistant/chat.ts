import "server-only";

import { generateText } from "ai";
import { formatRetailPriceRange } from "@/lib/store/catalog/format-price";
import { findAssistantRecommendations } from "@/lib/store/assistant/recommend";
import { extractSearchIntent } from "@/lib/store/assistant/search-intent";
import type {
  StoreAssistantMessage,
  StoreAssistantResponse,
} from "@/lib/store/assistant/types";
import { SMART_STORE_NAME } from "@/lib/store/branding";

const CHAT_MODEL = "anthropic/claude-haiku-4.5";

function formatProductLine(
  index: number,
  name: string,
  priceLabel: string,
  category: string
): string {
  return `${index + 1}. ${name} — ${priceLabel} (${category})`;
}

export async function runStoreAssistantChat(
  messages: StoreAssistantMessage[]
): Promise<StoreAssistantResponse> {
  const intent = await extractSearchIntent(messages);
  const { products, primaryQuery } = await findAssistantRecommendations(intent, 6);

  const productLines = products.map((p, i) =>
    formatProductLine(
      i,
      p.name,
      formatRetailPriceRange(
        p.retailPriceCents,
        p.retailPriceMinCents,
        p.retailPriceMaxCents,
        p.currency
      ),
      p.category
    )
  );

  const transcript = messages
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Shopper" : "Assistant"}: ${m.content}`)
    .join("\n");

  const productBlock =
    productLines.length > 0
      ? productLines.join("\n")
      : "No matching products found in catalog right now.";

  try {
    const { text } = await generateText({
      model: CHAT_MODEL,
      system: `You are the ${SMART_STORE_NAME} shopping assistant for Northside Intelligence.
Help shoppers find products from our CJ Dropshipping catalog. NI retail price = supplier listing + 10%.

Write a warm, concise reply (2-4 short paragraphs max):
- Acknowledge what they need
- Briefly explain why the picks fit (refer to items by name)
- If nothing matched, suggest refining budget, category, or keywords
- Do NOT invent products not in the list
- Do NOT mention supplier costs or CJ internal names
- Use Title Case sparingly; keep tone helpful and conversational
- Do not use arrow suffixes`,
      prompt: `Conversation:
${transcript}

Available picks:
${productBlock}

Write your assistant reply only (no JSON, no numbered list duplication — product cards show separately).`,
      maxOutputTokens: 512,
    });

    return {
      message: text.trim(),
      recommendations: products,
      searchQuery: primaryQuery,
    };
  } catch (err) {
    console.error("[store/assistant/chat]", err);
    const message =
      products.length > 0
        ? `Here are ${products.length} picks from ${SMART_STORE_NAME} that may fit what you described. Tap a product to view details and add it to your cart.`
        : "I couldn't find a strong match yet. Try describing the item, who it's for, or a budget range and I'll search again.";
    return {
      message,
      recommendations: products,
      searchQuery: primaryQuery,
    };
  }
}
