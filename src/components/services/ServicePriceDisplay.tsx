import type { ServiceAudience, ServicePricing } from "@/lib/services/offerings";
import { getServicePriceLines } from "@/lib/services/offerings";

interface ServicePriceDisplayProps {
  pricing: ServicePricing;
  audience: ServiceAudience;
  size?: "card" | "modal";
}

export function ServicePriceDisplay({
  pricing,
  audience,
  size = "card",
}: ServicePriceDisplayProps) {
  const lines = getServicePriceLines(pricing, audience);
  const isCompact = size === "card";
  const priceClass = isCompact ? "text-lg font-semibold text-cyan-300" : "text-lg font-semibold text-white";
  const labelClass = isCompact
    ? "text-[10px] font-semibold uppercase tracking-wider text-ni-muted"
    : "text-xs font-semibold uppercase tracking-wider text-cyan-300/70";

  if (lines.length === 0) {
    return <p className={priceClass}>Contact for pricing</p>;
  }

  if (lines.length === 1) {
    return (
      <div>
        <p className={priceClass}>{lines[0].price}</p>
        {lines[0].note && <p className="mt-0.5 text-xs text-ni-muted">{lines[0].note}</p>}
      </div>
    );
  }

  return (
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
}
