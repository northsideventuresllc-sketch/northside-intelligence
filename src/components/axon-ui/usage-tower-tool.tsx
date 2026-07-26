'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/axon/api-base';
import type { UsageTowerData } from '@/lib/axon/usage-tower';

/** Turn an internal scope key into something readable. */
function scopeLabel(scope: string): string {
  return scope
    .split('.')
    .map((part) =>
      part
        .replace(/_/g, ' ')
        .replace(/\bni\b/i, 'NI')
        .replace(/\bmatch fit\b/i, 'Match Fit'),
    )
    .join(' — ')
    .replace(/^(\w)/, (m) => m.toUpperCase());
}

export function UsageTowerTool({ initial }: { initial: UsageTowerData }) {
  const [data, setData] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const res = await fetch(apiUrl('/api/axon/usage-tower'));
    if (res.ok) setData(await res.json());
  }, []);

  useEffect(() => {
    const t = setInterval(() => void reload(), 60_000);
    return () => clearInterval(t);
  }, [reload]);

  async function flip(scope: string, enabled: boolean) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(apiUrl('/api/axon/usage-tower'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, enabled }),
      });
      const body = await res.json();
      setNote(res.ok ? body.message : body.error);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const peak = Math.max(1, ...data.days.map((d) => d.jobs));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Usage Tower</h1>
        <p className="mt-1 max-w-xl text-sm text-axon-muted">
          What has been running, what it cost, and the switch to stop any of it.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-3xl font-extrabold text-emerald-300">
            ${data.totalSpendUsd.toFixed(2)}
          </div>
          <div className="text-xs text-axon-muted">Spent, last 14 days</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-3xl font-extrabold text-white">{data.localJobs}</div>
          <div className="text-xs text-axon-muted">Jobs on free models</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div
            className={`text-3xl font-extrabold ${data.paidJobs > 0 ? 'text-amber-300' : 'text-white'}`}
          >
            {data.paidJobs}
          </div>
          <div className="text-xs text-axon-muted">Jobs that cost money</div>
        </div>
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-[0.1em] text-axon-muted">Last 14 days</h2>
        <div className="mt-3 flex items-end gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-4">
          {data.days.length === 0 ? (
            <p className="text-sm text-axon-muted">Nothing recorded yet.</p>
          ) : (
            data.days.map((d) => (
              <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
                <div
                  title={`${d.day}: ${d.jobs} jobs, $${d.spendUsd.toFixed(2)}`}
                  className={`w-full rounded-t ${d.spendUsd > 0 ? 'bg-amber-400' : 'bg-axon-blue-glow'}`}
                  style={{ height: `${Math.max(6, (d.jobs / peak) * 120)}px` }}
                />
                <span className="text-[9px] text-axon-muted">{d.day.slice(5)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.1em] text-axon-muted">Where it ran</h2>
        <div className="mt-3 space-y-2">
          {data.providers.map((p) => (
            <div
              key={p.provider}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <span className="font-semibold text-white">{p.provider}</span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    p.free ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300'
                  }`}
                >
                  {p.free ? 'FREE' : 'PAID'}
                </span>
              </div>
              <span className="text-sm text-axon-muted">
                {p.jobs} jobs · ${p.spendUsd.toFixed(2)}
              </span>
            </div>
          ))}
          {data.providers.length === 0 ? (
            <p className="text-sm text-axon-muted">No runs recorded in this window.</p>
          ) : null}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-[0.1em] text-axon-muted">The brake</h2>
        <p className="mt-1 text-sm text-axon-muted">
          Switch any of these off and that automation stops immediately.
        </p>
        {note ? <p className="mt-2 text-sm text-axon-accent">{note}</p> : null}
        <div className="mt-3 space-y-2">
          {data.brakes.map((b) => (
            <div
              key={b.scope}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div>
                <p className="font-semibold text-white">{scopeLabel(b.scope)}</p>
                <p className="text-xs text-axon-muted">
                  {b.enabled ? 'Running automatically' : 'Stopped'}
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void flip(b.scope, !b.enabled)}
                className={`rounded-full px-4 py-1.5 text-sm font-bold disabled:opacity-40 ${
                  b.enabled
                    ? 'border border-red-400/40 text-red-300'
                    : 'bg-emerald-400 text-emerald-950'
                }`}
              >
                {b.enabled ? 'Stop It' : 'Switch On'}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
