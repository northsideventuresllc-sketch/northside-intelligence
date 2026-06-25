import { NextRequest, NextResponse } from "next/server";
import type { Sector3ToolSlug } from "@/lib/sector3-registry";
import {
  archiveConversation,
  createConversation,
  deleteConversation,
  getConversationMessages,
  listArchivedConversations,
  listConversations,
  reviveConversation,
} from "@/lib/sector3-tools/conversations";
import { isValidSector3HelpSlug } from "@/lib/sector3-tools/help-content";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidSector3HelpSlug(slug)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const archived = req.nextUrl.searchParams.get("archived") === "1";
  const conversationId = req.nextUrl.searchParams.get("conversationId");

  if (conversationId) {
    const messages = await getConversationMessages(user.id, conversationId);
    return NextResponse.json({ messages });
  }

  const conversations = archived
    ? await listArchivedConversations(user.id, slug as Sector3ToolSlug)
    : await listConversations(user.id, slug as Sector3ToolSlug);

  return NextResponse.json({ conversations });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidSector3HelpSlug(slug)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { title?: string };
  const conversation = await createConversation(
    user.id,
    slug as Sector3ToolSlug,
    body.title ?? "New Chat"
  );

  if (!conversation) {
    return NextResponse.json({ error: "Could not create conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversation });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidSector3HelpSlug(slug)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    conversationId?: string;
    action?: "archive" | "revive";
  };

  if (!body.conversationId || !body.action) {
    return NextResponse.json({ error: "conversationId and action required" }, { status: 400 });
  }

  const ok =
    body.action === "archive"
      ? await archiveConversation(user.id, body.conversationId)
      : await reviveConversation(user.id, body.conversationId);

  if (!ok) {
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const slug = params.slug;
  if (!isValidSector3HelpSlug(slug)) {
    return NextResponse.json({ error: "Unknown tool" }, { status: 404 });
  }

  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const conversationId = req.nextUrl.searchParams.get("conversationId");
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId required" }, { status: 400 });
  }

  const ok = await deleteConversation(user.id, conversationId);
  if (!ok) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
