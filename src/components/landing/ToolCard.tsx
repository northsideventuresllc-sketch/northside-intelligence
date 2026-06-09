"use client";

import type { IntelligenceTool } from "@/lib/constants";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ToolLogo3D } from "./ToolLogo3D";

interface ToolCardProps {
  tool: IntelligenceTool;
  variant?: "center" | "side";
  purchased?: boolean;
}

function CardShell({
  tool,
  isCenter,
  children,
}: {
  tool: IntelligenceTool;
  isCenter: boolean;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`relative flex h-full min-h-[300px] w-full max-w-[300px] flex-col items-center overflow-hidden rounded-2xl border p-5 text-center backdrop-blur-md transition-all duration-500 sm:min-h-[320px] sm:p-6 ${
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
      {children}
    </article>
  );
}

export function ToolCard({ tool, variant = "center", purchased = false }: ToolCardProps) {
  const isCenter = variant === "center";

  const inner = (
    <>
      <div className="mb-3 flex w-full shrink-0 flex-col items-center gap-2">
        <div className="relative">
          <ToolLogo3D
            logo={tool.logo}
            name={tool.name}
            brandColor={tool.brandColor}
            size={isCenter ? "lg" : "md"}
          />
          {purchased && (
            <span className="absolute -right-1 -top-1 rounded-md border border-emerald-400/50 bg-emerald-500/25 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35)]">
              PURCHASED
            </span>
          )}
        </div>
        <h3
          className={`font-semibold leading-tight text-white ${isCenter ? "text-lg sm:text-xl" : "text-base"}`}
          style={{ textShadow: isCenter ? `0 0 20px ${tool.brandColor}66` : undefined }}
        >
          {tool.name}
        </h3>
        {isCenter && <StatusBadge status={tool.status} />}
      </div>

      {isCenter && (
        <p className="line-clamp-4 flex-1 px-1 text-sm leading-relaxed text-ni-muted">
          {tool.description}
        </p>
      )}
    </>
  );

  if (isCenter) {
    const href = tool.url ?? `/tools/${tool.slug}`;
    const external = !!tool.url;
    return (
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="block h-full transition hover:-translate-y-1"
        aria-label={`Open ${tool.name}`}
      >
        <CardShell tool={tool} isCenter={isCenter}>
          {inner}
        </CardShell>
      </a>
    );
  }

  return (
    <CardShell tool={tool} isCenter={isCenter}>
      {inner}
    </CardShell>
  );
}
