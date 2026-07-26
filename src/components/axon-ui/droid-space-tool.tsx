'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiUrl } from '@/lib/axon/api-base';

type Job = {
  id: string;
  code: string;
  title: string;
  repo: string | null;
  manager_chat: string | null;
  status: string;
  result_summary: string | null;
  updated_at: string | null;
  completed_at: string | null;
};

/**
 * NIP-DROID-SPACE — Repo Manager and Fire/Hold merged into one room.
 * Job titles in this queue are often a full paragraph of spec written for an
 * agent. JB should see a job name, not a brief, so we take the first sentence
 * and keep the rest available on demand.
 */
function shortTitle(title: string): string {
  const firstSentence = title.split(/(?<=[.!?])\s/)[0] ?? title;
  const trimmed = firstSentence.trim();
  return trimmed.length > 96 ? `${trimmed.slice(0, 93)}…` : trimmed;
}

const STATUS_STYLE: Record<string, { label: string; dot: string; text: string }> = {
  queued: { label: 'Waiting to start', dot: 'bg-sky-400', text: 'text-sky-300' },
  running: { label: 'Working now', dot: 'bg-amber-400 animate-pulse', text: 'text-amber-300' },
  fired: { label: 'Handed off', dot: 'bg-indigo-400', text: 'text-indigo-300' },
  blocked: { label: 'Stuck', dot: 'bg-red-400', text: 'text-red-300' },
  done: { label: 'Done', dot: 'bg-emerald-400', text: 'text-emerald-300' },
  skipped: { label: 'Skipped', dot: 'bg-white/30', text: 'text-axon-muted' },
  failed: { label: 'Failed', dot: 'bg-red-500', text: 'text-red-300' },
};

function statusStyle(status: string) {
  return (
    STATUS_STYLE[status] ?? { label: status, dot: 'bg-white/30', text: 'text-axon-muted' }
  );
}

export function DroidSpaceTool() {
  const [active, setActive] = useState<Job[]>([]);
  const [finished, setFinished] = useState<Job[]>([]);
  const [tab, setTab] = useState<'active' | 'finished'>('active');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [a, f] = await Promise.all([
        fetch(apiUrl('/api/axon/dispatch/queue')).then((r) => r.json()),
        fetch(apiUrl('/api/axon/dispatch/queue?view=completed&limit=40')).then((r) => r.json()),
      ]);
      setActive(a.items ?? []);
      setFinished(f.items ?? []);
    } catch {
      setNote('Could not load the job list.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function fire(code?: string) {
    setBusy(true);
    setNote(null);
    try {
      const r = await fetch(apiUrl('/api/axon/dispatch/fire'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(code ? { code } : {}),
      });
      const data = await r.json();
      setNote(data.ok ? data.message || 'Started.' : data.error || 'Could not start it.');
      setTimeout(() => void load(), 2500);
    } catch {
      setNote('Could not start it.');
    } finally {
      setBusy(false);
    }
  }

  const jobs = tab === 'active' ? active : finished;
  const counts = useMemo(() => {
    const by = (s: string) => active.filter((j) => j.status === s).length;
    return { waiting: by('queued'), working: by('running'), stuck: by('blocked') };
  }, [active]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Droid Space</h1>
          <p className="mt-1 max-w-xl text-sm text-axon-muted">
            Every build job in one room — what is waiting, what is running, what got stuck, and
            what each one actually produced.
          </p>
        </div>
        <button
          type="button"
          disabled={busy || counts.waiting === 0}
          onClick={() => void fire()}
          className="rounded-full bg-axon-gold px-5 py-2.5 text-sm font-bold text-black transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? 'Starting…' : `Start All (${counts.waiting})`}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Waiting', value: counts.waiting, tone: 'text-sky-300' },
          { label: 'Working now', value: counts.working, tone: 'text-amber-300' },
          { label: 'Stuck', value: counts.stuck, tone: 'text-red-300' },
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className={`text-3xl font-extrabold ${c.tone}`}>{c.value}</div>
            <div className="text-xs text-axon-muted">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {(['active', 'finished'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              tab === t
                ? 'border-axon-gold/60 bg-axon-gold/10 text-axon-gold'
                : 'border-white/15 text-axon-muted hover:text-white'
            }`}
          >
            {t === 'active' ? 'In Progress' : 'Finished'}
          </button>
        ))}
        {note ? <span className="self-center text-sm text-axon-accent">{note}</span> : null}
      </div>

      {loading ? <p className="text-sm text-axon-muted">Loading…</p> : null}

      <div className="space-y-2">
        {jobs.map((job) => {
          const style = statusStyle(job.status);
          const expanded = open === job.id;
          return (
            <div
              key={job.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
                    <p className="font-semibold text-white">{shortTitle(job.title)}</p>
                  </div>
                  <p className="mt-1 text-xs text-axon-muted">
                    {job.repo || job.manager_chat || 'No repo'} · {job.code}
                  </p>

                  {job.result_summary ? (
                    <p
                      className={`mt-2 text-sm text-white/70 ${expanded ? '' : 'line-clamp-2'}`}
                    >
                      <span className="font-semibold text-axon-muted">Result: </span>
                      {job.result_summary}
                    </p>
                  ) : null}

                  {expanded ? (
                    <p className="mt-2 whitespace-pre-wrap text-xs text-axon-muted">{job.title}</p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => setOpen(expanded ? null : job.id)}
                    className="mt-2 text-xs font-semibold text-axon-blue-glow"
                  >
                    {expanded ? 'Less' : 'More'}
                  </button>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                  <span className={`text-xs font-semibold ${style.text}`}>{style.label}</span>
                  {job.status === 'queued' ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void fire(job.code)}
                      className="rounded-full border border-axon-gold/50 px-3 py-1 text-xs font-bold text-axon-gold disabled:opacity-40"
                    >
                      Start
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {!loading && jobs.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-axon-muted">
            {tab === 'active' ? 'Nothing queued right now.' : 'Nothing finished yet.'}
          </div>
        ) : null}
      </div>
    </div>
  );
}
