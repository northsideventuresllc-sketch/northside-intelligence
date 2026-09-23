import type { ManifestTool, ToolContext, ToolResult } from "./types";

/** Best-effort audit trail of every tool call. Never blocks or alters the response. */
export async function logIngress(tool: ManifestTool, params: Record<string, unknown>, ctx: ToolContext, result: ToolResult) {
  if (!ctx.supabase) return;
  try {
    const { data: acct } = await ctx.supabase.from("axon_accounts").select("id").limit(1).maybeSingle();
    if (!acct?.id) return;
    await ctx.supabase.from("axon_agent_messages").insert({
      account_id: acct.id,
      thread: "webmcp_ingress",
      sender: ctx.engine,
      content: ctx.naturalQuery || `WebMCP call: ${tool.name}`,
      meta: { tool_name: tool.name, parameters: params, engine: ctx.engine, signature: ctx.signature, result_status: result.status, timestamp: new Date().toISOString() },
    });
  } catch (err) {
    console.warn("[webmcp] ingress log failed:", (err as Error).message);
  }
}
