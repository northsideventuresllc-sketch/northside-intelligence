'use client';

import { useCallback, useState } from 'react';
import { apiUrl } from '@/lib/axon/api-base';
import type { RedditOpportunity } from '@/lib/axon/reddit-machine';

export function RedditMachineTool({ initial }: { initial: RedditOpportunity[] }) {
  const [items, setItems] = useState(initial);
  const [tab, setTab] = useState<'pain' | 'promo'>('pain');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const reload = useCallback(async () => {
    const res = await fetch(apiUrl('/api/axon/reddit'));
    if (res.ok) setItems((await res.json()).items ?? []);
  }, []);

  async function act(body: Record<string, unknown>) {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch(apiUrl('/api/axon/reddit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setNote(res.ok ? data.message : data.error);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  const shown = items.filter((i) => i.kind === tab);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Reddit Machine</h1>
        <p className="mt-1 max-w-2xl text-sm text-axon-muted">
          Finds threads where someone has a problem one of your products solves, and subreddits
          that allow promotion. It writes the comment — you decide if it goes out. Nothing here
          posts by itself.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100/90">
        Every draft says outright that this is your product. Sounding human is fine; pretending to
        be a random happy customer is not, and this tool will not do it.
      </div>

      <div className="flex flex-wrap gap-2">
        {(['pain', 'promo'] as const).map((t) => (
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
            {t === 'pain' ? 'People With The Problem' : 'Subreddits That Allow Promo'}
          </button>
        ))}
        {note ? <span className="self-center text-sm text-axon-accent">{note}</span> : null}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-axon-muted">
          Nothing found yet. The scan fills this in — you will only ever see finished drafts here.
        </div>
      ) : null}

      <div className="space-y-2">
        {shown.map((item) => {
          const isEditing = editing === item.id;
          return (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-white">r/{item.subreddit}</span>
                <span className="text-[10px] uppercase tracking-wider text-axon-muted">
                  {item.status === 'new' ? 'Waiting on you' : item.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-white/80">{item.title}</p>
              {item.why ? <p className="mt-1 text-xs text-axon-muted">{item.why}</p> : null}
              {item.rules_note ? (
                <p className="mt-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-axon-muted">
                  Their rules: {item.rules_note}
                </p>
              ) : null}

              {isEditing ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-axon-bg px-3 py-2 text-sm text-white outline-none focus:border-axon-gold/50"
                />
              ) : item.draft_comment ? (
                <p className="mt-3 whitespace-pre-wrap rounded-lg bg-black/30 p-3 text-sm text-white/85">
                  {item.draft_comment}
                </p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditing(null);
                        void act({ action: 'edit', id: item.id, draft });
                      }}
                      className="rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-bold text-emerald-950 disabled:opacity-40"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={busy || item.status === 'approved'}
                      onClick={() => act({ action: 'approve', id: item.id })}
                      className="rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-bold text-emerald-950 disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(item.id);
                        setDraft(item.draft_comment ?? '');
                      }}
                      className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => act({ action: 'reject', id: item.id })}
                      className="rounded-full border border-red-400/40 px-4 py-1.5 text-sm font-semibold text-red-300 disabled:opacity-40"
                    >
                      Bin It
                    </button>
                    {item.url ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-axon-blue-glow underline"
                      >
                        Open Thread
                      </a>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
