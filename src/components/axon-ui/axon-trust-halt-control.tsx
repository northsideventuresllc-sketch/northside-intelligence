'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/axon/api-base';
import type { GlobalHaltStatus } from '@/lib/axon/morality-trust';

export function AxonTrustHaltControl({ initial }: { initial: GlobalHaltStatus }) {
  const [status, setStatus] = useState(initial);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function submit(action: 'halt' | 'clear') {
    const trimmed = reason.trim();
    if (!trimmed) {
      setMessage('A reason is required before this takes effect.');
      return;
    }
    if (action === 'halt' && !confirm('Declare a global halt? Every AXON surface seals until this is cleared.')) {
      return;
    }

    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(apiUrl('/api/axon/morality/halt'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setStatus(data.status);
      setReason('');
      setMessage(action === 'halt' ? 'Global halt declared.' : 'Halt cleared. AXON is back to normal operation.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      className={`rounded-xl border p-6 ${
        status.halted ? 'border-axon-danger/50 bg-axon-danger/5' : 'border-axon-border bg-axon-surface'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-medium">Kill Switch / Sealed Mode</h2>
        <span
          className={`rounded-full px-3 py-1 text-[11px] uppercase tracking-wide ${
            status.halted ? 'bg-axon-danger/20 text-axon-danger' : 'bg-axon-elevated text-axon-muted'
          }`}
        >
          {status.halted ? `Sealed — ${status.status}` : 'Clear'}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-axon-muted">Last actor</dt>
          <dd>{status.actor ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Since</dt>
          <dd>{status.createdAt ? new Date(status.createdAt).toLocaleString() : '—'}</dd>
        </div>
      </dl>
      {status.reason && <p className="mt-2 text-xs text-axon-muted">Reason: {status.reason}</p>}

      <div className="mt-4 space-y-3">
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for this action (required, goes on the audit record)"
          rows={2}
          className="w-full rounded-lg border border-axon-border bg-axon-elevated px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {!status.halted ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => submit('halt')}
              className="rounded-lg border border-axon-danger/50 px-4 py-2 text-sm text-axon-danger transition hover:bg-axon-danger/10 disabled:opacity-40"
            >
              {loading ? 'Working…' : 'Declare Global Halt'}
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => submit('clear')}
              className="rounded-lg border border-axon-border px-4 py-2 text-sm transition hover:border-axon-gold/40 disabled:opacity-40"
            >
              {loading ? 'Working…' : 'Clear Halt'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <p className="mt-4 rounded-lg border border-axon-border bg-axon-elevated px-4 py-3 text-sm">{message}</p>
      )}
    </section>
  );
}
