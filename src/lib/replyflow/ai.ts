import { generateTextGeminiFirst } from "@/lib/ai/gemini-first";

export async function generateReply(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const { text } = await generateTextGeminiFirst({
      system: systemPrompt,
      prompt: userMessage,
      maxOutputTokens: 1024,
    });
    return text.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    if (/unauthorized|401|authentication|api key/i.test(message)) {
      throw new Error(
        "Text generation is unavailable right now. Nothing is broken — please try again shortly."
      );
    }
    throw new Error(message);
  }
}
