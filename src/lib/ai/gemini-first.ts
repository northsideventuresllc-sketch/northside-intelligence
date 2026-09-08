import "server-only";

import { resolvePlatformSecret } from "@/lib/platform-secrets";
import { generateViaRouter } from "@/lib/axon/axon-generate.mjs";

/**
 * ONE ROUTER (2026-09-06, BPA-A1-NI-MIRROR-0906).
 *
 * This file used to be a second, hand-rolled copy of the provider waterfall:
 * AXON-local -> RunPod -> OpenRouter free -> Gemini primary -> Gemini backup,
 * with its own key resolution, its own model list and its own usage logging.
 * That copy drifted from the one the rest of the org runs on, and it had no
 * last-resort lane at all, so a full free-tier outage simply failed.
 *
 * It is now a thin adapter over the single locked chain in
 * `src/lib/axon/axon-router-core.mjs` (mirrored from AXON, never hand-edited):
 *
 *   local (Mac mini) -> RunPod AXON v1 -> OpenRouter free -> Gemini -> Anthropic
 *
 * Free tiers first, paid genuinely last. That order lives in the router and is
 * NOT reordered here. Keys, model choice, per-account overrides, the Gemini
 * backup key and the usage ledger are all the router's job now — which is why
 * this file no longer resolves a single provider key itself.
 *
 * The exported names and shapes are unchanged on purpose: every caller
 * (grantbot, replyflow, content machine, sector 3 tools, store + services
 * assistants) keeps working with no edit.
 */

/** The lane the router reports, mapped to the tags this repo has always returned. */
const LANE_PROVIDER = {
  local: "axon-local",
  runpod: "runpod-axon-v1",
  openrouter: "openrouter",
  gemini: "gemini",
  anthropic: "anthropic",
} as const;

export type GeneratedTextProvider = (typeof LANE_PROVIDER)[keyof typeof LANE_PROVIDER];

async function resolveSupabaseKey(): Promise<string | null> {
  const key = await resolvePlatformSecret(
    "SUPABASE_SERVICE_KEY",
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    (value) => !value?.trim()
  );
  return key?.trim() || null;
}

export type GeminiFirstArgs = {
  /** @deprecated Kept for call-site compatibility. The router picks the model. */
  anthropicModel?: string;
  system: string;
  prompt: string;
  maxOutputTokens: number;
  /**
   * Ask the answering lane for strict JSON. Set it whenever the caller is about
   * to JSON.parse the result — the Google lane enforces it, the others take it
   * as a hint and lose nothing.
   */
  jsonMode?: boolean;
  /** Optional label for the usage ledger, so a lane failure can be traced to a tool. */
  agentName?: string;
  /**
   * Bounds the router's local (Mac mini) tier for this call only. Any caller that retries
   * the whole chain itself inside one function-duration budget (e.g. content-machine's
   * quality-gate regen loop, up to 3 attempts) MUST pass this — the router's own default
   * (130s/155s, sized for a single-shot caller) would blow a shared maxDuration across
   * multiple attempts otherwise. See NI-AXONGEN-ALL-TIERS-DOWN-0907.
   */
  localTimeoutMs?: number;
};

/**
 * Generate text through the locked chain. Returns the text plus which lane
 * actually answered.
 */
export async function generateTextGeminiFirst(
  args: GeminiFirstArgs
): Promise<{ text: string; provider: GeneratedTextProvider }> {
  const { system, prompt, maxOutputTokens, jsonMode = false, agentName = "ni-portal", localTimeoutMs } = args;

  const supabaseKey = await resolveSupabaseKey();

  try {
    const out = await generateViaRouter(supabaseKey ?? "", {
      system,
      user: prompt,
      kind: "cheap_chat",
      agentName,
      maxTokens: maxOutputTokens,
      jsonMode,
      localTimeoutMs,
    });
    const text = String(out?.text || "").trim();
    if (!text) throw new Error("empty response");
    const provider =
      LANE_PROVIDER[out.provider as keyof typeof LANE_PROVIDER] ?? ("gemini" as GeneratedTextProvider);
    return { text, provider };
  } catch (err) {
    // The prefix is what a person reads. The router's own reason is appended so the
    // callers that branch on it (an access/authentication failure, say) still match —
    // swallowing it made those branches dead code.
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `Text generation could not be completed right now — every option was unavailable. Nothing is broken and nothing needs paying for; try again shortly.${reason ? ` (${reason})` : ""}`
    );
  }
}
