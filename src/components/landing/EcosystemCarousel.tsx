"use client";

import {
  ECOSYSTEM_LABS_COMING_SOON,
  ECOSYSTEM_LABS_LIVE,
  type EcosystemProject,
} from "@/lib/constants";
import { useCarousel } from "@/hooks/useCarousel";
import { EcosystemCard } from "./EcosystemCard";

const ALL_PROJECTS: EcosystemProject[] = [
  ...ECOSYSTEM_LABS_LIVE,
  ...ECOSYSTEM_LABS_COMING_SOON,
];

function wrapIndex(i: number, len: number): number {
  return ((i % len) + len) % len;
}

export function EcosystemCarousel() {
  const { safeIndex, fade, go, goTo } = useCarousel(ALL_PROJECTS.length);

  const prevIndex = wrapIndex(safeIndex - 1, ALL_PROJECTS.length);
  const nextIndex = wrapIndex(safeIndex + 1, ALL_PROJECTS.length);

  const current = ALL_PROJECTS[safeIndex];
  const prev = ALL_PROJECTS[prevIndex];
  const next = ALL_PROJECTS[nextIndex];

  return (
    <>
      <div
        className="relative mx-auto flex min-h-[360px] max-w-4xl items-center justify-center px-2 sm:gap-6 sm:px-0"
        style={{ perspective: "1400px" }}
      >
        {ALL_PROJECTS.length > 1 && (
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
              <EcosystemCard project={prev} variant="side" />
            </div>
          </button>
        )}

        <div
          className={`relative z-20 w-full max-w-[300px] flex-shrink-0 transition-all duration-300 ease-in-out ${
            fade === "in" ? "opacity-100 scale-100" : "opacity-0 scale-[0.97]"
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          <EcosystemCard project={current} variant="center" />
        </div>

        {ALL_PROJECTS.length > 1 && (
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
              <EcosystemCard project={next} variant="side" />
            </div>
          </button>
        )}
      </div>

      <div className="mt-8 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={() => go(-1)}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          aria-label="Previous project"
        >
          ←
        </button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium text-white">{current.name}</span>
          <span className="text-xs text-ni-muted">
            {safeIndex + 1} / {ALL_PROJECTS.length}
          </span>
          <div className="mt-1 flex gap-1.5">
            {ALL_PROJECTS.map((p, i) => (
              <button
                key={p.name}
                type="button"
                onClick={() => goTo(i)}
                aria-label={`Go to ${p.name}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === safeIndex ? "w-6 bg-cyan-400" : "w-1.5 bg-white/20 hover:bg-cyan-400/50"
                }`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 transition hover:border-cyan-400/50 hover:bg-cyan-500/20"
          aria-label="Next project"
        >
          →
        </button>
      </div>
    </>
  );
}
