"use client";

import { useEffect, useState } from "react";
import { REVENUE_GOAL_EOY_2026 } from "@/lib/constants";
import {
  OPS_STORAGE_KEYS,
  type RevenueBreakdown,
  calcProgressPercent,
  loadBreakdown,
  loadNumber,
  saveBreakdown,
  saveNumber,
} from "@/lib/ops-storage";
import { CurrencyInput } from "./CurrencyInput";

export function RevenueTracker() {
  const [mrr, setMrr] = useState(0);
  const [breakdown, setBreakdown] = useState<RevenueBreakdown>({
    matchFit: 0,
    sector3: 0,
    sector1B: 0,
    sector2: 0,
  });

  useEffect(() => {
    setMrr(loadNumber(OPS_STORAGE_KEYS.currentMrr, 0));
    setBreakdown(loadBreakdown());
  }, []);

  const progress = calcProgressPercent(mrr, REVENUE_GOAL_EOY_2026);
  const annualized = mrr * 12;

  const updateMrr = (value: number) => {
    setMrr(value);
    saveNumber(OPS_STORAGE_KEYS.currentMrr, value);
  };

  const updateBreakdown = (key: keyof RevenueBreakdown, value: number) => {
    const next = { ...breakdown, [key]: value };
    setBreakdown(next);
    saveBreakdown(next);
  };

  return (
    <section id="revenue" className="scroll-mt-6">
      <h2 className="mb-4 text-lg font-semibold text-white">NI Revenue Tracker</h2>
      <div className="rounded-xl border border-white/10 bg-ni-navy/30 p-6">
        <p className="text-sm text-ni-muted">
          Goal:{" "}
          <span className="font-medium text-white">
            ${REVENUE_GOAL_EOY_2026.toLocaleString()}
          </span>{" "}
          by EOY 2026
        </p>

        <div className="mt-4 max-w-xs">
          <CurrencyInput
            id="current-mrr"
            label="Current MRR"
            value={mrr}
            onChange={updateMrr}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-ni-muted">
              Annualized (${annualized.toLocaleString()}) vs goal
            </span>
            <span className="font-medium text-cyan-300">{progress}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <CurrencyInput
            label="Match Fit"
            value={breakdown.matchFit}
            onChange={(v) => updateBreakdown("matchFit", v)}
          />
          <CurrencyInput
            label="Sector 3"
            value={breakdown.sector3}
            onChange={(v) => updateBreakdown("sector3", v)}
          />
          <CurrencyInput
            label="Sector 1B"
            value={breakdown.sector1B}
            onChange={(v) => updateBreakdown("sector1B", v)}
          />
          <CurrencyInput
            label="Sector 2"
            value={breakdown.sector2}
            onChange={(v) => updateBreakdown("sector2", v)}
          />
        </div>
        <p className="mt-4 text-xs text-ni-muted">
          Saved locally in your browser. Database sync coming later.
        </p>
      </div>
    </section>
  );
}
