"use client";

import { useState } from "react";
import type { ServiceAudience, ServicePricing } from "@/lib/services/offerings";
import { getServicePriceLines } from "@/lib/services/offerings";

interface ServicePriceDisplayProps {
  pricing: ServicePricing;
  audience: ServiceAudience;
  size?: "card" | "modal";
  /** When false, prices are shown without the SEE PRICE toggle (e.g. post-quote screens). */
  collapsible?: boolean;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 text-cyan-300/80 transition-transform duration-200 ${
        expanded ? "rotate-90" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export function ServicePriceDisplay({
  pricing,
  audience,
  size = "card",
  collapsible = true,
}: ServicePriceDisplayProps) {
  const [expanded, setExpanded] = useState(false);
  const lines = getServicePriceLines(pricing, audience);
  const isCompact = size === "card";
  const priceClass = isCompact
    ? "text-lg font-semibold text-cyan-300"
    : "text-lg font-semibold text-white";
  const labelClass = isCompact
    ? "text-[10px] font-semibold uppercase tracking-wider text-ni-muted"
    : "text-xs font-semibold uppercase tracking-wider text-cyan-300/70";
  const toggleClass = isCompact
    ? "inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ni-muted transition hover:border-cyan-500/30 hover:text-cyan-300"
    : "inline-flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-cyan-300/90 transition hover:border-cyan-500/40 hover:bg-cyan-500/10";

  if (lines.length === 0) {
    if (!collapsible) {
      return <p className={priceClass}>Contact for pricing</p>;
    }
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className={toggleClass}
          aria-expanded={expanded}
        >
          SEE PRICE
          <ChevronIcon expanded={expanded} />
        </button>
        {expanded && (
          <p className={`mt-2 ${priceClass}`}>Contact for pricing</p>
        )}
      </div>
    );
  }

  const priceContent =
    lines.length === 1 ? (
      <div>
        <p className={priceClass}>{lines[0].price}</p>
        {lines[0].note && <p className="mt-0.5 text-xs text-ni-muted">{lines[0].note}</p>}
      </div>
    ) : (
      <div className={isCompact ? "space-y-2" : "space-y-3"}>
        {lines.map((line) => (
          <div key={line.label}>
            <p className={labelClass}>{line.label}</p>
            <p className={priceClass}>{line.price}</p>
            {line.note && <p className="mt-0.5 text-xs text-ni-muted">{line.note}</p>}
          </div>
        ))}
      </div>
    );

  if (!collapsible) {
    return priceContent;
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={toggleClass}
        aria-expanded={expanded}
      >
        SEE PRICE
        <ChevronIcon expanded={expanded} />
      </button>
      {expanded && <div className="mt-2">{priceContent}</div>}
    </div>
  );
}
