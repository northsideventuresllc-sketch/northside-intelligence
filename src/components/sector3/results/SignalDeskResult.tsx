"use client";

import { CopyResultButton } from "@/components/sector3/results/CopyResultButton";
import { RichParagraph } from "@/components/sector3/results/RichText";
import {
  findSection,
  parseListItems,
  parseMarkdownSections,
  splitParagraphs,
  stripInlineMarkdown,
} from "@/lib/sector3-tools/parse-result";

const URGENCY_STYLES = {
  high: {
    badge: "border-rose-400/40 bg-rose-500/15 text-rose-300",
    ring: "border-rose-400/30 shadow-[0_0_24px_rgba(244,63,94,0.15)]",
    dot: "bg-rose-400",
  },
  medium: {
    badge: "border-amber-400/40 bg-amber-500/15 text-amber-200",
    ring: "border-amber-400/30 shadow-[0_0_24px_rgba(251,191,36,0.12)]",
    dot: "bg-amber-400",
  },
  low: {
    badge: "border-sky-400/40 bg-sky-500/15 text-sky-200",
    ring: "border-sky-400/30 shadow-[0_0_24px_rgba(56,189,248,0.12)]",
    dot: "bg-sky-400",
  },
} as const;

interface Props {
  result: string;
  brandColor: string;
}

export function SignalDeskResult({ result, brandColor }: Props) {
  const sections = parseMarkdownSections(result);
  const summary = findSection(sections, "executive", "summary");
  const signals = findSection(sections, "priority", "signal");
  const actions = findSection(sections, "recommended", "action");
  const watch = findSection(sections, "watch");

  const signalItems =
    signals?.items.length ? signals.items : signals ? parseListItems(signals.body) : [];
  const actionItems =
    actions?.items.length ? actions.items : actions ? parseListItems(actions.body) : [];
  const watchItems =
    watch?.items.length ? watch.items : watch ? parseListItems(watch.body) : [];

  return (
    <div
      className="animate-bubble-in space-y-5 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
      style={{ boxShadow: `0 0 48px ${brandColor}22` }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
            style={{ backgroundColor: `${brandColor}22`, color: brandColor }}
          >
            ◉
          </span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Intelligence Brief
            </h2>
            <p className="text-xs text-white/45">Ranked signals and next moves</p>
          </div>
        </div>
        <CopyResultButton text={result} className="text-sky-300" />
      </div>

      {summary && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: `${brandColor}44`,
            background: `linear-gradient(135deg, ${brandColor}18, transparent)`,
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            Executive Summary
          </p>
          {splitParagraphs(summary.body).map((p) => (
            <RichParagraph key={p} text={p} className="text-sm text-white/85" />
          ))}
        </div>
      )}

      {signalItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Priority Signals
          </p>
          {signalItems.map((item, i) => {
            const urgency = item.urgency ?? (i === 0 ? "high" : i < 3 ? "medium" : "low");
            const styles = URGENCY_STYLES[urgency];
            return (
              <article
                key={`${item.raw}-${i}`}
                className={`rounded-2xl border bg-black/20 p-4 ${styles.ring}`}
              >
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-[#07080C]"
                    style={{ backgroundColor: brandColor }}
                  >
                    {item.rank ?? i + 1}
                  </span>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${styles.badge}`}
                  >
                    {urgency}
                  </span>
                  <span className={`h-2 w-2 rounded-full ${styles.dot}`} />
                </div>
                <p className="text-sm leading-relaxed text-white/85">{item.text}</p>
              </article>
            );
          })}
        </div>
      )}

      {actionItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Recommended Actions
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {actionItems.map((item, i) => (
              <div
                key={`${item.raw}-${i}`}
                className="flex gap-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-[#07080C]"
                  style={{ backgroundColor: brandColor }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-white/80">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {watchItems.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            Watch List
          </p>
          <div className="flex flex-wrap gap-2">
            {watchItems.map((item, i) => (
              <span
                key={`${item.raw}-${i}`}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/75"
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {!summary && signalItems.length === 0 && (
        <p className="whitespace-pre-wrap text-sm text-white/80">{stripInlineMarkdown(result)}</p>
      )}
    </div>
  );
}
