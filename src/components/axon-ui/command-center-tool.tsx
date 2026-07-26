'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiUrl } from '@/lib/axon/api-base';
import type { CommandCenterData } from '@/lib/axon/command-center';

/** Job titles are often full agent briefs — show the first sentence only. */
function shortTitle(title: string): string {
  const first = title.split(/(?<=[.!?])\s/)[0] ?? title;
  return first.length > 90 ? `${first.slice(0, 87)}…` : first;
}

const WORKER_STATUS: Record<string, { label: string; cls: string }> = {
  queued: { label: 'Waiting', cls: 'text-sky-300' },
  running: { label: 'Working now', cls: 'text-amber-300' },
  fired: { label: 'Handed off', cls: 'text-indigo-300' },
  blocked: { label: 'Stuck', cls: 'text-red-300' },
  done: { label: 'Done', cls: 'text-emerald-300' },
  failed: { label: 'Failed', cls: 'text-red-300' },
  skipped: { label: 'Skipped', cls: 'text-axon-muted' },
};

export function CommandCenterTool({
  data,
  basePath,
}: {
  data: CommandCenterData;
  basePath: string;
}) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [showFinished, setShowFinished] = useState(false);

  const queued = data.workers.active.filter((j) => j.status === 'queued');
  const running = data.workers.active.filter((j) => j.status === 'running');
  const stuck = data.workers.active.filter((j) => j.status === 'blocked');
  const needsTotal = data.needsYou.leadsWaiting + data.needsYou.postsWaiting;
  const schedProblems = data.schedules.filter(
    (s) => s.scheduled && s.lastRunStatus && s.lastRunStatus !== 'ok',
  );

  async function fire(code?: string) {
    setBusy(true);
    setNote(null);
    try {
      const r = await fetch(apiUrl('/api/axon/dispatch/fire'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(code ? { code } : {}),
      });
      const d = await r.json();
      setNote(d.ok ? d.message || 'Started.' : d.error || 'Could not start it.');
    } catch {
      setNote('Could not start it.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Command Center</h1>
        <p className="mt-1 text-sm text-axon-muted">
          Everything in one place, read live. No summaries, no guessing.
        </p>
        {note ? <p className="mt-2 text-sm text-axon-accent">{note}</p> : null}
      </div>

      {/* ── 🙋 NEEDS YOU ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-amber-400/40 bg-amber-400/5 p-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-amber-300">
          🙋 Needs You {needsTotal > 0 ? `(${needsTotal})` : '— nothing right now'}
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link
            href={`${basePath}/tools/monday-review`}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-300/50"
          >
            <div className="text-3xl font-extrabold text-white">{data.needsYou.leadsWaiting}</div>
            <div className="text-sm text-axon-muted">Outreach drafts to approve</div>
          </Link>
          <Link
            href={`${basePath}/tools/ni-content`}
            className="rounded-xl border border-white/10 bg-white/5 p-4 transition hover:border-amber-300/50"
          >
            <div className="text-3xl font-extrabold text-white">{data.needsYou.postsWaiting}</div>
            <div className="text-sm text-axon-muted">Posts to approve</div>
          </Link>
        </div>
      </section>

      {/* ── 🤖 WORKERS (Droid Space) ─────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-axon-blue-glow">
            🤖 Workers — {queued.length} waiting · {running.length} working · {stuck.length} stuck
          </h2>
          <button
            type="button"
            disabled={busy || queued.length === 0}
            onClick={() => void fire()}
            className="rounded-full bg-axon-gold px-4 py-1.5 text-sm font-bold text-black disabled:opacity-40"
          >
            Start All ({queued.length})
          </button>
        </div>
        <div className="mt-3 space-y-2">
          {data.workers.active.slice(0, 12).map((j) => {
            const st = WORKER_STATUS[j.status] ?? { label: j.status, cls: 'text-axon-muted' };
            return (
              <div
                key={j.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-white">
                  {shortTitle(j.title)}
                </span>
                <span className={`text-xs font-semibold ${st.cls}`}>{st.label}</span>
                {j.status === 'queued' ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void fire(j.code)}
                    className="rounded-full border border-axon-gold/50 px-3 py-0.5 text-xs font-bold text-axon-gold disabled:opacity-40"
                  >
                    Start
                  </button>
                ) : null}
              </div>
            );
          })}
          {data.workers.active.length === 0 ? (
            <p className="text-sm text-axon-muted">No jobs in the queue.</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setShowFinished((v) => !v)}
          className="mt-3 text-xs font-semibold text-axon-blue-glow"
        >
          {showFinished ? 'Hide Finished' : `Show Finished (${data.workers.finished.length})`}
        </button>
        {showFinished ? (
          <div className="mt-2 space-y-1.5">
            {data.workers.finished.map((j) => (
              <div key={j.id} className="rounded-lg bg-black/20 px-3 py-2">
                <p className="text-sm text-white">{shortTitle(j.title)}</p>
                {j.result_summary ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-axon-muted">{j.result_summary}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {/* ── ⏰ SCHEDULES ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-axon-teal">
          ⏰ Schedules — {schedProblems.length === 0 ? 'all green' : `${schedProblems.length} need a look`}
        </h2>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {data.schedules
            .filter((s) => s.scheduled)
            .map((s) => {
              const bad = s.lastRunStatus && s.lastRunStatus !== 'ok';
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-lg bg-black/20 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm text-white">
                    <span
                      className={`h-2 w-2 rounded-full ${bad ? 'bg-red-400' : 'bg-emerald-400'}`}
                    />
                    {s.title}
                  </span>
                  <span className="text-xs text-axon-muted">
                    {s.running ? 'running' : bad ? 'last run failed' : 'ok'}
                  </span>
                </div>
              );
            })}
        </div>
      </section>

      {/* ── 📊 HEALTH ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-300">
          📊 Health
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-black/20 p-3">
            <div className="text-2xl font-extrabold text-emerald-300">
              ${data.health.usage.totalSpendUsd.toFixed(2)}
            </div>
            <div className="text-xs text-axon-muted">Verified spend, 14d</div>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <div className="text-2xl font-extrabold text-white">{data.health.usage.localJobs}</div>
            <div className="text-xs text-axon-muted">Free-model runs</div>
          </div>
          {data.health.sites.map((s) => (
            <div key={s.name} className="rounded-xl bg-black/20 p-3">
              <div className={`text-2xl font-extrabold ${s.ok ? 'text-emerald-300' : 'text-red-400'}`}>
                {s.ok ? 'UP' : 'DOWN'}
              </div>
              <div className="text-xs text-axon-muted">{s.name}</div>
            </div>
          ))}
        </div>
        <Link
          href={`${basePath}/tools/usage-tower`}
          className="mt-3 inline-block text-xs font-semibold text-axon-blue-glow"
        >
          Full Usage + The Brake
        </Link>
      </section>
    </div>
  );
}
