import { generateReply } from "@/lib/replyflow/ai";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import type { ToolContext, ToolHandler } from "../types";

// Anonymous free-tier caps (per rolling 24h) so a public endpoint can't run up AI costs.
const DAILY_CAP_TOTAL = 100;
const DAILY_CAP_PER_ENGINE = 10;
const MAX_LEAD_CHARS = 4000;
const MAX_CONTEXT_CHARS = 500;

async function overDailyCap(ctx: ToolContext): Promise<boolean> {
  if (!ctx.supabase) return true; // fail closed: no metering, no free AI
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const base = () =>
    ctx.supabase!
      .from("axon_agent_messages")
      .select("id", { count: "exact", head: true })
      .eq("thread", "webmcp_ingress")
      .eq("meta->>tool_name", "ni_replyflow_generate")
      .eq("meta->>result_status", "ok")
      .gte("created_at", since);
  const [{ count: total }, { count: mine }] = await Promise.all([base(), base().eq("sender", ctx.engine)]);
  return (total ?? 0) >= DAILY_CAP_TOTAL || (mine ?? 0) >= DAILY_CAP_PER_ENGINE;
}

const TOOL_SLUG = "replyflow";
const ALLOWED_TONES = ["direct", "consultative", "casual", "urgent"] as const;

/**
 * The manifest floor for this tool is $0.10/call, below Stripe's minimum charge, so this
 * cannot go through `createWebmcpCheckout` (payment mode). ReplyFlow has a real free tier
 * (see `getSector3FreeTierSpec("replyflow")`, 10 replies/mo in the app), so this tool serves
 * that tier directly and labels the response accordingly, instead of returning `unavailable`.
 *
 * Caveat (report this): the app's free-tier cap is metered per signed-in account
 * (`replyflow_profiles.replies_used_this_month`). WebMCP callers are anonymous agents with no
 * account, so this tool cannot meter against that same per-account cap — it serves one reply
 * per call, honestly labelled as free-tier generation, and points heavy users at
 * `ni_replyflow_subscribe` for metered/unlimited access instead of silently unmetering the cap.
 */
export const handler: ToolHandler = async (_tool, params, ctx) => {
  const leadMessage = typeof params.lead_message === "string" ? params.lead_message.trim() : "";
  const context = typeof params.context === "string" ? params.context.trim() : "";
  const toneRaw = typeof params.tone === "string" ? params.tone : "direct";
  const tone = (ALLOWED_TONES as readonly string[]).includes(toneRaw) ? toneRaw : "direct";

  if (!leadMessage) return { status: "invalid_input", message: "lead_message is required." };
  if (!context) return { status: "invalid_input", message: "context is required." };
  if (leadMessage.length > MAX_LEAD_CHARS || context.length > MAX_CONTEXT_CHARS) {
    return { status: "invalid_input", message: `lead_message max ${MAX_LEAD_CHARS} chars, context max ${MAX_CONTEXT_CHARS} chars.` };
  }
  if (await overDailyCap(ctx)) {
    return { status: "unavailable", message: "Free-tier daily limit reached. Call ni_replyflow_subscribe for unlimited replies." };
  }

  const freeTier = getSector3FreeTierSpec(TOOL_SLUG);
  const systemPrompt = `You are a customer service expert. Write a ${tone} customer service reply for a ${context} scenario. Be concise, empathetic, and professional. Return only the reply text.`;

  try {
    const reply = await generateReply(systemPrompt, leadMessage);
    return {
      status: "ok",
      data: { reply, tone, context },
      message: `Served from ReplyFlow's free tier (${freeTier.summary}). For higher volume or guaranteed capacity, call ni_replyflow_subscribe.`,
    };
  } catch {
    return { status: "unavailable", message: "ReplyFlow generation failed. Try again shortly." };
  }
};
