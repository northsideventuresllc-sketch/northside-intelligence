"use client";

import { useState } from "react";
import type { Sector3ClarifyingQuestion } from "@/lib/sector3-tools/clarification";

interface Props {
  questions: Sector3ClarifyingQuestion[];
  answers: Record<string, string[]>;
  onAnswersChange: (answers: Record<string, string[]>) => void;
  onContinue: () => void;
  onBack: () => void;
  loading?: boolean;
  brandColor: string;
}

export function Sector3ClarificationPanel({
  questions,
  answers,
  onAnswersChange,
  onContinue,
  onBack,
  loading = false,
  brandColor,
}: Props) {
  const [customInputs, setCustomInputs] = useState<Record<string, string>>({});

  function toggleOption(questionId: string, label: string, allowMultiple: boolean) {
    const current = answers[questionId] ?? [];
    const exists = current.includes(label);
    let next: string[];

    if (allowMultiple) {
      next = exists ? current.filter((v) => v !== label) : [...current, label];
    } else {
      next = exists ? [] : [label];
    }

    onAnswersChange({ ...answers, [questionId]: next });
  }

  function addCustomAnswer(questionId: string) {
    const custom = customInputs[questionId]?.trim();
    if (!custom) return;
    const current = answers[questionId] ?? [];
    if (current.includes(custom)) return;
    onAnswersChange({ ...answers, [questionId]: [...current, custom] });
    setCustomInputs({ ...customInputs, [questionId]: "" });
  }

  const hasAnyAnswer = questions.some((q) => (answers[q.id]?.length ?? 0) > 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm font-medium text-white/80">
          Your prompt needs a bit more context. Answer these questions so we can generate a better
          result. Select all that apply, or type your own answer.
        </p>
      </div>

      {questions.map((q) => (
        <div key={q.id} className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="mb-3 text-sm font-semibold text-white">{q.question}</p>
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => {
              const selected = (answers[q.id] ?? []).includes(opt.label);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOption(q.id, opt.label, q.allowMultiple)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    selected
                      ? "border-transparent text-[#07080C]"
                      : "border-white/15 bg-white/5 text-white/80 hover:border-white/25"
                  }`}
                  style={selected ? { backgroundColor: brandColor } : undefined}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              type="text"
              value={customInputs[q.id] ?? ""}
              onChange={(e) => setCustomInputs({ ...customInputs, [q.id]: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomAnswer(q.id);
                }
              }}
              placeholder={q.placeholder ?? "Or type your own answer…"}
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-white/25"
            />
            <button
              type="button"
              onClick={() => addCustomAnswer(q.id)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10"
            >
              Add
            </button>
          </div>
          {(answers[q.id]?.length ?? 0) > 0 && (
            <p className="mt-2 text-xs text-white/45">
              Selected: {(answers[q.id] ?? []).join(", ")}
            </p>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/90 hover:bg-white/10"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={loading || !hasAnyAnswer}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#07080C] transition disabled:opacity-40"
          style={{ backgroundColor: brandColor }}
        >
          {loading ? "Generating…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
