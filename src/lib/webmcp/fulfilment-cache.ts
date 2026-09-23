import type { ToolContext } from "./types";

// Cached fulfilment results live in axon_agent_messages (thread webmcp_fulfilment), keyed by order_id.
export async function getCachedFulfilment(ctx: ToolContext, orderId: string): Promise<Record<string, unknown> | null> {
  if (!ctx.supabase) return null;
  const { data } = await ctx.supabase
    .from("axon_agent_messages")
    .select("meta")
    .eq("thread", "webmcp_fulfilment")
    .eq("meta->>order_id", orderId)
    .limit(1)
    .maybeSingle();
  return (data?.meta as { result?: Record<string, unknown> } | null)?.result ?? null;
}

export async function saveFulfilment(ctx: ToolContext, orderId: string, tool: string, result: Record<string, unknown>) {
  if (!ctx.supabase) return;
  const { data: acct } = await ctx.supabase.from("axon_accounts").select("id").limit(1).maybeSingle();
  if (!acct?.id) return;
  await ctx.supabase.from("axon_agent_messages").insert({
    account_id: acct.id,
    thread: "webmcp_fulfilment",
    sender: "webmcp",
    content: `Fulfilled ${tool} order`,
    meta: { order_id: orderId, tool, result },
  });
}
