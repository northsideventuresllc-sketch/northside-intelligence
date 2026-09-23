import { generateReply } from "@/lib/replyflow/ai";
import { getSector3FreeTierSpec } from "@/lib/billing/sector3-tool-pricing";
import type { ToolHandler } from "../types";

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
export const handler: ToolHandler = async (_tool, params) => {
  const leadMessage = typeof params.lead_message === "string" ? params.lead_message.trim() : "";
  const context = typeof params.context === "string" ? params.context.trim() : "";
  const toneRaw = typeof params.tone === "string" ? params.tone : "direct";
  const tone = (ALLOWED_TONES as readonly string[]).includes(toneRaw) ? toneRaw : "direct";

  if (!leadMessage) return { status: "invalid_input", message: "lead_message is required." };
  if (!context) return { status: "invalid_input", message: "context is required." };

  const freeTier = getSector3FreeTierSpec(TOOL_SLUG);
  const systemPrompt = `You are a customer service expert. Write a ${tone} customer service reply for a ${context} scenario. Be concise, empathetic, and professional. Return only the reply text.`;

  try {
    const reply = await generateReply(systemPrompt, leadMessage);
    return {
      status: "ok",
      data: { reply, tone, context },
      message: `Served from ReplyFlow's free tier (${freeTier.summary}). For higher volume or guaranteed capacity, call ni_replyflow_subscribe.`,
    };
  } catch (err) {
    return {
      status: "unavailable",
      message: err instanceof Error ? err.message : "ReplyFlow generation failed. Try again shortly.",
    };
  }
};
