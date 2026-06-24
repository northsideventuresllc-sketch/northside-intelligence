"use client";

import { useEffect, useState } from "react";
import type { Sector3ToolHelpFaq } from "@/lib/sector3-tools/help-content";

interface Props {
  slug: string;
  displayName: string;
  brandColor: string;
  faqs: Sector3ToolHelpFaq[];
  open: boolean;
  onClose: () => void;
}

type View = "list" | "faq" | "other" | "other-result";

export function Sector3ToolHelpModal({
  slug,
  displayName,
  brandColor,
  faqs,
  open,
  onClose,
}: Props) {
  const [view, setView] = useState<View>("list");
  const [selectedFaq, setSelectedFaq] = useState<Sector3ToolHelpFaq | null>(null);
  const [customQuestion, setCustomQuestion] = useState("");
  const [customAnswer, setCustomAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setView("list");
      setSelectedFaq(null);
      setCustomQuestion("");
      setCustomAnswer("");
      setError("");
      setLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleAskOther() {
    if (!customQuestion.trim()) return;
    setLoading(true);
    setError("");
    setCustomAnswer("");

    const res = await fetch(`/api/sector3/${slug}/help`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: customQuestion.trim() }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      answer?: string;
      error?: string;
    };
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Could not get an answer");
      return;
    }

    setCustomAnswer(data.answer ?? "");
    setView("other-result");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sector3-help-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Close help"
        onClick={onClose}
      />

      <div className="relative z-10 max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-white/10 bg-[#0c0e14]/95 p-6 shadow-2xl backdrop-blur-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id="sector3-help-title" className="text-lg font-semibold text-white">
              {displayName} Help
            </h2>
            <p className="mt-1 text-sm text-white/50">
              {view === "list" && "Common questions about this tool"}
              {view === "faq" && selectedFaq?.question}
              {view === "other" && "Ask anything about this tool"}
              {view === "other-result" && "Answer"}
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

        {view === "list" && (
          <div className="space-y-2">
            {faqs.map((faq) => (
              <button
                key={faq.question}
                type="button"
                onClick={() => {
                  setSelectedFaq(faq);
                  setView("faq");
                }}
                className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-white/90 transition hover:border-white/20 hover:bg-white/10"
              >
                {faq.question}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setView("other")}
              className="w-full rounded-2xl border border-dashed p-4 text-left text-sm font-medium transition hover:bg-white/5"
              style={{ borderColor: `${brandColor}66`, color: brandColor }}
            >
              Other — Ask a Custom Question
            </button>
          </div>
        )}

        {view === "faq" && selectedFaq && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
              {selectedFaq.answer}
            </p>
            <button
              type="button"
              onClick={() => {
                setView("list");
                setSelectedFaq(null);
              }}
              className="text-sm font-medium transition hover:opacity-80"
              style={{ color: brandColor }}
            >
              Back to Questions
            </button>
          </div>
        )}

        {view === "other" && (
          <div className="space-y-4">
            <textarea
              value={customQuestion}
              onChange={(e) => setCustomQuestion(e.target.value)}
              rows={4}
              placeholder="Type your question…"
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/25"
            />
            {error && <p className="text-sm text-rose-400">{error}</p>}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setView("list")}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleAskOther}
                disabled={loading || !customQuestion.trim()}
                className="flex-1 rounded-2xl px-5 py-2.5 text-sm font-semibold text-[#07080C] transition disabled:opacity-50"
                style={{ backgroundColor: brandColor }}
              >
                {loading ? "Thinking…" : "Get Answer"}
              </button>
            </div>
          </div>
        )}

        {view === "other-result" && (
          <div className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">
              {customAnswer}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setView("other");
                  setCustomAnswer("");
                }}
                className="rounded-2xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/10"
              >
                Ask Another
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className="text-sm font-medium transition hover:opacity-80"
                style={{ color: brandColor }}
              >
                Back to Questions
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface HelpButtonProps {
  onClick: () => void;
  brandColor: string;
}

export function Sector3ToolHelpButton({ onClick, brandColor }: HelpButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-bold transition hover:scale-105"
      style={{
        borderColor: `${brandColor}66`,
        color: brandColor,
        backgroundColor: `${brandColor}14`,
      }}
      aria-label="Open help"
      title="Help"
    >
      ?
    </button>
  );
}

interface FooterProps {
  summary: string;
  slug: string;
  displayName: string;
  brandColor: string;
  faqs: Sector3ToolHelpFaq[];
}

export function Sector3ToolDashboardFooter({
  summary,
  slug,
  displayName,
  brandColor,
  faqs,
}: FooterProps) {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <div
        className="flex items-start gap-4 rounded-2xl border border-white/10 p-5 backdrop-blur-xl"
        style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
      >
        <p className="flex-1 text-sm leading-relaxed text-white/55">{summary}</p>
        <Sector3ToolHelpButton onClick={() => setHelpOpen(true)} brandColor={brandColor} />
      </div>
      <Sector3ToolHelpModal
        slug={slug}
        displayName={displayName}
        brandColor={brandColor}
        faqs={faqs}
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
      />
    </>
  );
}
