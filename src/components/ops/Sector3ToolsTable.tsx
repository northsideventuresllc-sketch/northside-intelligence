"use client";

import { useEffect, useState } from "react";
import { OPS_SECTOR_3_ROWS } from "@/lib/constants";
import {
  OPS_STORAGE_KEYS,
  loadNumber,
  saveNumber,
} from "@/lib/ops-storage";

export function Sector3ToolsTable() {
  const [revenues, setRevenues] = useState<Record<string, number>>({});

  useEffect(() => {
    const initial: Record<string, number> = {};
    OPS_SECTOR_3_ROWS.forEach((row) => {
      initial[row.name] = loadNumber(`${OPS_STORAGE_KEYS.sector3Revenue}_${row.name}`, 0);
    });
    setRevenues(initial);
  }, []);

  const updateRevenue = (name: string, value: number) => {
    setRevenues((prev) => ({ ...prev, [name]: value }));
    saveNumber(`${OPS_STORAGE_KEYS.sector3Revenue}_${name}`, value);
  };

  return (
    <section id="sector3" className="scroll-mt-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Intelligence Tools</h2>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-lg border border-white/10 px-3 py-1.5 text-xs text-ni-muted"
          title="Coming soon"
        >
          + Add Tool
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/5 text-ni-muted">
              <th className="px-4 py-3 font-medium">Tool Name</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Subdomain</th>
              <th className="px-4 py-3 font-medium">App</th>
              <th className="px-4 py-3 font-medium">GitHub</th>
              <th className="px-4 py-3 font-medium">Revenue</th>
            </tr>
          </thead>
          <tbody>
            {OPS_SECTOR_3_ROWS.map((row) => (
              <tr key={row.name} className="border-b border-white/5 last:border-0">
                <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                <td className="px-4 py-3">
                  <span className="text-emerald-400">{row.status}</span>
                </td>
                <td className="px-4 py-3 text-ni-muted">{row.subdomain}</td>
                <td className="px-4 py-3">
                  {row.appUrl ? (
                    <a
                      href={row.appUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:underline"
                    >
                      Live →
                    </a>
                  ) : (
                    <span className="text-ni-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={row.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    Repo →
                  </a>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={revenues[row.name] ?? ""}
                    onChange={(e) =>
                      updateRevenue(row.name, parseFloat(e.target.value) || 0)
                    }
                    className="w-28 rounded border border-white/10 bg-ni-bg px-2 py-1 text-white outline-none focus:border-cyan-500/50"
                    aria-label={`${row.name} revenue`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
