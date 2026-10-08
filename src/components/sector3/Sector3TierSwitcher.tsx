"use client";

import { useState } from "react";
import { getSector3AgenticPricing } from "@/lib/billing/sector3-tool-pricing";

interface Props {
  toolSlug: string;
  brandColor: string;
  isAgenticUser?: boolean;
  onOpenAgenticDrawer: () => void;
  className?: string;
}

export function Sector3TierSwitcher({
  toolSlug,
  brandColor,
  isAgenticUser = false,
  onOpenAgenticDrawer,
  className = "",
}: Props) {
  const pricing = getSector3AgenticPricing(toolSlug);
  const [activeTab, setActiveTab] = useState<"standard" | "agentic">(
    isAgenticUser ? "agentic" : "standard"
  );

  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-xl ${className}`}>
      <div className="flex items-center gap-1.5 rounded-xl bg-black/40 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("standard")}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "standard"
              ? "bg-white/15 text-white shadow"
              : "text-white/60 hover:text-white"
          }`}
        >
          <span>SaaS Standard</span>
          <span className="text-[11px] text-white/40">${pricing.standardMonthlyUsd}/mo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("agentic");
            onOpenAgenticDrawer();
          }}
          className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            activeTab === "agentic"
              ? "border text-white shadow-lg"
              : "text-white/70 hover:text-white"
          }`}
          style={
            activeTab === "agentic"
              ? {
                  borderColor: `${brandColor}88`,
                  backgroundColor: `${brandColor}22`,
                  color: brandColor,
                  boxShadow: `0 0 16px ${brandColor}33`,
                }
              : undefined
          }
        >
          <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span>⚡ Agentic Tier</span>
          <span className="rounded-md border border-cyan-400/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
            Coming Soon
          </span>
        </button>
      </div>

      <button
        type="button"
        onClick={onOpenAgenticDrawer}
        className="flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 transition hover:bg-cyan-500/20 hover:border-cyan-400/50"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Agentic Tier Coming Soon (Preview)</span>
      </button>
    </div>
  );
}
