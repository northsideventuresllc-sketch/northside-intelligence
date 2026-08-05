/**
 * AXON-EVERYWHERE-PROJECT (2026-08-05): the tunnel for cloud -> Mac-mini AXON-local calls.
 * No new infra — reuses nvg_mini_jobs (Supabase queue the mini already polls via
 * nvg-mini-runner.py, proven live for git relay tonight per Decision #599) as an async
 * request/response bridge to the Ollama server on the mini. Proven end-to-end with a real
 * generation 2026-08-05 (Learning #3585) — this is not a status flag, it returns real text.
 *
 * Callers get `null` on any failure/timeout so they can fall through to the next tier
 * (Gemini, then Anthropic last) without throwing.
 */

import { SUPABASE_URL } from './constants.mjs';

const MINI_RELAY_MODEL = 'axon-ornith:latest';
const MINI_RELAY_MAX_WAIT_MS = 45_000;
const MINI_RELAY_POLL_MS = 2_500;
const MINI_RELAY_CMD_TIMEOUT_S = 40;

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

/** Try AXON's own local model (Mac mini, Ollama) via the mini job-queue relay. */
export async function callAxonLocal(
  supabaseKey: string | null | undefined,
  system: string,
  messages: ChatMsg[],
): Promise<string | null> {
  if (!supabaseKey) return null;

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
    if (!insertRes.ok) return null;
    const rows = await insertRes.json();
    jobId = Array.isArray(rows) ? rows[0]?.id : rows?.id;
  } catch {
    return null;
  }
  if (!jobId) return null;

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

      if (row.status === 'failed') return null;
      if (row.status !== 'done') continue;

      const stdout = row.result?.stdout;
      if (!stdout) return null;
      try {
        const parsed = JSON.parse(stdout);
        const text = typeof parsed.response === 'string' ? parsed.response.trim() : null;
        return text || null;
      } catch {
        return null;
      }
    } catch {
      // transient poll error — keep trying until deadline
    }
  }
  return null; // timed out — caller falls through to the next tier, mini job keeps running
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

export type TierChainResult = { text: string; provider: 'axon-local' | 'gemini-primary' | 'gemini-backup' | 'anthropic' };

/**
 * AXON-first tier chain, per JB directive (DW-LOCAL-MODEL-MIGRATION) and the locked
 * order from Decision #598 item 11: AXON local -> Gemini main -> Gemini backup -> Anthropic last.
 * `callAnthropicLast` is the caller's existing paid-Anthropic function — kept as the final,
 * unchanged safety net so behavior never regresses below what shipped before this change.
 */
export async function callAxonTierChain(
  cfg: { supabaseKey?: string | null; geminiKey?: string | null; geminiBackup?: string | null; geminiModel?: string | null },
  system: string,
  messages: ChatMsg[],
  callAnthropicLast: () => Promise<string>,
): Promise<TierChainResult> {
  const local = await callAxonLocal(cfg.supabaseKey, system, messages).catch(() => null);
  if (local) return { text: local, provider: 'axon-local' };

  const model = cfg.geminiModel || 'gemini-2.5-flash-lite';

  const geminiPrimary = await callGemini(cfg.geminiKey, model, system, messages).catch(() => null);
  if (geminiPrimary) return { text: geminiPrimary, provider: 'gemini-primary' };

  const geminiBackup = await callGemini(cfg.geminiBackup, model, system, messages).catch(() => null);
  if (geminiBackup) return { text: geminiBackup, provider: 'gemini-backup' };

  const anthropicText = await callAnthropicLast();
  return { text: anthropicText, provider: 'anthropic' };
}
