import "server-only";

import { resolvePlatformSecret } from "@/lib/platform-secrets";

/**
 * AXON-EVERYWHERE-PROJECT / Phase 2 lane A3 (agentic-os-phase2-harness-usage.md): every
 * non-Claude LLM call logs to the AXON ledger (axon_cost_ledger, NI-Brain
 * kxijunwgbrlfzvgkhklo) through one door. TS inline copy of
 * AXON/lib/axon-router-core.mjs's recordLlmUsage() — this repo imports src/lib/ai only,
 * not the AXON repo, so the shape is duplicated on purpose. Keep both in sync when the row
 * shape changes.
 *
 * Fire-and-forget: 3s timeout, never throws, never awaited by the caller's response path.
 * This repo has NO Anthropic tier in gemini-first.ts (standing rule: free tiers only here) —
 * this writer is provider-agnostic and works the same for ollama / runpod-axon-v1 / gemini.
 */

const NI_BRAIN_USAGE_LOG_TIMEOUT_MS = 3_000;

export type LlmUsageLogEntry = {
  agentName?: string;
  provider: string;
  model?: string;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  ms?: number;
  venture?: string;
  product?: string;
  meta?: Record<string, unknown>;
};

async function resolveSupabaseKey(): Promise<string | null> {
  const key = await resolvePlatformSecret(
    "SUPABASE_SERVICE_KEY",
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    (value) => !value?.trim()
  );
  return key?.trim() || null;
}

function resolveSupabaseUrl(): string | null {
  return process.env.SUPABASE_URL?.trim() || process.env.NI_BRAIN_SUPABASE_URL?.trim() || null;
}

/**
 * Log one LLM call to axon_cost_ledger. Fire-and-forget by design — callers should NOT
 * `await` this on the hot path; call it and move on. Never throws.
 */
export function logLlmUsage(entry: LlmUsageLogEntry): void {
  void logLlmUsageAsync(entry);
}

/** Awaitable version, for tests and background jobs that want to confirm the write. */
export async function logLlmUsageAsync(entry: LlmUsageLogEntry): Promise<boolean> {
  try {
    const supabaseUrl = resolveSupabaseUrl();
    const supabaseKey = await resolveSupabaseKey();
    if (!supabaseUrl || !supabaseKey) return false;

    const tokensIn = Number.isFinite(entry.tokensIn) ? entry.tokensIn : null;
    const tokensOut = Number.isFinite(entry.tokensOut) ? entry.tokensOut : null;
    const totalTokens =
      tokensIn != null || tokensOut != null ? (tokensIn ?? 0) + (tokensOut ?? 0) : null;

    let notes: string | null = null;
    if (entry.meta) {
      try {
        notes = JSON.stringify(entry.meta).slice(0, 2000);
      } catch {
        notes = null;
      }
    }

    const res = await fetch(`${supabaseUrl}/rest/v1/axon_cost_ledger`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        venture: entry.venture || "northside-intelligence",
        product: entry.product || null,
        model: entry.model || null,
        executor: entry.provider || null,
        provider: entry.provider || null,
        agent_name: entry.agentName || "ni-gemini-first",
        input_tokens: tokensIn,
        output_tokens: tokensOut,
        total_tokens: totalTokens,
        cost_usd: Number.isFinite(entry.costUsd) ? entry.costUsd : null,
        ms: Number.isFinite(entry.ms) ? entry.ms : null,
        notes,
        called_at: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(NI_BRAIN_USAGE_LOG_TIMEOUT_MS),
    });

    return res.ok;
  } catch {
    // Usage logging must never break a live AI call.
    return false;
  }
}
