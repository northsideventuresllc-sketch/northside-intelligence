import { generateText } from "ai";

const GRANTBOT_MODEL = "anthropic/claude-haiku-4.5";

export async function generateGrantBotText(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  try {
    const { text } = await generateText({
      model: GRANTBOT_MODEL,
      system: systemPrompt,
      prompt: userMessage,
      maxOutputTokens: 2048,
    });
    return text.trim();
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    if (/unauthorized|401|authentication|api key/i.test(message)) {
      throw new Error(
        "AI service is not configured. Enable AI Gateway on the Vercel project or set ANTHROPIC_API_KEY / AI_GATEWAY_API_KEY."
      );
    }
    throw new Error(message);
  }
}
