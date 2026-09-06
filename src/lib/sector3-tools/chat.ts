import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";
import type { Sector3ToolSlug } from "@/lib/sector3-registry";
import { buildSector3ChatSystemPrompt } from "@/lib/sector3-tools/chat-content";

export interface Sector3ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Sector3ChatContext {
  inputs?: Record<string, string>;
  result?: string;
  extra?: Record<string, unknown>;
}

export async function runSector3ToolChat(
  slug: Sector3ToolSlug,
  messages: Sector3ChatMessage[],
  context: Sector3ChatContext
): Promise<string> {
  const system = buildSector3ChatSystemPrompt(slug, context);

  const conversation = messages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
    .join("\n\n");

  try {
    const { text } = await generateTextGeminiFirst({
      system,
      prompt: conversation,
      maxOutputTokens: 800,
    });
    return text.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    if (/unauthorized|401|authentication|api key/i.test(message)) {
      throw new Error(
        "Text generation is unavailable right now. Nothing is broken — please try again shortly."
      );
    }
    throw new Error(message);
  }
}
