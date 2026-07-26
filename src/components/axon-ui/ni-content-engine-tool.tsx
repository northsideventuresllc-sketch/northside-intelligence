'use client';

import { useState } from 'react';
import type { ContentPost } from '@/lib/content-machine/types';

export function NiContentEngineTool({ initialPosts }: { initialPosts: ContentPost[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  async function call(body: Record<string, unknown>) {
    setBusy(true);
    setNote('');
    try {
      const res = await fetch('/api/axon/ni-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed');
      setNote(data.message || 'Done');
      const list = await fetch('/api/axon/ni-content').then((r) => r.json());
      setPosts(list.posts ?? []);
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  const waiting = posts.filter((p) => p.status === 'pending_approval' || p.status === 'draft');
  const approved = posts.filter((p) => p.status === 'approved');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">NI Content</h1>
        <p className="text-sm text-axon-muted">
          Posts for NORTHSiDE Intelligence. Same machine as Match Fit — you read, edit, approve.
          Nothing publishes on its own.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={() => call({ action: 'generate' })}
          className="rounded-full bg-axon-blue-glow px-4 py-2 text-sm font-bold text-axon-bg disabled:opacity-40"
        >
          Draft Today&apos;s Posts
        </button>
        <span className="text-sm text-axon-muted">
          {waiting.length} waiting on you · {approved.length} approved
        </span>
        {note ? <span className="text-sm text-axon-accent">{note}</span> : null}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-axon-muted">
          Nothing here yet. Hit Draft Today&apos;s Posts.
        </div>
      ) : null}

      <div className="space-y-2">
        {posts.map((p) => {
          const isEditing = editing === p.id;
          return (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs uppercase tracking-wide text-axon-blue-glow">
                  {p.post_type} · {p.target_group}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-axon-muted">
                  {p.status === 'pending_approval' ? 'Waiting on you' : p.status}
                </span>
              </div>

              {isEditing ? (
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-axon-bg px-3 py-2 text-sm text-white outline-none focus:border-axon-blue-glow"
                />
              ) : (
                <p className="mt-2 whitespace-pre-wrap text-sm text-white/80">{p.caption}</p>
              )}

              <div className="mt-3 flex flex-wrap gap-2">
                {isEditing ? (
                  <>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setEditing(null);
                        void call({ action: 'edit', id: p.id, caption: draft });
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
                      disabled={busy || p.status === 'approved'}
                      onClick={() => call({ action: 'approve', id: p.id })}
                      className="rounded-full bg-emerald-400 px-4 py-1.5 text-sm font-bold text-emerald-950 disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(p.id);
                        setDraft(p.caption);
                      }}
                      className="rounded-full border border-white/15 px-4 py-1.5 text-sm font-semibold text-white"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => call({ action: 'reject', id: p.id })}
                      className="rounded-full border border-red-400/40 px-4 py-1.5 text-sm font-semibold text-red-300 disabled:opacity-40"
                    >
                      Bin It
                    </button>
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
