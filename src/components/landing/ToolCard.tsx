"use client";

import type { Sector3Tool } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useTilt } from "@/hooks/useTilt";
import { buildPortalAuthUrl } from "@/lib/ni-auth";

interface ToolCardProps {
  tool: Sector3Tool;
}

export function ToolCard({ tool }: ToolCardProps) {
  const { ref, handleMove, handleLeave } = useTilt({ maxTilt: 14, scale: 1.04 });

  return (
    <article
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className="group relative flex h-full min-h-[280px] flex-col overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-ni-navy/80 via-ni-navy/50 to-ni-bg/90 p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(0,212,255,0.15)] backdrop-blur-md transition-[transform,box-shadow,border-color] duration-300 ease-out will-change-transform hover:border-cyan-400/40 hover:shadow-[0_24px_70px_rgba(0,212,255,0.18),inset_0_1px_0_rgba(0,212,255,0.3)]"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(0,212,255,0.1), transparent 60%)",
        }}
        aria-hidden
      />
      <div
        className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-400/20 via-transparent to-blue-600/10 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />
      <div
        className="relative z-10 flex min-h-0 flex-1 flex-col gap-2 overflow-hidden"
        style={{ transform: "translateZ(24px)" }}
      >
        <div className="flex shrink-0 items-start justify-between gap-2">
          <h3 className="min-w-0 break-words text-lg font-semibold leading-snug text-white drop-shadow-[0_0_12px_rgba(0,212,255,0.3)]">
            {tool.name}
          </h3>
          <StatusBadge status={tool.status} />
        </div>
        <p className="shrink-0 break-all text-xs font-medium uppercase tracking-wider text-ni-cyan/70">
          {tool.subdomain}
        </p>
        <p className="min-h-0 flex-1 overflow-hidden break-words text-sm leading-relaxed text-ni-muted line-clamp-4">
          {tool.description}
        </p>
        <div className="mt-auto shrink-0 pt-4">
          {tool.url ? (
            <div className="flex flex-col gap-2">
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl border border-cyan-500/50 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-300 shadow-[0_4px_16px_rgba(0,212,255,0.15),inset_0_1px_0_rgba(255,255,255,0.1)] transition hover:border-cyan-400/70 hover:bg-cyan-500/20 hover:shadow-[0_8px_24px_rgba(0,212,255,0.25)]"
              >
                Open Tool →
              </a>
              <a
                href={buildPortalAuthUrl("signup", `${tool.url}/dashboard`)}
                className="text-center text-xs text-ni-muted transition hover:text-cyan-400"
              >
                Sign up with NI account
              </a>
            </div>
          ) : (
            <span className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-ni-muted">
              Coming Soon
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
