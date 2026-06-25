import "server-only";

import { createSector3ServiceClient } from "@/lib/sector3-tools/service-client";
import type { Sector3ToolSlug } from "@/lib/sector3-registry";
import type {
  Sector3ChatMessageRow,
  Sector3Conversation,
} from "@/lib/sector3-tools/conversation-types";

export type { Sector3ChatMessageRow, Sector3Conversation };

const ARCHIVE_DAYS = 7;

function mapConversation(row: Record<string, unknown>): Sector3Conversation {
  return {
    id: String(row.id),
    toolSlug: String(row.tool_slug),
    title: String(row.title),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    archiveExpiresAt: row.archive_expires_at ? String(row.archive_expires_at) : null,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapMessage(row: Record<string, unknown>): Sector3ChatMessageRow {
  return {
    id: String(row.id),
    conversationId: String(row.conversation_id),
    role: row.role as "user" | "assistant",
    content: String(row.content),
    createdAt: String(row.created_at),
  };
}

export async function listConversations(
  userId: string,
  toolSlug: Sector3ToolSlug
): Promise<Sector3Conversation[]> {
  const admin = await createSector3ServiceClient();
  const { data } = await admin
    .from("sector3_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((row) => mapConversation(row as Record<string, unknown>));
}

export async function listArchivedConversations(
  userId: string,
  toolSlug: Sector3ToolSlug
): Promise<Sector3Conversation[]> {
  const admin = await createSector3ServiceClient();
  const { data } = await admin
    .from("sector3_conversations")
    .select("*")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false })
    .limit(20);

  return (data ?? []).map((row) => mapConversation(row as Record<string, unknown>));
}

export async function createConversation(
  userId: string,
  toolSlug: Sector3ToolSlug,
  title = "New Chat"
): Promise<Sector3Conversation | null> {
  const admin = await createSector3ServiceClient();
  const { data, error } = await admin
    .from("sector3_conversations")
    .insert({
      user_id: userId,
      tool_slug: toolSlug,
      title: title.slice(0, 120),
    })
    .select("*")
    .single();

  if (error || !data) return null;
  return mapConversation(data as Record<string, unknown>);
}

export async function getConversationMessages(
  userId: string,
  conversationId: string
): Promise<Sector3ChatMessageRow[]> {
  const admin = await createSector3ServiceClient();

  const { data: conv } = await admin
    .from("sector3_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!conv) return [];

  const { data } = await admin
    .from("sector3_chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100);

  return (data ?? []).map((row) => mapMessage(row as Record<string, unknown>));
}

export async function appendChatMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<void> {
  const admin = await createSector3ServiceClient();
  await admin.from("sector3_chat_messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });
  await admin
    .from("sector3_conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function deleteConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const admin = await createSector3ServiceClient();
  const { error } = await admin
    .from("sector3_conversations")
    .delete()
    .eq("id", conversationId)
    .eq("user_id", userId);
  return !error;
}

export async function archiveConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const admin = await createSector3ServiceClient();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ARCHIVE_DAYS);

  const { error } = await admin
    .from("sector3_conversations")
    .update({
      archived_at: new Date().toISOString(),
      archive_expires_at: expiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId);

  return !error;
}

export async function reviveConversation(
  userId: string,
  conversationId: string
): Promise<boolean> {
  const admin = await createSector3ServiceClient();
  const { error } = await admin
    .from("sector3_conversations")
    .update({
      archived_at: null,
      archive_expires_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId)
    .eq("user_id", userId);

  return !error;
}

export async function purgeExpiredArchivedConversations(): Promise<number> {
  const admin = await createSector3ServiceClient();
  const { data, error } = await admin
    .from("sector3_conversations")
    .delete()
    .not("archived_at", "is", null)
    .lt("archive_expires_at", new Date().toISOString())
    .select("id");

  if (error) return 0;
  return data?.length ?? 0;
}

export async function updateUserContext(
  userId: string,
  toolSlug: Sector3ToolSlug,
  patch: Record<string, unknown>
): Promise<void> {
  const admin = await createSector3ServiceClient();

  const { data: existing } = await admin
    .from("sector3_user_context")
    .select("context_data")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .maybeSingle();

  const prior = (existing?.context_data as Record<string, unknown>) ?? {};
  const merged = mergeContext(prior, patch);

  await admin.from("sector3_user_context").upsert(
    {
      user_id: userId,
      tool_slug: toolSlug,
      context_data: merged,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,tool_slug" }
  );
}

function mergeContext(
  prior: Record<string, unknown>,
  patch: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...prior };

  for (const [key, value] of Object.entries(patch)) {
    if (key === "fieldUsage" && typeof value === "object" && value !== null) {
      const priorUsage = (result.fieldUsage as Record<string, number>) ?? {};
      const newUsage = value as Record<string, number>;
      result.fieldUsage = { ...priorUsage };
      for (const [field, count] of Object.entries(newUsage)) {
        result.fieldUsage = {
          ...(result.fieldUsage as Record<string, number>),
          [field]: ((result.fieldUsage as Record<string, number>)[field] ?? 0) + count,
        };
      }
    } else if (key === "recentTopics" && Array.isArray(value)) {
      const priorTopics = Array.isArray(result.recentTopics)
        ? (result.recentTopics as string[])
        : [];
      result.recentTopics = [...value, ...priorTopics].slice(0, 20);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export async function getUserContext(
  userId: string,
  toolSlug: Sector3ToolSlug
): Promise<Record<string, unknown>> {
  const admin = await createSector3ServiceClient();
  const { data } = await admin
    .from("sector3_user_context")
    .select("context_data")
    .eq("user_id", userId)
    .eq("tool_slug", toolSlug)
    .maybeSingle();

  return (data?.context_data as Record<string, unknown>) ?? {};
}
