import { NextRequest, NextResponse } from "next/server";
import { callReplyFlowEdge } from "@/lib/replyflow/replyflow-edge";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();
    if (authError || !session?.access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, tone, scenario } = await req.json();
    if (!message || !tone || !scenario) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const result = await callReplyFlowEdge<{ reply?: string; usage?: unknown; error?: string }>(
      "generate",
      { message, tone, scenario },
      { accessToken: session.access_token }
    );

    if (!result.ok) {
      return NextResponse.json(
        { error: result.data.error ?? "Generation failed" },
        { status: result.status }
      );
    }

    return NextResponse.json({
      reply: result.data.reply,
      usage: result.data.usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
