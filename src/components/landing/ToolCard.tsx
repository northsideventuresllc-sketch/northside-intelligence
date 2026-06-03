"use client";

import type { Sector3Tool } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTilt } from "@/hooks/useTilt";

interface ToolCardProps {
  tool: Sector3Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const { ref, handleMove, handleLeave } = useTilt({ maxTilt: 10, scale: 1.03 });

  return (
    <article
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative flex flex-col rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-ni-navy/80 via-ni-navy/50 to-ni-bg/90 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(0,212,255,0.15)] backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform hover:border-cyan-400/40 hover:shadow-[0_20px_60px_rgba(0,212,255,0.15),inset_0_1px_0_rgba(0,212,255,0.3)]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,212,255,0.08), transparent 60%)",
        }}
        aria-hidden
      />
      <div
        className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-400/20 via-transparent to-blue-600/10 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col" style={{ transform: "translateZ(20px)" }}>
        <div className="mb-3 flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold text-white drop-shadow-[0_0_12px_rgba(0,212,255,0.3)]">
            {tool.name}
          </h3>
          <StatusBadge status={tool.status} />
        </div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ni-cyan/70">
          {tool.subdomain}
        </p>
        <p className="mb-6 flex-1 text-sm leading-relaxed text-ni-muted">{tool.description}</p>
        {tool.url ? (
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 shadow-[0_4px_16px_rgba(0,212,255,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-cyan-400/70 hover:bg-cyan-500/20 hover:shadow-[0_8px_24px_rgba(0,212,255,0.25)]"
          >
            Open Tool →
          </a>
        ) : (
          <span className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-ni-muted">
            Coming Soon
          </span>
        )}
      </div>
    </article>
  );
}
