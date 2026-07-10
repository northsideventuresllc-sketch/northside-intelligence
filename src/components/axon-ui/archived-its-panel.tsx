'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/axon/api-base';

export interface ArchivedToolRow {
  id: number;
  tool_slug: string;
  name: string;
  description: string | null;
  removed_at: string;
  revival_eligible: boolean;
  revival_score: number | null;
}

interface ArchivedItsPanelProps {
  initialRows: ArchivedToolRow[];
}

export function ArchivedItsPanel({ initialRows }: ArchivedItsPanelProps) {
  const [rows, setRows] = useState(initialRows);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function revive(slug: string, days: 30 | 90) {
    const key = `${slug}-${days}`;
    if (busy) return;
    setBusy(key);
    setMessage(null);
    try {
      const res = await fetch(apiUrl('/api/axon/archived/revive'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, trialDays: days }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Revive failed');
      setRows((prev) => prev.filter((r) => r.tool_slug !== slug));
      setMessage(`${slug} revived for ${days} days.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Revive failed');
    } finally {
      setBusy(null);
    }
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-axon-border bg-axon-surface px-6 py-10 text-center text-sm text-axon-muted">
        No archived ITs in the vault.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {message && <p className="text-sm text-axon-cyan">{message}</p>}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-axon-border bg-axon-surface px-5 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-medium text-axon-cyan">{row.name}</h3>
                <p className="mt-1 text-xs text-axon-muted">{row.tool_slug}</p>
                {row.description && (
                  <p className="mt-2 text-sm text-axon-text">{row.description}</p>
                )}
                <p className="mt-2 text-[10px] uppercase tracking-wider text-axon-muted">
                  Archived {new Date(row.removed_at).toLocaleDateString()}
                </p>
              </div>
              {row.revival_eligible && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => revive(row.tool_slug, 30)}
                    className="axon-notif-secondary-btn text-xs"
                  >
                    Revive 30 Days
                  </button>
                  <button
                    type="button"
                    disabled={!!busy}
                    onClick={() => revive(row.tool_slug, 90)}
                    className="axon-notif-primary-btn text-xs"
                  >
                    Revive 90 Days
                  </button>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
