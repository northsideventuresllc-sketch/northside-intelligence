import "server-only";

import { resolvePlatformSecret } from "@/lib/platform-secrets";
import { callAxonLocal } from "@/lib/axon/axon-local-relay";

/**
 * Free-tier Gemini models, tried in order. gemini-2.0-flash is deliberately
 * LAST: its free quota is exhausted and it returns 429, which used to push
 * every generation onto the paid Vercel AI Gateway fallback and fail with
 * "Free tier users do not have access to this model" — the daily
 * content-machine failure JB kept getting texted about.
 *
 * JB's hard rule: NOTHING here may route to a paid API. If every free model
 * is out of quota we fail with a plain-English message instead.
 *
 * AXON-EVERYWHERE-PROJECT (2026-08-05): AXON-local (Mac mini) is now tried
 * before any Gemini model — still zero paid API, zero Anthropic. Decision
 * #598 item 11 / #619.
 */
const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

async function resolveSupabaseKey(): Promise<string | null> {
  const key = await resolvePlatformSecret(
    "SUPABASE_SERVICE_KEY",
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    (value) => !value?.trim()
  );
  return key?.trim() || null;
}

async function resolveModels(): Promise<string[]> {
  const configured = await resolvePlatformSecret(
    "GEMINI_MODEL",
    process.env.GEMINI_MODEL,
    (value) => !value?.trim()
  );
  const ordered = configured?.trim() ? [configured.trim(), ...FALLBACK_MODELS] : FALLBACK_MODELS;
  return ordered.filter((m, i) => ordered.indexOf(m) === i);
}

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
  model: string,
  system: string,
  prompt: string,
  maxOutputTokens: number,
  temperature: number
): Promise<string | null> {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
  /** @deprecated Kept for call-site compatibility. No paid fallback is used. */
  anthropicModel?: string;
  system: string;
  prompt: string;
  maxOutputTokens: number;
  temperature?: number;
};

/**
 * Generate text — AXON-local (Mac mini) first, then the free Gemini tier only
 * (configured model, other free models, backup key). Never falls back to a
 * paid provider.
 */
export async function generateTextGeminiFirst(
  args: GeminiFirstArgs
): Promise<{ text: string; provider: "axon-local" | "gemini" }> {
  const { system, prompt, maxOutputTokens, temperature = 0.5 } = args;

  const supabaseKey = await resolveSupabaseKey();
  if (supabaseKey) {
    try {
      const local = await callAxonLocal(supabaseKey, system, [{ role: "user", content: prompt }]);
      if (local) return { text: local, provider: "axon-local" };
    } catch {
      // fall through to Gemini
    }
  }

  const geminiKeys = await resolveGeminiKeys();
  if (!geminiKeys.length) {
    throw new Error("Content generation is off: no Google AI key is set up yet.");
  }

  const models = await resolveModels();
  for (const key of geminiKeys) {
    for (const model of models) {
      try {
        const text = await callGeminiOnce(key, model, system, prompt, maxOutputTokens, temperature);
        if (text) return { text, provider: "gemini" };
      } catch {
        // try the next model / key
      }
    }
  }

  throw new Error(
    "Content generation is out of free Google AI quota for today. It will work again after the daily reset — nothing is broken and nothing needs paying for."
  );
}
