"use client";

import { useMemo, useState } from "react";
import {
  INTELLIGENCE_TOOLS,
  TOOL_CATEGORIES,
  type IntelligenceTool,
  type ToolCategory,
} from "@/lib/constants";
import { useCarousel } from "@/hooks/useCarousel";
import { ToolCard } from "./ToolCard";

function matchesQuery(tool: IntelligenceTool, query: string, category: ToolCategory | "All") {
  const q = query.trim().toLowerCase();
  if (category !== "All" && tool.category !== category) return false;
  if (!q) return true;
  const haystack = [
    tool.name,
    tool.description,
    tool.subdomain,
    tool.category,
    ...tool.keywords,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function wrapIndex(i: number, len: number): number {
  return ((i % len) + len) % len;
}

export function ToolsCarousel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory | "All">("All");

  const filtered = useMemo(
    () => INTELLIGENCE_TOOLS.filter((t) => matchesQuery(t, query, category)),
    [query, category]
  );

  const { safeIndex, fade, go, goTo, setIndex } = useCarousel(filtered.length);

  const prevIndex = filtered.length ? wrapIndex(safeIndex - 1, filtered.length) : 0;
  const nextIndex = filtered.length ? wrapIndex(safeIndex + 1, filtered.length) : 0;

  const current = filtered[safeIndex];
  const prev = filtered[prevIndex];
  const next = filtered[nextIndex];

  return (
    <section id="tools" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.04] via-transparent to-transparent" />
      <div className="relative mx-auto max-w-5xl">
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-ni-cyan/60">
            Platform
          </p>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">
            <span className="bg-gradient-to-r from-white to-cyan-200/80 bg-clip-text pb-1 text-transparent">
              Intelligence Tools
            </span>
          </h2>
        </div>

        <div className="mb-10 space-y-4">
          <label className="sr-only" htmlFor="tool-search">
            Search intelligence tools
          </label>
          <input
            id="tool-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="Search by tool, category, or keyword…"
            className="w-full rounded-xl border border-white/10 bg-ni-bg/80 px-4 py-3 text-white outline-none transition placeholder:text-ni-muted/60 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/25"
          />
          <div className="flex flex-wrap justify-center gap-2">
            {(["All", ...TOOL_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setIndex(0);
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  category === cat
                    ? "border-cyan-400/50 bg-cyan-500/15 text-cyan-300"
                    : "border-white/10 bg-white/5 text-ni-muted hover:border-cyan-400/30 hover:text-cyan-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-ni-muted">
            No tools match your search.
          </p>
        ) : (
          <>
            <div
              className="relative mx-auto flex min-h-[360px] max-w-4xl items-center justify-center px-2 sm:gap-6 sm:px-0"
              style={{ perspective: "1400px" }}
            >
              {filtered.length > 1 && prev && (
                <button
                  type="button"
                  onClick={() => go(-1)}
                  className="group absolute left-0 z-10 w-[26%] max-w-[160px] sm:max-w-[200px]"
                  aria-label={`Previous: ${prev.name}`}
                >
                  <div
                    className="pointer-events-none scale-[0.82] blur-[4px] transition-all duration-500 sm:scale-90 sm:blur-[3px] group-hover:blur-[2px]"
                    style={{ transform: "rotateY(18deg) translateZ(-40px)" }}
                  >
                    <ToolCard tool={prev} variant="side" />
                  </div>
                </button>
              )}

              <div
                className={`relative z-20 w-full max-w-[300px] flex-shrink-0 transition-all duration-300 ease-in-out ${
                  fade === "in" ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
                }`}
                style={{ transformStyle: "preserve-3d" }}
              >
                {current && <ToolCard tool={current} variant="center" />}
              </div>

              {filtered.length > 1 && next && (
                <button
                  type="button"
                  onClick={() => go(1)}
                  className="group absolute right-0 z-10 w-[26%] max-w-[160px] sm:max-w-[200px]"
                  aria-label={`Next: ${next.name}`}
                >
                  <div
                    className="pointer-events-none scale-[0.82] blur-[4px] transition-all duration-500 sm:scale-90 sm:blur-[3px] group-hover:blur-[2px]"
                    style={{ transform: "rotateY(-18deg) translateZ(-40px)" }}
                  >
                    <ToolCard tool={next} variant="side" />
                  </div>
                </button>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
                aria-label="Previous tool"
              >
                ←
              </button>
              <div className="flex flex-col items-center gap-1">
                <span className="text-sm font-medium text-white">{current?.name}</span>
                <span className="text-xs text-ni-muted">
                  {safeIndex + 1} / {filtered.length}
                </span>
                <div className="mt-1 flex gap-1.5">
                  {filtered.map((t, i) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => goTo(i)}
                      aria-label={`Go to ${t.name}`}
                      className={`h-1.5 rounded-full transition-all ${
                        i === safeIndex
                          ? "w-6 bg-cyan-400"
                          : "w-1.5 bg-white/20 hover:bg-cyan-400/50"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={() => go(1)}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
                aria-label="Next tool"
              >
                →
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
