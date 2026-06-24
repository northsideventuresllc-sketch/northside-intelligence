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

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-rose-500/20 text-rose-300 border-rose-400/40",
    bar: "bg-rose-500",
    label: "Critical",
  },
  moderate: {
    badge: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    bar: "bg-amber-400",
    label: "Moderate",
  },
  minor: {
    badge: "bg-white/10 text-white/60 border-white/15",
    bar: "bg-white/30",
    label: "Minor",
  },
} as const;

interface Props {
  result: string;
  brandColor: string;
}

export function GapScanResult({ result, brandColor }: Props) {
  const sections = parseMarkdownSections(result);
  const overview = findSection(sections, "overview");
  const gaps = findSection(sections, "gap");
  const quickWins = findSection(sections, "quick");
  const strategic = findSection(sections, "strategic", "recommendation");

  const gapItems = gaps?.items.length ? gaps.items : gaps ? parseListItems(gaps.body) : [];
  const winItems = quickWins?.items.length
    ? quickWins.items
    : quickWins
      ? parseListItems(quickWins.body)
      : [];
  const strategicItems = strategic?.items.length
    ? strategic.items
    : strategic
      ? parseListItems(strategic.body)
      : [];

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
            ◈
          </span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Gap Report
            </h2>
            <p className="text-xs text-white/45">Severity-ranked findings and quick wins</p>
          </div>
        </div>
        <CopyResultButton text={result} className="text-amber-300" />
      </div>

      {overview && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            Overview
          </p>
          {splitParagraphs(overview.body).map((p) => (
            <RichParagraph key={p} text={p} className="text-sm text-white/85" />
          ))}
        </div>
      )}

      {gapItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Gaps Found
          </p>
          {gapItems.map((item, i) => {
            const severity = item.severity ?? "moderate";
            const styles = SEVERITY_STYLES[severity];
            return (
              <article
                key={`${item.raw}-${i}`}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/20 pl-5 pr-4 py-4"
              >
                <div className={`absolute left-0 top-0 h-full w-1 ${styles.bar}`} />
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${styles.badge}`}
                  >
                    {styles.label}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/85">{item.text}</p>
              </article>
            );
          })}
        </div>
      )}

      {winItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">
            Quick Wins
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {winItems.map((item, i) => (
              <div
                key={`${item.raw}-${i}`}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4"
              >
                <span className="mb-2 inline-block text-xs font-semibold text-emerald-300">
                  ⚡ Quick Win
                </span>
                <p className="text-sm text-white/85">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {strategicItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            Strategic Recommendations
          </p>
          {strategicItems.map((item, i) => (
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
      )}

      {!overview && gapItems.length === 0 && (
        <p className="whitespace-pre-wrap text-sm text-white/80">{stripInlineMarkdown(result)}</p>
      )}
    </div>
  );
}
