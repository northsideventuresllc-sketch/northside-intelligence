"use client";

import type { UserPromo } from "@/lib/promos/types";

interface PromoCardProps {
  promo: UserPromo;
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function promoTypeLabel(type: UserPromo["promoType"]): string {
  switch (type) {
    case "store_discount":
      return "Smart Store";
    case "tool_free_months":
      return "Tool Access";
    case "feature_access":
      return "Feature";
    case "manual":
      return "Special Offer";
    default:
      return "Promo";
  }
}

export function PromoCard({ promo }: PromoCardProps) {
  return (
    <article className="rounded-xl border border-cyan-500/20 bg-ni-navy/40 p-5 shadow-[0_0_30px_rgba(0,212,255,0.05)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300">
          {promoTypeLabel(promo.promoType)}
        </span>
        <span className="text-xs text-ni-muted">Expires {formatExpiry(promo.expiresAt)}</span>
      </div>
      <h3 className="text-lg font-semibold text-white">{promo.title}</h3>
      <p className="mt-1 text-sm text-ni-muted">{promo.description}</p>
      {promo.promoCode && (
        <div className="mt-4 flex items-center gap-2">
          <code className="rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 text-sm font-mono text-cyan-300">
            {promo.promoCode}
          </code>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(promo.promoCode!)}
            className="text-xs text-cyan-400 hover:text-cyan-300"
          >
            Copy
          </button>
        </div>
      )}
      {promo.discountPercent != null && (
        <p className="mt-2 text-sm font-medium text-emerald-400">
          {promo.discountPercent}% off
        </p>
      )}
      {promo.freeMonths != null && (
        <p className="mt-2 text-sm font-medium text-emerald-400">
          {promo.freeMonths} month{promo.freeMonths > 1 ? "s" : ""} free unlimited
        </p>
      )}
    </article>
  );
}
