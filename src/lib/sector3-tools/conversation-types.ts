export interface Sector3Conversation {
  id: string;
  toolSlug: string;
  title: string;
  archivedAt: string | null;
  archiveExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sector3ChatMessageRow {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}
