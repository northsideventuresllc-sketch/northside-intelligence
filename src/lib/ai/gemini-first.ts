import "server-only";

import { resolvePlatformSecret } from "@/lib/platform-secrets";
import { callAxonLocalWithUsage, callAxonRunpodWithUsage } from "@/lib/axon/axon-local-relay";
import { logLlmUsage } from "@/lib/ai/usage-ledger";

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
 *
 * CANONICAL TIER SYSTEM (2026-08-20, JB direct order; OpenRouter free tier
 * inserted 2026-09-03, Phase 3 / Decision #1721): Local -> RunPod AXON v1 ->
 * OpenRouter free -> Gemini primary -> Gemini backup. RunPod AXON v1 (NVG's
 * own fine-tuned Qwen3-Coder-30B-A3B-Instruct, NI-Brain Decision #1261) is
 * tried between AXON-local and OpenRouter via `callAxonRunpod`. It reads
 * `RUNPOD_AXON_V1_ENDPOINT` / `RUNPOD_AXON_V1_KEY` from `ni_platform_secrets`
 * and is a safe no-op (no network call) until those are configured — nothing
 * is deployed to RunPod yet as of this writing. OpenRouter (`OPENROUTER_API_KEY`
 * from `ni_platform_secrets`/env) is likewise a safe no-op until configured,
 * and only ever calls models read live from NI-Brain `router_models` where
 * `route='openrouter'` and `cost_tier=0` (free) — it does not add a paid tier.
 * This chokepoint still has no Anthropic tier: that step of the org-wide
 * canonical order does not apply here per the "never pay" rule above.
 */
const FALLBACK_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-2.0-flash"];

/**
 * UNVERIFIED fallback only — used when the live NI-Brain query for enabled
 * cost_tier=0 'openrouter' route models returns no rows. Not confirmed
 * free/available at read time.
 */
const OPENROUTER_FREE_MODEL_FALLBACK_UNVERIFIED = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
];

async function resolveSupabaseKey(): Promise<string | null> {
  const key = await resolvePlatformSecret(
    "SUPABASE_SERVICE_KEY",
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    (value) => !value?.trim()
  );
  return key?.trim() || null;
}

/** Resolve RUNPOD_AXON_V1_ENDPOINT / RUNPOD_AXON_V1_KEY from env or ni_platform_secrets. */
async function resolveRunpodConfig(): Promise<{ endpoint: string | null; apiKey: string | null }> {
  const endpoint = await resolvePlatformSecret(
    "RUNPOD_AXON_V1_ENDPOINT",
    process.env.RUNPOD_AXON_V1_ENDPOINT,
    (value) => !value?.trim()
  );
  const apiKey = await resolvePlatformSecret(
    "RUNPOD_AXON_V1_KEY",
    process.env.RUNPOD_AXON_V1_KEY,
    (value) => !value?.trim()
  );
  return { endpoint: endpoint?.trim() || null, apiKey: apiKey?.trim() || null };
}

async function resolveOpenRouterApiKey(): Promise<string | null> {
  const key = await resolvePlatformSecret(
    "OPENROUTER_API_KEY",
    process.env.OPENROUTER_API_KEY,
    (value) => !value?.trim()
  );
  return key?.trim() || null;
}

/**
 * Read the enabled cost_tier=0 model list for the 'openrouter' route from NI-Brain
 * (router_models joined to router_routes). Falls back to
 * OPENROUTER_FREE_MODEL_FALLBACK_UNVERIFIED when that query is empty or unreachable.
 */
async function resolveOpenRouterFreeModels(supabaseKey: string | null): Promise<string[]> {
  if (!supabaseKey) return [...OPENROUTER_FREE_MODEL_FALLBACK_UNVERIFIED];
  try {
    const url =
      "https://kxijunwgbrlfzvgkhklo.supabase.co/rest/v1/router_models" +
      "?select=model,router_routes!inner(name)" +
      "&router_routes.name=eq.openrouter&cost_tier=eq.0&enabled=eq.true";
    const r = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3_000),
    });
    if (!r.ok) return [...OPENROUTER_FREE_MODEL_FALLBACK_UNVERIFIED];
    const rows = (await r.json()) as Array<{ model?: string }>;
    const models = Array.isArray(rows) ? rows.map((row) => row.model).filter((m): m is string => Boolean(m)) : [];
    return models.length ? models : [...OPENROUTER_FREE_MODEL_FALLBACK_UNVERIFIED];
  } catch {
    return [...OPENROUTER_FREE_MODEL_FALLBACK_UNVERIFIED];
  }
}

type OpenRouterOnceResult = { text: string | null; usage?: { tokensIn?: number; tokensOut?: number }; ms: number };

async function callOpenRouterOnce(
  apiKey: string,
  model: string,
  system: string,
  prompt: string,
  maxTokens: number,
  temperature: number
): Promise<OpenRouterOnceResult> {
  const startedAt = Date.now();
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const ms = Date.now() - startedAt;
  if (!r.ok) return { text: null, ms };
  const data = await r.json();
  const text = data?.choices?.[0]?.message?.content?.trim();
  const usage = data?.usage
    ? { tokensIn: data.usage.prompt_tokens, tokensOut: data.usage.completion_tokens }
    : undefined;
  return { text: text || null, usage, ms };
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

type GeminiOnceResult = {
  text: string | null;
  usage?: { tokensIn?: number; tokensOut?: number };
  ms: number;
};

async function callGeminiOnce(
  apiKey: string,
  model: string,
  system: string,
  prompt: string,
  maxOutputTokens: number,
  temperature: number
): Promise<GeminiOnceResult> {
  const startedAt = Date.now();
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
  const ms = Date.now() - startedAt;
  if (!r.ok) return { text: null, ms };
  const data = await r.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text)
    .join("")
    ?.trim();
  const usageMetadata = data.usageMetadata as
    | { promptTokenCount?: number; candidatesTokenCount?: number }
    | undefined;
  const usage = usageMetadata
    ? { tokensIn: usageMetadata.promptTokenCount, tokensOut: usageMetadata.candidatesTokenCount }
    : undefined;
  return { text: text || null, usage, ms };
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
): Promise<{ text: string; provider: "axon-local" | "runpod-axon-v1" | "openrouter" | "gemini" }> {
  const { system, prompt, maxOutputTokens, temperature = 0.5 } = args;

  const supabaseKey = await resolveSupabaseKey();
  if (supabaseKey) {
    try {
      const local = await callAxonLocalWithUsage(supabaseKey, system, [{ role: "user", content: prompt }]);
      if (local.text) {
        logLlmUsage({
          provider: "ollama",
          model: "axon-ornith:latest",
          tokensIn: local.usage?.tokensIn,
          tokensOut: local.usage?.tokensOut,
        });
        return { text: local.text, provider: "axon-local" };
      }
    } catch {
      // fall through to RunPod, then Gemini
    }
  }

  // Tier 2: RunPod-hosted AXON v1. Safe no-op (no network call) until
  // RUNPOD_AXON_V1_ENDPOINT/RUNPOD_AXON_V1_KEY exist in ni_platform_secrets.
  try {
    const { endpoint, apiKey } = await resolveRunpodConfig();
    const runpod = await callAxonRunpodWithUsage(endpoint, apiKey, system, [{ role: "user", content: prompt }]);
    if (runpod.text) {
      logLlmUsage({
        provider: "runpod",
        model: "Qwen3-Coder-30B-A3B-Instruct",
        tokensIn: runpod.usage?.tokensIn,
        tokensOut: runpod.usage?.tokensOut,
      });
      return { text: runpod.text, provider: "runpod-axon-v1" };
    }
  } catch {
    // fall through to OpenRouter, then Gemini
  }

  // Tier 3: OpenRouter free models. Safe no-op (no network call) until
  // OPENROUTER_API_KEY is configured. Free-tier only — never paid, matching
  // this file's "never pay" rule.
  try {
    const openRouterKey = await resolveOpenRouterApiKey();
    if (openRouterKey) {
      const models = await resolveOpenRouterFreeModels(supabaseKey);
      for (const model of models) {
        const result = await callOpenRouterOnce(openRouterKey, model, system, prompt, maxOutputTokens, temperature);
        if (result.text) {
          logLlmUsage({
            provider: "openrouter",
            model,
            tokensIn: result.usage?.tokensIn,
            tokensOut: result.usage?.tokensOut,
            ms: result.ms,
          });
          return { text: result.text, provider: "openrouter" };
        }
      }
    }
  } catch {
    // fall through to Gemini
  }

  const geminiKeys = await resolveGeminiKeys();
  if (!geminiKeys.length) {
    throw new Error("Content generation is off: no Google AI key is set up yet.");
  }

  const models = await resolveModels();
  for (const key of geminiKeys) {
    for (const model of models) {
      try {
        const result = await callGeminiOnce(key, model, system, prompt, maxOutputTokens, temperature);
        if (result.text) {
          logLlmUsage({
            provider: "gemini",
            model,
            tokensIn: result.usage?.tokensIn,
            tokensOut: result.usage?.tokensOut,
            ms: result.ms,
          });
          return { text: result.text, provider: "gemini" };
        }
      } catch {
        // try the next model / key
      }
    }
  }

  throw new Error(
    "Content generation is out of free Google AI quota for today. It will work again after the daily reset — nothing is broken and nothing needs paying for."
  );
}
