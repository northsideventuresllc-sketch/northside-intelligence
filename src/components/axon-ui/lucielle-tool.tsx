'use client';

import { useState } from 'react';
import type { LucielleMode, LucielleSnapshot } from '@/lib/axon/lucielle';

export function LucielleTool({
  business,
  personal,
}: {
  business: LucielleSnapshot;
  personal: LucielleSnapshot;
}) {
  const [mode, setMode] = useState<LucielleMode>('business');
  const snapshot = mode === 'business' ? business : personal;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Lucielle</h1>
        <p className="mt-1 max-w-2xl text-sm text-axon-muted">
          Your money in one place. Business and personal stay completely separate — figures from
          one never get added into the other.
        </p>
      </div>

      <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-sm text-emerald-100/90">
        <p className="font-semibold text-emerald-200">Your banking data stays on your machine.</p>
        <p className="mt-1">
          Balances, card details and credit reports are read by a model running on your Mac and
          stored encrypted. They are never sent to any outside service in readable form. This
          screen only ever shows the totals that come back.
        </p>
      </div>

      <div className="flex gap-2">
        {(['business', 'personal'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full border px-5 py-2 text-sm font-bold transition ${
              mode === m
                ? 'border-axon-gold/60 bg-axon-gold/10 text-axon-gold'
                : 'border-white/15 text-axon-muted hover:text-white'
            }`}
          >
            {m === 'business' ? 'Business' : 'Personal'}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {snapshot.figures.map((f) => (
          <div key={f.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs text-axon-muted">{f.label}</div>
            <div className="mt-1 text-2xl font-extrabold text-white">
              {f.amountUsd === null ? (
                <span className="text-axon-muted">Not connected</span>
              ) : (
                `$${f.amountUsd.toLocaleString()}`
              )}
            </div>
            <div className="mt-1 text-xs text-axon-muted">From {f.source}</div>
          </div>
        ))}
      </div>

      <section>
        <h2 className="text-xs uppercase tracking-[0.1em] text-axon-muted">Connections</h2>
        <div className="mt-3 space-y-2">
          {snapshot.connectors.map((c) => (
            <div
              key={c.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-xs text-axon-muted">{c.note}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  c.connected
                    ? 'bg-emerald-400/15 text-emerald-300'
                    : 'bg-white/10 text-axon-muted'
                }`}
              >
                {c.connected ? 'Connected' : 'Not connected'}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-axon-muted">
          Connecting an account is done on your Mac, not here — that is what keeps the data local.
        </p>
      </section>
    </div>
  );
}
