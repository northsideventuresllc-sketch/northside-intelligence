"use client";

import { useEffect, useState } from "react";
import { MATCH_FIT } from "@/lib/constants";
import {
  OPS_STORAGE_KEYS,
  loadNumber,
  saveNumber,
} from "@/lib/ops-storage";

export function MatchFitSnapshot() {
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    setRevenue(loadNumber(OPS_STORAGE_KEYS.matchFitRevenue, 0));
  }, []);

  const handleChange = (value: number) => {
    setRevenue(value);
    saveNumber(OPS_STORAGE_KEYS.matchFitRevenue, value);
  };

  return (
    <section id="matchfit" className="scroll-mt-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Match Fit Snapshot</h2>
      <div className="rounded-xl border border-white/10 bg-ni-navy/30 p-6">
        <p className="text-xl font-medium text-white">
          {MATCH_FIT.sector} | {MATCH_FIT.domain} | {MATCH_FIT.version}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href={MATCH_FIT.appUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-500/20"
          >
            Open App
          </a>
          <a
            href={MATCH_FIT.adminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            Open Admin
          </a>
          <a
            href={MATCH_FIT.github}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10"
          >
            GitHub
          </a>
        </div>
        <div className="mt-6 max-w-xs">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-ni-muted">Revenue (manual)</span>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ni-muted">
                $
              </span>
              <input
                type="number"
                min={0}
                step={0.01}
                value={revenue || ""}
                onChange={(e) => handleChange(parseFloat(e.target.value) || 0)}
                className="w-full rounded-lg border border-white/10 bg-ni-bg py-2 pl-7 pr-3 text-white outline-none focus:border-cyan-500/50"
              />
            </div>
          </label>
        </div>
      </div>
    </section>
  );
}
