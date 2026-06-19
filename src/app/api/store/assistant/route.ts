import { NextRequest, NextResponse } from "next/server";
import { runStoreAssistantChat } from "@/lib/store/assistant/chat";
import type { StoreAssistantMessage } from "@/lib/store/assistant/types";
import { ensureStoreEnv } from "@/lib/store/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface AssistantRequestBody {
  messages?: StoreAssistantMessage[];
}

function sanitizeMessages(raw: unknown): StoreAssistantMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: StoreAssistantMessage[] = [];
  for (const entry of raw.slice(-20)) {
    if (!entry || typeof entry !== "object") continue;
    const role = (entry as StoreAssistantMessage).role;
    const content = String((entry as StoreAssistantMessage).content ?? "").trim();
    if ((role !== "user" && role !== "assistant") || !content) continue;
    out.push({ role, content: content.slice(0, 2000) });
  }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    await ensureStoreEnv();

    let body: AssistantRequestBody;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const messages = sanitizeMessages(body.messages);
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) {
      return NextResponse.json({ error: "A shopper message is required." }, { status: 400 });
    }

    const result = await runStoreAssistantChat(messages);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[store/assistant]", err);
    const message = err instanceof Error ? err.message : "Assistant unavailable";
    if (/not configured|api key|401|unauthorized/i.test(message)) {
      return NextResponse.json(
        { error: "Shopping assistant is temporarily unavailable." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Assistant request failed." }, { status: 500 });
  }
}
