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

interface Props {
  result: string;
  brandColor: string;
  sourceSystem?: string;
  targetSystem?: string;
  presentationMode?: Sector3PresentationMode;
}

export function BridgeAIResult({
  result,
  brandColor,
  sourceSystem,
  targetSystem,
  presentationMode = "simple",
}: Props) {
  const isSimple = presentationMode === "simple";
  const sections = parseSectionsForMode(result, presentationMode);

  const plainEnglish = findSection(
    sections,
    "in plain english",
    "plain english"
  );
  const guide = findSection(
    sections,
    "your step-by-step guide",
    "step-by-step guide",
    "orchestration",
    "plan"
  );
  const watchOut = findSection(sections, "things to watch out for", "watch out", "risk");
  const goal = findSection(sections, "integration goal", "goal");
  const architecture = findSection(sections, "architecture");
  const mapping = findSection(sections, "data mapping", "mapping");
  const tools = findSection(sections, "tool", "api", "suggested");

  const guideItems = guide?.items.length ? guide.items : guide ? parseListItems(guide.body) : [];
  const watchItems = watchOut?.items.length
    ? watchOut.items
    : watchOut
      ? parseListItems(watchOut.body)
      : [];
  const toolItems = tools?.items.length ? tools.items : tools ? parseListItems(tools.body) : [];

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
            ⇄
          </span>
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              {isSimple ? "Your Connection Plan" : "Orchestration Plan"}
            </h2>
            <p className="text-xs text-white/45">
              {isSimple
                ? "How your tools will work together — no tech jargon"
                : "Implementation blueprint for your team or developer"}
            </p>
          </div>
        </div>
        <CopyResultButton text={result} className="text-indigo-300" />
      </div>

      {(sourceSystem || targetSystem) && (
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl border border-white/10 bg-black/25 p-4">
          <div className="text-center">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-white/40">
              From
            </p>
            <span
              className="inline-block rounded-xl border px-4 py-2 text-sm font-medium"
              style={{ borderColor: `${brandColor}55`, color: brandColor }}
            >
              {sourceSystem || "Your first tool"}
            </span>
          </div>
          <span className="text-2xl text-white/40">→</span>
          <div className="text-center">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-white/40">
              To
            </p>
            <span className="inline-block rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white/80">
              {targetSystem || "Your second tool"}
            </span>
          </div>
        </div>
      )}

      {isSimple && plainEnglish && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: `${brandColor}44`,
            background: `linear-gradient(135deg, ${brandColor}15, transparent)`,
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            {friendlySectionLabel(plainEnglish.title)}
          </p>
          {splitParagraphs(plainEnglish.body).map((p) => (
            <RichParagraph key={p} text={p} className="text-sm leading-relaxed text-white/90" />
          ))}
        </div>
      )}

      {!isSimple && goal && (
        <div
          className="rounded-2xl border p-5"
          style={{
            borderColor: `${brandColor}44`,
            background: `linear-gradient(135deg, ${brandColor}15, transparent)`,
          }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            Integration Goal
          </p>
          {splitParagraphs(goal.body).map((p) => (
            <RichParagraph key={p} text={p} className="text-sm text-white/85" />
          ))}
        </div>
      )}

      {!isSimple && architecture && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            Architecture Overview
          </p>
          <div className="grid gap-2 sm:grid-cols-3">
            {splitParagraphs(architecture.body).map((p, i) => (
              <div
                key={p}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                <span
                  className="mb-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-[#07080C]"
                  style={{ backgroundColor: brandColor }}
                >
                  {i + 1}
                </span>
                <p className="text-sm text-white/75">{p}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {guideItems.length > 0 && (
        <div className="space-y-0">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            {isSimple ? "Your Step-by-Step Guide" : "Step-by-Step Orchestration Plan"}
          </p>
          {guideItems.map((item, i) => (
            <div key={`${item.raw}-${i}`} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-[#07080C]"
                  style={{ backgroundColor: brandColor }}
                >
                  {item.rank ?? i + 1}
                </span>
                {i < guideItems.length - 1 && (
                  <div className="my-1 w-px flex-1 bg-white/15" />
                )}
              </div>
              <div className="mb-4 flex-1 rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-sm leading-relaxed text-white/90">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {watchItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400/80">
            {isSimple ? "Things to Watch Out For" : "Risks and Mitigations"}
          </p>
          {watchItems.map((item, i) => (
            <div
              key={`${item.raw}-${i}`}
              className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4"
            >
              <p className="text-sm leading-relaxed text-white/90">{item.text}</p>
            </div>
          ))}
        </div>
      )}

      {!isSimple && mapping && (
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/50">
            Data Mapping Notes
          </p>
          {splitParagraphs(mapping.body).map((p) => (
            <RichParagraph key={p} text={p} className="text-sm text-white/80" />
          ))}
        </div>
      )}

      {!isSimple && toolItems.length > 0 && (
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/50">
            Suggested Tools and APIs
          </p>
          <div className="flex flex-wrap gap-2">
            {toolItems.map((item, i) => (
              <span
                key={`${item.raw}-${i}`}
                className="rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{
                  borderColor: `${brandColor}44`,
                  backgroundColor: `${brandColor}14`,
                  color: brandColor,
                }}
              >
                {item.text}
              </span>
            ))}
          </div>
        </div>
      )}

      {guideItems.length === 0 && !plainEnglish && !goal && (
        <p className="whitespace-pre-wrap text-sm text-white/80">{stripInlineMarkdown(result)}</p>
      )}
    </div>
  );
}
