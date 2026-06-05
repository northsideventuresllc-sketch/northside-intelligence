"use client";

import type { IntelligenceTool } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { buildPortalAuthUrl } from "@/lib/ni-auth";
import { ToolLogo3D } from "./ToolLogo3D";

interface ToolCardProps {
  tool: IntelligenceTool;
  variant?: "center" | "side";
}

export function ToolCard({ tool, variant = "center" }: ToolCardProps) {
  const isCenter = variant === "center";

  return (
    <article
      className={`relative flex aspect-square w-full max-w-[280px] flex-col items-center justify-center rounded-2xl border p-6 text-center backdrop-blur-md transition-all duration-500 ${
        isCenter
          ? "border-opacity-50 shadow-[0_24px_70px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
          : "border-white/10 bg-ni-navy/30 opacity-60"
      }`}
      style={{
        borderColor: isCenter ? `${tool.brandColor}66` : undefined,
        background: isCenter
          ? `linear-gradient(145deg, ${tool.brandColor}14 0%, rgba(10,22,40,0.85) 45%, rgba(7,8,12,0.95) 100%)`
          : undefined,
        boxShadow: isCenter ? `0 0 60px ${tool.brandColor}22` : undefined,
      }}
    >
      <div className="mb-4 flex w-full flex-col items-center gap-3">
        <ToolLogo3D
          logo={tool.logo}
          name={tool.name}
          brandColor={tool.brandColor}
          size={isCenter ? "lg" : "md"}
        />
        <div className="flex items-center justify-center gap-2">
          <h3
            className={`font-semibold text-white ${isCenter ? "text-xl" : "text-base"}`}
            style={{ textShadow: isCenter ? `0 0 20px ${tool.brandColor}66` : undefined }}
          >
            {tool.name}
          </h3>
          {isCenter && <StatusBadge status={tool.status} />}
        </div>
      </div>

      {isCenter && (
        <>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-ni-muted">
            {tool.subdomain}
          </p>
          <p className="mb-5 line-clamp-3 max-w-[220px] text-sm leading-relaxed text-ni-muted">
            {tool.description}
          </p>
          <div className="mt-auto w-full">
            {tool.url ? (
              <div className="flex flex-col gap-2">
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition hover:-translate-y-0.5"
                  style={{
                    border: `1px solid ${tool.brandColor}88`,
                    background: `${tool.brandColor}22`,
                    color: tool.brandColor,
                  }}
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
        </>
      )}
    </article>
  );
}
