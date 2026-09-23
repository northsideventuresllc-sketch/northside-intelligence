import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { handlers } from "./registry";
import { logIngress } from "./ingress-log";
import type { ManifestTool, ToolResult } from "./types";

export async function runTool(tool: ManifestTool, params: Record<string, unknown>, req: NextRequest, naturalQuery?: string): Promise<ToolResult> {
  const engine = req.headers.get("x-agent-engine") || req.headers.get("user-agent") || "unknown_agent";
  const signature = req.headers.get("x-agent-signature") || "unsigned";
  let supabase: ReturnType<typeof createServiceClient> | null = null;
  try {
    supabase = createServiceClient();
  } catch (err) {
    console.warn("[webmcp] service client unavailable:", (err as Error).message);
  }
  const ctx = { engine, signature, req, supabase, naturalQuery };
  const handler = handlers[tool.name];
  let result: ToolResult;
  try {
    result = handler ? await handler(tool, params, ctx) : { status: "unavailable", message: `${tool.name} is not available yet.` };
  } catch (err) {
    console.error(`[webmcp] ${tool.name} failed:`, err);
    result = { status: "unavailable", message: `${tool.name} failed to run. Try again later.` };
  }
  await logIngress(tool, params, ctx, result);
  return result;
}
