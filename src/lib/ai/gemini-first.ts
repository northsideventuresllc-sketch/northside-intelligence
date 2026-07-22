import "server-only";

import { generateText } from "ai";
import { resolvePlatformSecret } from "@/lib/platform-secrets";

const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * Resolve GEMINI_API_KEY / GEMINI_API_KEY_BACKUP from env or ni_platform_secrets,
 * mirroring hydratePlatformEnvFromDatabase's pattern for ANTHROPIC_API_KEY.
 */
async function resolveGeminiKeys(): Promise<string[]> {
  const primary = await resolvePlatformSecret(
    "GEMINI_API_KEY",
    process.env.GEMINI_API_KEY,
    (value) => !value?.trim()
  );
  const backup = await resolvePlatformSecret(
    "GEMINI_API_KEY_BACKUP",
    process.env.GEMINI_API_KEY_BACKUP,
    (value) => !value?.trim()
  );
  return [primary, backup].filter((k): k is string => Boolean(k?.trim()));
}

async function callGeminiOnce(
  apiKey: string,
  system: string,
  prompt: string,
  maxOutputTokens: number,
  temperature: number
): Promise<string | null> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens, temperature },
      }),
    }
  );
  if (!r.ok) return null;
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text)
    .join("")
    ?.trim();
  return text || null;
}

export type GeminiFirstArgs = {
  /** Anthropic model string to fall back to, e.g. "anthropic/claude-haiku-4.5" (Vercel AI Gateway format). */
  anthropicModel: string;
  system: string;
  prompt: string;
  maxOutputTokens: number;
  temperature?: number;
};

/**
 * Try the user's free-tier Gemini key(s) first; fall back to the existing
 * Anthropic-via-Vercel-AI-Gateway path only if Gemini is unconfigured or fails.
 * Drop-in replacement for `generateText({ model: anthropicModel, ... })` — same
 * `{ text }` return shape.
 */
export async function generateTextGeminiFirst(
  args: GeminiFirstArgs
): Promise<{ text: string; provider: "gemini" | "anthropic" }> {
  const { anthropicModel, system, prompt, maxOutputTokens, temperature = 0.5 } = args;

  const geminiKeys = await resolveGeminiKeys();
  for (const key of geminiKeys) {
    try {
      const text = await callGeminiOnce(key, system, prompt, maxOutputTokens, temperature);
      if (text) return { text, provider: "gemini" };
    } catch {
      // try next key / fall through to Anthropic
    }
  }

  const { text } = await generateText({
    model: anthropicModel,
    system,
    prompt,
    maxOutputTokens,
    temperature,
  });
  return { text, provider: "anthropic" };
}
