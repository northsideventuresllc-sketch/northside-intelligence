import { NextRequest, NextResponse } from "next/server";
import type { Sector3ToolSlug } from "@/lib/sector3-registry";
import { runSector3ToolChat, type Sector3ChatMessage } from "@/lib/sector3-tools/chat";
import { isSector3ChatEnabled } from "@/lib/sector3-tools/chat-content";
import { isValidSector3HelpSlug } from "@/lib/sector3-tools/help-content";
import {
  appendChatMessage,
  updateUserContext,
} from "@/lib/sector3-tools/conversations";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidSector3HelpSlug(slug)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
  }

  if (!isSector3ChatEnabled(slug)) {
    return NextResponse.json({ error: "Chat not available for this tool" }, { status: 404 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    messages?: Sector3ChatMessage[];
    context?: {
      inputs?: Record<string, string>;
      result?: string;
      extra?: Record<string, unknown>;
    };
    conversationId?: string;
  };

  const messages = body.messages ?? [];
  if (messages.length === 0 || messages.length > 20) {
    return NextResponse.json({ error: "Invalid message history" }, { status: 400 });
  }

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return NextResponse.json({ error: "Last message must be from user" }, { status: 400 });
  }

  if (last.content.length > 1000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  try {
    const reply = await runSector3ToolChat(
      slug as Sector3ToolSlug,
      messages,
      body.context ?? {}
    );

    if (body.conversationId) {
      await appendChatMessage(body.conversationId, "user", last.content);
      await appendChatMessage(body.conversationId, "assistant", reply);
    }

    await updateUserContext(user.id, slug as Sector3ToolSlug, {
      recentChatTopics: [last.content.slice(0, 80)],
      lastChatAt: new Date().toISOString(),
    });

    return NextResponse.json({ message: reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
