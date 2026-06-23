import { NextRequest, NextResponse } from "next/server";
import { runServiceAssistantChat } from "@/lib/services/assistant/chat";
import type { ServiceAssistantMessage } from "@/lib/services/assistant/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AssistantRequestBody {
  messages?: ServiceAssistantMessage[];
}

function sanitizeMessages(raw: unknown): ServiceAssistantMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ServiceAssistantMessage[] = [];
  for (const entry of raw.slice(-20)) {
    if (!entry || typeof entry !== "object") continue;
    const role = (entry as ServiceAssistantMessage).role;
    const content = String((entry as ServiceAssistantMessage).content ?? "").trim();
    if ((role !== "user" && role !== "assistant") || !content) continue;
    out.push({ role, content: content.slice(0, 2000) });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    let body: AssistantRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const messages = sanitizeMessages(body.messages);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return NextResponse.json({ error: "A message is required." }, { status: 400 });
    }

    const result = await runServiceAssistantChat(messages);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[services/assistant]", err);
    const message = err instanceof Error ? err.message : "Assistant unavailable";
    if (/not configured|api key|401|unauthorized/i.test(message)) {
      return NextResponse.json(
        { error: "Services assistant is temporarily unavailable." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Assistant request failed." }, { status: 500 });
  }
}
