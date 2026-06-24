"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { getSector3ToolChatConfig } from "@/lib/sector3-tools/chat-content";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  slug: string;
  brandColor: string;
  open: boolean;
  onClose: () => void;
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
  context,
}: Props) {
  const config = getSector3ToolChatConfig(slug);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && config?.welcomeMessage) {
      setMessages([{ role: "assistant", content: config.welcomeMessage }]);
      setInput("");
      setError("");
    }
  }, [open, config?.welcomeMessage]);

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
  }, [open]);

  if (!open || !config?.enabled) return null;

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    const res = await fetch(`/api/sector3/${slug}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: nextMessages, context }),
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

      <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#0c0e14]/95 shadow-2xl backdrop-blur-xl">
        <div
          className="flex items-center justify-between border-b border-white/10 px-5 py-4"
          style={{ background: `linear-gradient(to right, ${brandColor}18, transparent)` }}
        >
          <div>
            <h2 id="sector3-chat-title" className="text-lg font-semibold text-white">
              {config.modalTitle}
            </h2>
            <p className="text-xs text-white/45">Context from your latest run</p>
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
  );
}
