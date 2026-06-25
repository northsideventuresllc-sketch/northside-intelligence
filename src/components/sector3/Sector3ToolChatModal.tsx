"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { getSector3ToolChatConfig } from "@/lib/sector3-tools/chat-content";
import type { Sector3Conversation } from "@/lib/sector3-tools/conversation-types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  slug: string;
  brandColor: string;
  open: boolean;
  onClose: () => void;
  newChatTrigger?: number;
  context: {
    inputs?: Record<string, string>;
    result?: string;
    extra?: Record<string, unknown>;
  };
}

export function Sector3ToolChatModal({
  slug,
  brandColor,
  open,
  onClose,
  newChatTrigger = 0,
  context,
}: Props) {
  const config = getSector3ToolChatConfig(slug);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversations, setConversations] = useState<Sector3Conversation[]>([]);
  const [archived, setArchived] = useState<Sector3Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(async () => {
    const res = await fetch(`/api/sector3/${slug}/conversations`);
    if (!res.ok) return;
    const data = (await res.json()) as { conversations?: Sector3Conversation[] };
    setConversations(data.conversations ?? []);
  }, [slug]);

  const loadArchived = useCallback(async () => {
    const res = await fetch(`/api/sector3/${slug}/conversations?archived=1`);
    if (!res.ok) return;
    const data = (await res.json()) as { conversations?: Sector3Conversation[] };
    setArchived(data.conversations ?? []);
  }, [slug]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const res = await fetch(
      `/api/sector3/${slug}/conversations?conversationId=${conversationId}`
    );
    if (!res.ok) return;
    const data = (await res.json()) as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
    };
    const loaded = (data.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));
    if (loaded.length === 0 && config?.welcomeMessage) {
      setMessages([{ role: "assistant", content: config.welcomeMessage }]);
    } else {
      setMessages(loaded);
    }
  }, [slug, config?.welcomeMessage]);

  const startNewChat = useCallback(async () => {
    const res = await fetch(`/api/sector3/${slug}/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Chat" }),
    });
    const data = (await res.json()) as { conversation?: Sector3Conversation };
    if (data.conversation) {
      setActiveConversationId(data.conversation.id);
      setMessages(
        config?.welcomeMessage
          ? [{ role: "assistant", content: config.welcomeMessage }]
          : []
      );
      void loadConversations();
    }
  }, [slug, config?.welcomeMessage, loadConversations]);

  useEffect(() => {
    if (!open) return;
    void loadConversations();
    void loadArchived();
  }, [open, loadConversations, loadArchived]);

  useEffect(() => {
    if (!open) return;
    if (newChatTrigger > 0) {
      void startNewChat();
    }
  }, [newChatTrigger, open, startNewChat]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [open, activeConversationId]);

  if (!open || !config?.enabled) return null;

  async function selectConversation(id: string) {
    setActiveConversationId(id);
    setError("");
    await loadMessages(id);
  }

  async function handleArchive(conversationId: string) {
    await fetch(`/api/sector3/${slug}/conversations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, action: "archive" }),
    });
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    void loadConversations();
    void loadArchived();
  }

  async function handleRevive(conversationId: string) {
    await fetch(`/api/sector3/${slug}/conversations`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId, action: "revive" }),
    });
    void loadConversations();
    void loadArchived();
  }

  async function handleDelete(conversationId: string) {
    await fetch(`/api/sector3/${slug}/conversations?conversationId=${conversationId}`, {
      method: "DELETE",
    });
    if (activeConversationId === conversationId) {
      setActiveConversationId(null);
      setMessages([]);
    }
    void loadConversations();
    void loadArchived();
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    let conversationId = activeConversationId;
    if (!conversationId) {
      const res = await fetch(`/api/sector3/${slug}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed.slice(0, 60) }),
      });
      const data = (await res.json()) as { conversation?: Sector3Conversation };
      if (!data.conversation) {
        setError("Could not start conversation");
        return;
      }
      conversationId = data.conversation.id;
      setActiveConversationId(conversationId);
      void loadConversations();
    }

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    const res = await fetch(`/api/sector3/${slug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: nextMessages,
        context,
        conversationId,
      }),
    });

    const data = (await res.json().catch(() => ({}))) as {
      message?: string;
      error?: string;
    };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Chat unavailable");
      return;
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: data.message ?? "Here is my take." },
    ]);
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  const list = showArchived ? archived : conversations;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sector3-chat-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close chat"
        onClick={onClose}
      />

      <div className="relative z-10 flex max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e14]/95 shadow-2xl backdrop-blur-xl">
        <aside className="hidden w-48 shrink-0 flex-col border-r border-white/10 sm:flex">
          <div className="border-b border-white/10 p-3">
            <button
              type="button"
              onClick={() => void startNewChat()}
              className="w-full rounded-xl px-3 py-2 text-xs font-semibold text-[#07080C]"
              style={{ backgroundColor: brandColor }}
            >
              New Chat
            </button>
          </div>
          <div className="flex gap-1 border-b border-white/10 p-2">
            <button
              type="button"
              onClick={() => setShowArchived(false)}
              className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                !showArchived ? "bg-white/10 text-white" : "text-white/40"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setShowArchived(true)}
              className={`flex-1 rounded-lg px-2 py-1 text-[10px] font-semibold ${
                showArchived ? "bg-white/10 text-white" : "text-white/40"
              }`}
            >
              Archived
            </button>
          </div>
          <ul className="flex-1 space-y-1 overflow-y-auto p-2">
            {list.map((conv) => (
              <li key={conv.id} className="group relative">
                <button
                  type="button"
                  onClick={() => void selectConversation(conv.id)}
                  className={`w-full truncate rounded-lg px-2 py-2 text-left text-xs ${
                    activeConversationId === conv.id
                      ? "bg-white/10 text-white"
                      : "text-white/60 hover:bg-white/5"
                  }`}
                >
                  {conv.title}
                </button>
                <div className="absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
                  {showArchived ? (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleRevive(conv.id)}
                        className="rounded bg-white/10 px-1 text-[9px] text-cyan-200"
                        title="Revive"
                      >
                        ↩
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(conv.id)}
                        className="rounded bg-white/10 px-1 text-[9px] text-red-300"
                        title="Delete"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => void handleArchive(conv.id)}
                        className="rounded bg-white/10 px-1 text-[9px] text-white/60"
                        title="Archive (auto-deletes in 7 days)"
                      >
                        ⊟
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDelete(conv.id)}
                        className="rounded bg-white/10 px-1 text-[9px] text-red-300"
                        title="Delete"
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="flex items-center justify-between border-b border-white/10 px-5 py-4"
            style={{ background: `linear-gradient(to right, ${brandColor}18, transparent)` }}
          >
            <div>
              <h2 id="sector3-chat-title" className="text-lg font-semibold text-white">
                {config.modalTitle}
              </h2>
              <p className="text-xs text-white/45">
                {showArchived
                  ? "Archived chats delete in 7 days unless revived"
                  : "Context from your latest run"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg, i) => (
              <div
                key={`${msg.role}-${i}`}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "text-[#07080C]"
                      : "border border-white/10 bg-white/5 text-white/85"
                  }`}
                  style={
                    msg.role === "user"
                      ? { backgroundColor: brandColor }
                      : undefined
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/50">
                  Thinking…
                </div>
              </div>
            )}
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div ref={bottomRef} />
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={config.inputPlaceholder}
                disabled={loading}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#07080C] transition disabled:opacity-40"
                style={{ backgroundColor: brandColor }}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
