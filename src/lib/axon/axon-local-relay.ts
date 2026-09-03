/**
 * AXON-EVERYWHERE-PROJECT (2026-08-05): the tunnel for cloud -> Mac-mini AXON-local calls.
 * No new infra — reuses nvg_mini_jobs (Supabase queue the mini already polls via
 * nvg-mini-runner.py, proven live for git relay tonight per Decision #599) as an async
 * request/response bridge to the Ollama server on the mini. Proven end-to-end with a real
 * generation 2026-08-05 (Learning #3585) — this is not a status flag, it returns real text.
 *
 * Callers get `null` on any failure/timeout so they can fall through to the next tier
 * (RunPod AXON v1, then Gemini) without throwing.
 *
 * CANONICAL NVG TIER ORDER (2026-08-20, JB direct order): Local (this file's
 * `callAxonLocal`) -> RunPod AXON v1 (this file's `callAxonRunpod`, NI-Brain
 * Decision #1261 — Qwen3-Coder-30B-A3B-Instruct, NOT deployed yet as of this
 * writing) -> Gemini primary -> Gemini backup -> Anthropic last resort. This
 * repo's one true chokepoint is `src/lib/ai/gemini-first.ts`, which wires
 * `callAxonLocal` and `callAxonRunpod` from this file ahead of its Gemini
 * tiers. Per this repo's own standing rule ("Nothing routes to a paid API.
 * Ever." — root CLAUDE.md / AGENTS.md), `gemini-first.ts` deliberately has NO
 * Anthropic tier — that step of the canonical order does not apply here.
 */

import { SUPABASE_URL } from './constants.mjs';

const MINI_RELAY_MODEL = 'axon-ornith:latest';
// AX-RELAY-TIMEOUT-FIX-0828 (NI-Brain Decision #1503): 40s was too short for real
// /api/generate calls under mini disk/load pressure — measured 78% failure rate
// (curl exit 28) over a 48h trailing sample, 2026-08-28. Raised to 120s, with the
// caller's own wait budget raised to match so the longer curl timeout is actually
// usable instead of being abandoned early by the poll loop.
const MINI_RELAY_MAX_WAIT_MS = 130_000;
const MINI_RELAY_POLL_MS = 2_500;
const MINI_RELAY_CMD_TIMEOUT_S = 120;
const RUNPOD_TIMEOUT_MS = 30_000;

type ChatMsg = { role: string; content: string };

function buildPrompt(system: string, messages: ChatMsg[]): string {
  const convo = messages
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
    .join('\n');
  return `${system}\n\n${convo}\nAssistant:`;
}

function sbHeaders(supabaseKey: string) {
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    'Content-Type': 'application/json',
  };
}

export type AxonUsage = { tokensIn?: number; tokensOut?: number };
export type AxonRelayResult = { text: string | null; usage?: AxonUsage };

/** Try AXON's own local model (Mac mini, Ollama) via the mini job-queue relay. */
export async function callAxonLocal(
  supabaseKey: string | null | undefined,
  system: string,
  messages: ChatMsg[],
): Promise<string | null> {
  const result = await callAxonLocalWithUsage(supabaseKey, system, messages);
  return result.text;
}

/** Same as callAxonLocal but also surfaces Ollama's token counts when the relay returns them. */
export async function callAxonLocalWithUsage(
  supabaseKey: string | null | undefined,
  system: string,
  messages: ChatMsg[],
): Promise<AxonRelayResult> {
  if (!supabaseKey) return { text: null };

  const prompt = buildPrompt(system, messages);
  // think:false is required — axon-ornith is a thinking-capable model (qwen3.5 base) that
  // otherwise puts its entire answer in the `thinking` field and leaves `response` empty,
  // which silently looked like "AXON unreachable" and fell through to Gemini every time.
  // Found + fixed 2026-08-05 during the first live proof run (Learning #3625).
  const ollamaBody = JSON.stringify({ model: MINI_RELAY_MODEL, prompt, stream: false, think: false });
  // Single-quote-safe: JSON-stringify the JSON body again so it survives the mini's `sh -c`.
  const cmd = `curl -s -m ${MINI_RELAY_CMD_TIMEOUT_S} http://localhost:11434/api/generate -d ${JSON.stringify(
    ollamaBody,
  )}`;

  let jobId: number | null = null;
  try {
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/nvg_mini_jobs`, {
      method: 'POST',
      headers: { ...sbHeaders(supabaseKey), Prefer: 'return=representation' },
      body: JSON.stringify({
        kind: 'shell',
        title: 'axon-chat-local-relay',
        payload: { cmd, timeout: MINI_RELAY_CMD_TIMEOUT_S + 5 },
        status: 'queued',
      }),
    });
    if (!insertRes.ok) return { text: null };
    const rows = await insertRes.json();
    jobId = Array.isArray(rows) ? rows[0]?.id : rows?.id;
  } catch {
    return { text: null };
  }
  if (!jobId) return { text: null };

  const deadline = Date.now() + MINI_RELAY_MAX_WAIT_MS;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, MINI_RELAY_POLL_MS));
    try {
      const pollRes = await fetch(
        `${SUPABASE_URL}/rest/v1/nvg_mini_jobs?id=eq.${jobId}&select=status,result,error`,
        { headers: { ...sbHeaders(supabaseKey), Accept: 'application/json' } },
      );
      if (!pollRes.ok) continue;
      const rows = await pollRes.json();
      const row = rows?.[0];
      if (!row) continue;

      if (row.status === 'failed') return { text: null };
      if (row.status !== 'done') continue;

      const stdout = row.result?.stdout;
      if (!stdout) return { text: null };
      try {
        const parsed = JSON.parse(stdout);
        const text = typeof parsed.response === 'string' ? parsed.response.trim() : null;
        return {
          text: text || null,
          usage: { tokensIn: parsed.prompt_eval_count, tokensOut: parsed.eval_count },
        };
      } catch {
        return { text: null };
      }
    } catch {
      // transient poll error — keep trying until deadline
    }
  }
  return { text: null }; // timed out — caller falls through to the next tier, mini job keeps running
}

let runpodMissingConfigLogged = false;

/**
 * Try RunPod-hosted AXON v1 (NVG's own fine-tuned model, Qwen3-Coder-30B-A3B-Instruct,
 * NI-Brain Decision #1261). Tier 2 — after AXON-local (Mac mini), before Gemini.
 *
 * As of 2026-08-20 nothing is deployed to RunPod yet, so `endpoint`/`apiKey` will be
 * missing (no `RUNPOD_AXON_V1_ENDPOINT` / `RUNPOD_AXON_V1_KEY` rows in
 * `ni_platform_secrets`) and this returns `null` immediately with no network call —
 * a deliberate, safe no-op until the endpoint goes live. Same contract as
 * `callAxonLocal`: never throws, `null` on any failure/timeout/missing-config so the
 * caller falls through to the next tier.
 *
 * Request/response shape is a best-effort RunPod Serverless convention
 * (`{ input: { messages, ... } }` in, `{ output: ... }` out) — there is no live
 * endpoint to verify the exact contract against yet. Re-check this parsing against
 * the real worker response the first time AXON v1 actually deploys to RunPod.
 */
export async function callAxonRunpod(
  endpoint: string | null | undefined,
  apiKey: string | null | undefined,
  system: string,
  messages: ChatMsg[],
): Promise<string | null> {
  const result = await callAxonRunpodWithUsage(endpoint, apiKey, system, messages);
  return result.text;
}

/** Same as callAxonRunpod but also surfaces token usage when RunPod reports one. */
export async function callAxonRunpodWithUsage(
  endpoint: string | null | undefined,
  apiKey: string | null | undefined,
  system: string,
  messages: ChatMsg[],
): Promise<AxonRelayResult> {
  if (!endpoint || !apiKey) {
    if (!runpodMissingConfigLogged) {
      runpodMissingConfigLogged = true;
      console.log(
        '[axon-runpod] RUNPOD_AXON_V1_ENDPOINT/RUNPOD_AXON_V1_KEY not configured — RunPod AXON v1 tier is a no-op until it deploys (NI-Brain Decision #1261).',
      );
    }
    return { text: null };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), RUNPOD_TIMEOUT_MS);

  try {
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: {
          messages: [
            { role: 'system', content: system },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          max_tokens: 1024,
          temperature: 0.5,
        },
      }),
      signal: controller.signal,
    });
    if (!r.ok) return { text: null };

    const data = await r.json();
    const output = data?.output;
    const text: unknown =
      typeof output === 'string'
        ? output
        : typeof output?.text === 'string'
          ? output.text
          : typeof output?.choices?.[0]?.message?.content === 'string'
            ? output.choices[0].message.content
            : typeof output?.[0]?.choices?.[0]?.tokens?.[0] === 'string'
              ? output[0].choices[0].tokens[0]
              : null;

    const rawUsage = output?.usage ?? data?.usage;
    const usage = rawUsage
      ? { tokensIn: rawUsage.prompt_tokens, tokensOut: rawUsage.completion_tokens }
      : undefined;

    return { text: typeof text === 'string' && text.trim() ? text.trim() : null, usage };
  } catch {
    return { text: null };
  } finally {
    clearTimeout(timeoutId);
  }
}

/** Try Gemini (free tier). Used as tier 2/3 between AXON-local and paid Anthropic. */
export async function callGemini(
  apiKey: string | null | undefined,
  model: string,
  system: string,
  messages: ChatMsg[],
): Promise<string | null> {
  if (!apiKey) return null;
  try {
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents,
        }),
      },
    );
    if (!r.ok) return null;
    const data = await r.json();
    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p: { text?: string }) => p.text || '')
      .join('')
      .trim();
    return text || null;
  } catch {
    return null;
  }
}

// NOTE (2026-08-20): a `callAxonTierChain` helper + `TierChainResult` type used to live
// here — a second, parallel implementation of the AXON-first tier chain (local -> Gemini
// primary -> Gemini backup -> Anthropic) that took a caller-supplied Anthropic function.
// Confirmed via repo-wide grep this session: it was exported but had ZERO call sites
// anywhere in this repo — genuinely dead code, and it had already drifted out of sync
// with the real chokepoint (`generateTextGeminiFirst` in `src/lib/ai/gemini-first.ts`,
// which has no Anthropic tier at all per this repo's "never pay" rule). Removed rather
// than kept in sync, since `gemini-first.ts` is the one true chokepoint going forward
// and a second, uncalled tier-chain implementation is a maintenance footgun with no
// current caller to justify it. If a future caller needs an in-process (non-HTTP) tier
// chain, wire it against `callAxonLocal` / `callAxonRunpod` / `callGemini` directly.
