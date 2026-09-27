'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiUrl } from '@/lib/axon/api-base';
import type { ReviewArtifact, ReviewArtifactDecisionStatus } from '@/lib/axon/reviewArtifacts';

const CONTENT_KIND_LABELS: Record<string, string> = {
  social_post: 'Social post',
  outreach_message: 'Outreach message',
  other: 'Other',
};

const DECISIONS: {
  status: ReviewArtifactDecisionStatus;
  label: string;
  variant: 'success' | 'danger' | 'default';
}[] = [
  { status: 'approved', label: 'Approve', variant: 'success' },
  { status: 'needs_changes', label: 'Needs Changes', variant: 'default' },
  { status: 'rejected', label: 'Reject', variant: 'danger' },
];

function formatAge(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return '—';
  const ms = Date.now() - created;
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ReviewArtifactsList({ items }: { items: ReviewArtifact[] }) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-axon-border bg-axon-surface p-6 text-sm text-axon-muted">
        Nothing waiting on you right now.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <ReviewArtifactCard key={item.id} item={item} />
      ))}
    </div>
  );
}

function ReviewArtifactCard({ item }: { item: ReviewArtifact }) {
  const router = useRouter();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState<ReviewArtifactDecisionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);

  const decide = useCallback(
    async (status: ReviewArtifactDecisionStatus) => {
      setLoading(status);
      setError(null);
      try {
        const res = await fetch(apiUrl(`/api/axon/review-artifacts/${item.id}`), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, reviewer_notes: notes.trim() || undefined }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Update failed');
        setResolved(true);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed');
      } finally {
        setLoading(null);
      }
    },
    [item.id, notes, router]
  );

  if (resolved) return null;

  return (
    <div className="space-y-3 rounded-xl border border-axon-border bg-axon-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-axon-text">{item.title}</h2>
          <p className="mt-1 text-xs text-axon-muted">
            {item.ventureId} · {CONTENT_KIND_LABELS[item.contentKind] ?? item.contentKind}
            {item.platform ? ` · ${item.platform}` : ''} · {formatAge(item.createdAt)}
          </p>
        </div>
        <span className="text-xs text-axon-muted">by {item.createdByAgent}</span>
      </div>

      {item.draftContent && (
        <p className="whitespace-pre-wrap rounded-lg border border-axon-border bg-axon-elevated px-3 py-2 text-sm leading-relaxed text-axon-text">
          {item.draftContent}
        </p>
      )}

      {!item.draftContent && item.draftRef && (
        <a
          href={item.draftRef}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-axon-teal hover:underline"
        >
          Open draft →
        </a>
      )}

      <label className="block space-y-1.5">
        <span className="text-xs text-axon-muted">Notes (optional)</span>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. tighten the hook, wrong tone"
          className="w-full rounded-lg border border-axon-border bg-axon-elevated px-3 py-2 text-sm text-axon-text outline-none focus:border-axon-gold/50"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((d) => (
          <button
            key={d.status}
            type="button"
            disabled={loading !== null}
            onClick={() => decide(d.status)}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
              d.variant === 'success'
                ? 'border-axon-success/50 text-axon-success hover:bg-axon-success/10'
                : d.variant === 'danger'
                  ? 'border-axon-danger/50 text-axon-danger hover:bg-axon-danger/10'
                  : 'border-axon-border text-axon-text hover:bg-axon-elevated'
            }`}
          >
            {loading === d.status ? 'Working…' : d.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-lg border border-axon-danger/40 bg-axon-danger/5 px-3 py-2 text-sm text-axon-danger">
          {error}
        </p>
      )}
    </div>
  );
}
