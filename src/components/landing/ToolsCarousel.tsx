"use client";

import { useMemo, useState } from "react";
import {
  SECTOR_3_TOOLS,
  TOOL_CATEGORIES,
  type Sector3Tool,
  type ToolCategory,
} from "@/lib/constants";
import { ToolCard } from "./ToolCard";

function matchesQuery(tool: Sector3Tool, query: string, category: ToolCategory | "All") {
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

export function ToolsCarousel() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ToolCategory | "All">("All");
  const [index, setIndex] = useState(0);

  const filtered = useMemo(
    () => SECTOR_3_TOOLS.filter((t) => matchesQuery(t, query, category)),
    [query, category]
  );

  const safeIndex = filtered.length ? Math.min(index, filtered.length - 1) : 0;
  const current = filtered[safeIndex];

  function go(delta: number) {
    if (!filtered.length) return;
    setIndex((i) => (i + delta + filtered.length) % filtered.length);
  }

  return (
    <section id="tools" className="relative border-t border-white/5 px-6 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/[0.04] via-transparent to-transparent" />
      <div className="relative mx-auto max-w-4xl">
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

        {/* Search & filter */}
        <div className="mb-8 space-y-4">
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
          <div className="flex flex-wrap gap-2">
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

        {/* Carousel */}
        {filtered.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center text-ni-muted">
            No tools match your search.
          </p>
        ) : (
          <div className="relative" style={{ perspective: "1200px" }}>
            <div className="relative min-h-[320px] overflow-hidden rounded-2xl">
              {filtered.map((tool, i) => {
                const offset = i - safeIndex;
                const isActive = offset === 0;
                const abs = Math.abs(offset);
                if (abs > 1) return null;

                return (
                  <div
                    key={tool.name}
                    className="absolute inset-0 transition-all duration-500 ease-out"
                    style={{
                      transform: `translateX(${offset * 72}%) scale(${isActive ? 1 : 0.88}) rotateY(${offset * -12}deg)`,
                      opacity: isActive ? 1 : 0.35,
                      zIndex: isActive ? 10 : 5 - abs,
                      pointerEvents: isActive ? "auto" : "none",
                      transformStyle: "preserve-3d",
                    }}
                    aria-hidden={!isActive}
                  >
                    <ToolCard tool={tool} />
                  </div>
                );
              })}
            </div>

            <div className="mt-6 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => go(-1)}
                className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
                aria-label="Previous tool"
              >
                ← Prev
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
                      onClick={() => setIndex(i)}
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
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
