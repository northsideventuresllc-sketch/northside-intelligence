import "server-only";

import { generateText } from "ai";
import {
  findServiceRecommendations,
  formatRecommendationLine,
} from "@/lib/services/assistant/recommend";
import { extractServiceSearchIntent } from "@/lib/services/assistant/match-intent";
import type {
  ServiceAssistantMessage,
  ServiceAssistantResponse,
} from "@/lib/services/assistant/types";

const CHAT_MODEL = "anthropic/claude-haiku-4.5";

export async function runServiceAssistantChat(
  messages: ServiceAssistantMessage[]
): Promise<ServiceAssistantResponse> {
  const intent = await extractServiceSearchIntent(messages);
  const { recommendations, primaryQuery } = findServiceRecommendations(intent, 4);

  const serviceLines = recommendations.map((rec, i) => formatRecommendationLine(i, rec));

  const transcript = messages
    .slice(-10)
    .map((m) => `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content}`)
    .join("\n");

  const serviceBlock =
    serviceLines.length > 0
      ? serviceLines.join("\n")
      : "No matching services found right now.";

  try {
    const { text } = await generateText({
      model: CHAT_MODEL,
      system: `You are the Intelligence Services assistant for Northside Intelligence.
Help visitors find the right professional service from our catalog at /services.

Write a warm, concise reply (2-4 short paragraphs max):
- Acknowledge their goals and budget if mentioned
- Explain why the recommended services fit (refer by name)
- For individuals, emphasize affordable personal automation pricing
- For businesses, note enterprise scope and ROI
- If nothing matched well, ask clarifying questions about goals, audience (personal vs business), or budget
- Do NOT invent services not in the list
- Use Title Case for service names; keep tone helpful and conversational
- Do not use arrow suffixes on button text`,
      prompt: `Conversation:
${transcript}

Available service matches:
${serviceBlock}

Write your assistant reply only (no JSON, no numbered list duplication — service cards show separately).`,
      maxOutputTokens: 512,
    });

    return {
      message: text.trim(),
      recommendations,
      searchQuery: primaryQuery,
    };
  } catch (err) {
    console.error("[services/assistant/chat]", err);
    const message =
      recommendations.length > 0
        ? `Here are ${recommendations.length} Intelligence Services that may fit what you described. Tap a service to learn more and request a quote.`
        : "Tell me whether you're setting up automation for yourself or a business, what you want to accomplish, and your budget — I'll recommend the best fit.";
    return {
      message,
      recommendations,
      searchQuery: primaryQuery,
    };
  }
}
