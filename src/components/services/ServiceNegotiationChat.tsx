"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { formatCents } from "@/lib/services/pricing-engine";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ServiceNegotiationChatProps {
  isOpen: boolean;
  onClose: () => void;
  quoteId: string;
  serviceName: string;
  initialPriceCents: number;
  floorPriceCents: number;
  onAccept: (priceCents: number) => void;
}

export function ServiceNegotiationChat({
  isOpen,
  onClose,
  quoteId,
  serviceName,
  initialPriceCents,
  floorPriceCents,
  onAccept,
}: ServiceNegotiationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [offeredPriceCents, setOfferedPriceCents] = useState<number | null>(null);
  const [canContinue, setCanContinue] = useState(false);
  const [isFinalOffer, setIsFinalOffer] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (isOpen) {
      setMessages([]);
      setInput("");
      setOfferedPriceCents(null);
      setCanContinue(false);
      setIsFinalOffer(false);
      setHasSubmitted(false);
      setError("");
    }
  }, [isOpen]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/services/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, message: userMsg }),
      });

      const data = (await res.json()) as {
        assistantMessage?: string;
        offeredPriceCents?: number;
        canContinue?: boolean;
        isFinalOffer?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setError(data.error ?? "Negotiation failed");
        return;
      }

      if (data.assistantMessage) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.assistantMessage! }]);
      }
      if (data.offeredPriceCents) setOfferedPriceCents(data.offeredPriceCents);
      setCanContinue(data.canContinue ?? false);
      setIsFinalOffer(data.isFinalOffer ?? false);
      setHasSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleContinue() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/services/negotiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quoteId, message: "", action: "continue" }),
      });
      const data = (await res.json()) as {
        assistantMessage?: string;
        offeredPriceCents?: number;
        canContinue?: boolean;
        isFinalOffer?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Failed to continue negotiation");
        return;
      }
      if (data.assistantMessage) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.assistantMessage! }]);
      }
      if (data.offeredPriceCents) setOfferedPriceCents(data.offeredPriceCents);
      setCanContinue(data.canContinue ?? false);
      setIsFinalOffer(data.isFinalOffer ?? false);
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  function handleAccept() {
    if (offeredPriceCents) {
      onAccept(offeredPriceCents);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="negotiation-chat-title"
        className="glass-panel relative z-10 flex h-[min(600px,90vh)] w-full max-w-lg flex-col"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ni-cyan/60">
              Price Negotiation
            </p>
            <h2 id="negotiation-chat-title" className="text-lg font-semibold text-white">
              {serviceName}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-ni-muted transition hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!hasSubmitted && (
            <div className="mb-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <p className="text-sm text-ni-muted">
                Your current quote is <span className="font-medium text-white">{formatCents(initialPriceCents)}</span>.
                Tell us why you need a lower price — we evaluate every request based on profitability,
                project worth, demand, and your budget alignment.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-cyan-500/15 text-cyan-100"
                      : "border border-white/10 bg-white/5 text-ni-muted"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-ni-muted">
                  Thinking…
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        {error && (
          <p className="mx-5 mb-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        {hasSubmitted && (
          <div className="border-t border-white/10 px-5 py-3">
            {offeredPriceCents ? (
              <>
                <p className="mb-3 text-center text-lg font-semibold text-cyan-300">
                  Offered: {formatCents(offeredPriceCents)}
                </p>
                <div className="flex gap-2">
                  {canContinue && !isFinalOffer && (
                    <button
                      type="button"
                      onClick={handleContinue}
                      disabled={loading}
                      className="flex-1 rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
                    >
                      Continue Negotiation
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleAccept}
                    className="flex-1 rounded-xl border border-cyan-500/40 bg-cyan-500/15 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/25"
                  >
                    Accept
                  </button>
                </div>
              </>
            ) : (
              canContinue &&
              !isFinalOffer && (
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={loading}
                  className="w-full rounded-xl border border-white/15 bg-white/5 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 disabled:opacity-50"
                >
                  Continue Negotiation
                </button>
              )
            )}
            {isFinalOffer && (
              <p className="mt-2 text-center text-xs text-ni-muted">
                This is our final offer. Need more help?{" "}
                <a href="mailto:support@northsideintelligence.com" className="text-cyan-300 hover:underline">
                  Contact Support
                </a>
              </p>
            )}
          </div>
        )}

        {!hasSubmitted && (
          <form onSubmit={handleSubmit} className="border-t border-white/10 p-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell us about your budget situation…"
                className="flex-1 rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
