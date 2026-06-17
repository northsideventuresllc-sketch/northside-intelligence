"use client";

import type { ServiceOffering } from "@/lib/services/offerings";

interface ServiceOfferingCardProps {
  service: ServiceOffering;
  onLearnMore?: (slug: string) => void;
}

function audienceLabel(audience: ServiceOffering["audience"]): string {
  switch (audience) {
    case "individual":
      return "Individuals";
    case "business":
      return "Business & Enterprise";
    case "both":
      return "Individuals & Business";
  }
}

export function ServiceOfferingCard({ service, onLearnMore }: ServiceOfferingCardProps) {
  const isLive = service.status === "LIVE";

  return (
    <article className="glass-panel flex flex-col p-6 transition hover:border-cyan-500/20">
      <div className="mb-4 flex items-start justify-between gap-3">
        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            isLive
              ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border border-white/10 bg-white/5 text-ni-muted"
          }`}
        >
          {service.status}
        </span>
      </div>

      <p className="mb-4 flex-1 text-sm leading-relaxed text-ni-muted">{service.description}</p>

      <ul className="mb-6 space-y-1.5">
        {service.highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-2 text-sm text-ni-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-cyan-400/60" />
            {highlight}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3">
        <span className="text-xs text-ni-muted">{audienceLabel(service.audience)}</span>
        {isLive && onLearnMore ? (
          <button
            type="button"
            onClick={() => onLearnMore(service.slug)}
            className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/20"
          >
            Learn More
          </button>
        ) : (
          <span className="text-xs text-ni-muted">Available soon</span>
        )}
      </div>
    </article>
  );
}
