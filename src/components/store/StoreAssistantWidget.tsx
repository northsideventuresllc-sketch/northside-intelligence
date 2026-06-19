"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import type { CatalogProductView } from "@/lib/store/catalog/types";
import { AssistantProductCard } from "@/components/store/AssistantProductCard";
import { SMART_STORE_NAME } from "@/lib/store/branding";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  recommendations?: CatalogProductView[];
}

const QUICK_PROMPTS = [
  "Gift ideas under $30",
  "Kitchen gadgets",
  "Pet supplies",
  "Fitness gear",
] as const;

const WELCOME_MESSAGE = `Hi — I'm your ${SMART_STORE_NAME} assistant. Tell me what you're looking for (who it's for, budget, or vibe) and I'll recommend products from our catalog.`;

export function StoreAssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: WELCOME_MESSAGE },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  useEffect(() => {
    if (open) {
      const timer = window.setTimeout(() => inputRef.current?.focus(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [open]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/store/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = (await res.json()) as {
        message?: string;
        recommendations?: CatalogProductView[];
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Assistant unavailable");
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message ?? "Here are some options for you.",
          recommendations: data.recommendations,
        },
      ]);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void sendMessage(input);
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col items-start gap-3">
      {open && (
        <div
          className="glass-panel flex w-[min(100vw-2rem,380px)] flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          role="dialog"
          aria-label={`${SMART_STORE_NAME} assistant`}
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-white">Shopping Assistant</p>
              <p className="text-[11px] text-ni-muted">Powered by Northside Intelligence</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-2 py-1 text-sm text-ni-muted transition hover:bg-white/5 hover:text-white"
              aria-label="Close assistant"
            >
              Close
            </button>
          </div>

          <div className="flex max-h-[min(60vh,420px)] flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex flex-col gap-2 ${message.role === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[92%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "bg-cyan-500/20 text-white"
                      : "border border-white/10 bg-ni-navy/70 text-white/90"
                  }`}
                >
                  {message.content}
                </div>
                {message.recommendations && message.recommendations.length > 0 && (
                  <div className="flex w-full flex-col gap-2">
                    {message.recommendations.map((product) => (
                      <AssistantProductCard key={product.slug} product={product} />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-sm text-ni-muted">
                <span className="inline-flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:240ms]" />
                </span>
                Finding picks…
              </div>
            )}

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            )}

            <div ref={bottomRef} />
          </div>

          {!loading && messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-white/5 px-4 py-3">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void sendMessage(prompt)}
                  className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] font-medium text-cyan-200 transition hover:border-cyan-400/40"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What are you looking for?"
                disabled={loading}
                className="min-w-0 flex-1 rounded-xl border border-white/10 bg-ni-bg/80 px-3 py-2 text-sm text-white placeholder:text-ni-muted focus:border-cyan-400/40 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-xl border border-cyan-500/30 bg-cyan-500/15 px-3 py-2 text-sm font-medium text-cyan-200 transition hover:border-cyan-400/50 hover:bg-cyan-500/25 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-ni-navy/90 px-4 py-3 text-sm font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:border-cyan-400/50 hover:bg-ni-navy"
        aria-expanded={open}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300">
          ✦
        </span>
        {open ? "Hide Assistant" : "Ask Assistant"}
      </button>
    </div>
  );
}
