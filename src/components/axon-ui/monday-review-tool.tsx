'use client';

import { useMemo, useState } from 'react';
import type { MondayReviewRow } from '@/lib/axon/monday-review';

type Props = {
  approvable: MondayReviewRow[];
  needsCleanup: MondayReviewRow[];
};

function Who({ r }: { r: MondayReviewRow }) {
  const bits = [r.company, r.city, r.niche].filter(Boolean).join(' · ');
  return (
    <div>
      <div className="font-semibold text-white">{r.who || 'Unknown'}</div>
      {bits ? <div className="text-xs text-axon-muted">{bits}</div> : null}
    </div>
  );
}

export function MondayReviewTool({ approvable, needsCleanup }: Props) {
  const [rows, setRows] = useState(approvable);
  const [junk, setJunk] = useState(needsCleanup);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [open, setOpen] = useState<string | null>(null);

  const allOn = rows.length > 0 && selected.size === rows.length;
  const ids = useMemo(() => Array.from(selected), [selected]);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function act(action: 'approve' | 'reject' | 'purge', reason?: string) {
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/axon/outreach/monday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, messageIds: ids, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setNote(data.message || 'Done');
      if (action === 'purge') setJunk([]);
      else {
        setRows((prev) => prev.filter((r) => !selected.has(r.message_id)));
        setSelected(new Set());
      }
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Monday Approvals</h1>
        <p className="text-sm text-axon-muted">
          Tick the ones you like, hit Approve. Everything else stays put. Nothing sends without
          you.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setSelected(allOn ? new Set() : new Set(rows.map((r) => r.message_id)))}
          className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white"
        >
          {allOn ? 'Clear All' : 'Select All'}
        </button>
        <button
          type="button"
          disabled={busy || !ids.length}
          onClick={() => act('approve')}
          className="rounded-full bg-emerald-400 px-4 py-2 text-sm font-bold text-emerald-950 disabled:opacity-40"
        >
          Approve {ids.length ? `(${ids.length})` : ''}
        </button>
        <button
          type="button"
          disabled={busy || !ids.length}
          onClick={() => act('reject', 'not a fit')}
          className="rounded-full border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-300 disabled:opacity-40"
        >
          Not a Fit
        </button>
        {note ? <span className="text-sm text-axon-accent">{note}</span> : null}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-axon-muted">
          Nothing waiting on you. New drafts show up here Monday morning.
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((r) => {
          const on = selected.has(r.message_id);
          const isOpen = open === r.message_id;
          return (
            <div
              key={r.message_id}
              className={`rounded-2xl border p-4 transition ${
                on ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-white/5'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggle(r.message_id)}
                  className="mt-1 h-5 w-5 accent-emerald-400"
                  aria-label={`Select ${r.who || 'lead'}`}
                />
                <div className="min-w-0 flex-1">
                  <Who r={r} />
                  <p className="mt-2 line-clamp-2 text-sm text-white/80">{r.message}</p>
                  {isOpen ? (
                    <div className="mt-3 space-y-2 text-sm text-white/70">
                      {r.subject ? <div><b>Subject:</b> {r.subject}</div> : null}
                      <div className="whitespace-pre-wrap">{r.message}</div>
                      {r.why_them ? <div><b>Why them:</b> {r.why_them}</div> : null}
                      {r.profile_url ? (
                        <a
                          href={r.profile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-axon-accent underline"
                        >
                          Open Profile
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : r.message_id)}
                    className="mt-2 text-xs font-semibold text-axon-accent"
                  >
                    {isOpen ? 'Hide' : 'Read Full Message'}
                  </button>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs uppercase tracking-wide text-axon-muted">
                    {r.channel || '—'}
                  </div>
                  {typeof r.score === 'number' ? (
                    <div className="text-lg font-bold text-white">{r.score}</div>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {junk.length ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
          <div className="font-semibold text-amber-200">
            {junk.length} bad drafts hidden from you
          </div>
          <p className="mt-1 text-sm text-amber-100/80">
            Wrong target type — you should never have to read these.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => act('purge', 'junk draft — wrong ICP')}
            className="mt-3 rounded-full bg-amber-300 px-4 py-2 text-sm font-bold text-amber-950 disabled:opacity-40"
          >
            Clear Them Out
          </button>
        </div>
      ) : null}
    </div>
  );
}
