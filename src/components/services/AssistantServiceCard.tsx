"use client";

import Link from "next/link";
import type { ServiceAssistantRecommendation } from "@/lib/services/assistant/types";

interface AssistantServiceCardProps {
  service: ServiceAssistantRecommendation;
  onSelect?: (slug: string) => void;
}

function audienceLabel(audience: ServiceAssistantRecommendation["audience"]): string {
  switch (audience) {
    case "individual":
      return "Individuals";
    case "business":
      return "Business";
    case "both":
      return "Individuals & Business";
  }
}

export function AssistantServiceCard({ service, onSelect }: AssistantServiceCardProps) {
  const href = `/services?service=${service.slug}`;

  return (
    <Link
      href={href}
      onClick={() => onSelect?.(service.slug)}
      className="flex flex-col gap-1 rounded-xl border border-white/10 bg-ni-navy/60 p-3 transition hover:border-cyan-400/30 hover:bg-ni-navy/80"
    >
      <p className="line-clamp-2 text-xs font-medium text-white">{service.name}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ni-muted">SEE PRICE</p>
      <p className="text-[10px] text-ni-muted">
        {audienceLabel(service.audience)} · Learn More
      </p>
    </Link>
  );
}
