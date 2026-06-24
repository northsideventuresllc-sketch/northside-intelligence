"use client";

import { CopyResultButton } from "@/components/sector3/results/CopyResultButton";
import { RichParagraph } from "@/components/sector3/results/RichText";
import {
  friendlySectionLabel,
  type Sector3PresentationMode,
} from "@/lib/sector3-tools/presentation-mode";
import {
  findSection,
  parseListItems,
  parseSectionsForMode,
  splitParagraphs,
  stripInlineMarkdown,
} from "@/lib/sector3-tools/parse-result";

const SEVERITY_STYLES = {
  critical: {
    badge: "bg-rose-500/20 text-rose-300 border-rose-400/40",
    bar: "bg-rose-500",
    label: "Needs Attention Now",
  },
  moderate: {
    badge: "bg-amber-500/20 text-amber-200 border-amber-400/40",
    bar: "bg-amber-400",
    label: "Should Fix Soon",
  },
  minor: {
    badge: "bg-white/10 text-white/60 border-white/15",
    bar: "bg-white/30",
    label: "Nice to Improve",
  },
} as const;

interface Props {
  result: string;
  brandColor: string;
  presentationMode?: Sector3PresentationMode;
}

export function GapScanResult({
  result,
  brandColor,
  presentationMode = "simple",
}: Props) {
  const isSimple = presentationMode === "simple";
  const sections = parseSectionsForMode(result, presentationMode);

  const overview = findSection(sections, "what we found", "overview");
  const gaps = findSection(sections, "problems to fix", "gap");
  const quickWins = findSection(sections, "easy fixes first", "quick");
  const strategic = findSection(
    sections,
    "longer-term ideas",
    "strategic",
    "recommendation"
  );

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
              {isSimple ? "Your Gap Report" : "Detailed Gap Analysis"}
            </h2>
            <p className="text-xs text-white/45">
              {isSimple
                ? "Problems and fixes explained clearly"
                : "Full severity-ranked audit detail"}
            </p>
          </div>
        </div>
        <CopyResultButton text={result} className="text-amber-300" />
      </div>

      {overview && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            {friendlySectionLabel(overview.title)}
          </p>
          {splitParagraphs(overview.body).map((p) => (
            <RichParagraph key={p} text={p} className="text-sm leading-relaxed text-white/90" />
          ))}
        </div>
      )}

      {gapItems.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            {isSimple ? "Problems to Fix" : "Gaps Found"}
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
                    className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles.badge}`}
                  >
                    {isSimple ? styles.label : severity}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/90">{item.text}</p>
              </article>
            );
          })}
        </div>
      )}

      {winItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/80">
            {isSimple ? "Easy Fixes First" : "Quick Wins"}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {winItems.map((item, i) => (
              <div
                key={`${item.raw}-${i}`}
                className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-4"
              >
                <span className="mb-2 inline-block text-xs font-semibold text-emerald-300">
                  Quick win
                </span>
                <p className="text-sm text-white/90">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {strategicItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/50">
            {isSimple ? "Longer-Term Ideas" : "Strategic Recommendations"}
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
              <p className="text-sm text-white/85">{item.text}</p>
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
