"use client";

import Link from "next/link";
import type { Sector3PresentationMode } from "@/lib/sector3-tools/presentation-mode";

interface Props {
  mode: Sector3PresentationMode;
  onChange: (mode: Sector3PresentationMode) => void;
  canAccessTechnical: boolean;
  brandColor?: string;
  upgradeHref?: string;
}

export function Sector3PresentationToggle({
  mode,
  onChange,
  canAccessTechnical,
  brandColor = "#38bdf8",
  upgradeHref = "/subscriptions",
}: Props) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-white/45">
        {mode === "simple"
          ? "Viewing results in everyday language"
          : "Viewing implementation and technical detail"}
      </p>
      <div className="inline-flex rounded-xl border border-white/10 bg-black/30 p-1">
        <button
          type="button"
          onClick={() => onChange("simple")}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "simple" ? "text-[#07080C]" : "text-white/60 hover:text-white"
          }`}
          style={mode === "simple" ? { backgroundColor: brandColor } : undefined}
        >
          Simple View
        </button>
        <button
          type="button"
          onClick={() => {
            if (canAccessTechnical) onChange("technical");
          }}
          disabled={!canAccessTechnical}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "technical"
              ? "text-[#07080C]"
              : canAccessTechnical
                ? "text-white/60 hover:text-white"
                : "cursor-not-allowed text-white/30"
          }`}
          style={mode === "technical" ? { backgroundColor: brandColor } : undefined}
          title={
            canAccessTechnical
              ? "Show implementation and technical detail"
              : "Upgrade to unlock Technical View"
          }
        >
          Technical View
        </button>
      </div>
      {!canAccessTechnical && (
        <p className="text-xs text-white/40">
          Technical View is on paid plans.{" "}
          <Link href={upgradeHref} className="underline" style={{ color: brandColor }}>
            Upgrade
          </Link>
        </p>
      )}
    </div>
  );
}
