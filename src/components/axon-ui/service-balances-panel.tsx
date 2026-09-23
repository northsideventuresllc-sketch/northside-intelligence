'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '@/lib/axon/api-base';
import { formatCents } from '@/lib/services/pricing-engine';

type PendingBalanceItem = {
  id: string;
  source: 'portal' | 'agent';
  clientEmail: string;
  serviceName: string;
  depositCents: number;
  defaultTotalCents: number;
  defaultBalanceCents: number;
  depositPaidAt: string | null;
};

const LIST_API = apiUrl('/api/ops/service-balances');
const CHARGE_API = apiUrl('/api/ops/service-balances/charge');

const SOURCE_LABEL: Record<PendingBalanceItem['source'], string> = {
  portal: 'Booked in portal',
  agent: 'Booked by AI agent',
};

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown date';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ServiceBalancesPanel() {
  const [items, setItems] = useState<PendingBalanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Row being confirmed — the exact amount is always shown before anything is billed.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [editedTotal, setEditedTotal] = useState<string>('');
  const [billing, setBilling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(LIST_API);
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Could not load pending balances');
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load pending balances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openConfirm(item: PendingBalanceItem) {
    setConfirmId(item.id);
    setEditedTotal(String(item.defaultTotalCents / 100));
    setMessage(null);
    setError(null);
  }

  function closeConfirm() {
    setConfirmId(null);
    setEditedTotal('');
  }

  async function billBalance(item: PendingBalanceItem) {
    const totalDollars = Number(editedTotal);
    if (!Number.isFinite(totalDollars) || totalDollars <= 0) {
      setError('Enter a valid final total.');
      return;
    }
    const finalTotalCents = Math.round(totalDollars * 100);

    setBilling(true);
    setError(null);
    setMessage(null);
    try {
      const r = await fetch(CHARGE_API, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: item.id, finalTotalCents, confirm: true }),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'Balance billing failed');

      if (data.outcome === 'charged') {
        setMessage(`Billed ${formatCents(data.amountCents)} to ${item.clientEmail}. Service marked complete.`);
      } else {
        setMessage(
          `Could not charge the saved card automatically. Send this payment link to ${item.clientEmail}: ${data.fallbackCheckoutUrl}`
        );
      }
      closeConfirm();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Balance billing failed');
    } finally {
      setBilling(false);
    }
  }

  const confirmItem = items.find((i) => i.id === confirmId) ?? null;
  const confirmTotalCents = Math.round((Number(editedTotal) || 0) * 100);
  const confirmBalanceCents = confirmItem ? Math.max(0, confirmTotalCents - confirmItem.depositCents) : 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Service Balances</h1>
        <p className="mt-1 max-w-xl text-sm text-axon-muted">
          Clients who paid a deposit and have a balance left to bill. Nothing is charged until you
          confirm the exact amount below.
        </p>
      </header>

      {message && (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-axon-muted">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-axon-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Client</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Deposit Paid</th>
                <th className="px-4 py-3 font-medium">Balance Due</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Booked Via</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-white/5">
                  <td className="px-4 py-3 text-white">{item.clientEmail}</td>
                  <td className="px-4 py-3 text-white">{item.serviceName}</td>
                  <td className="px-4 py-3 text-axon-muted">{formatCents(item.depositCents)}</td>
                  <td className="px-4 py-3 text-axon-muted">{formatCents(item.defaultBalanceCents)}</td>
                  <td className="px-4 py-3 text-axon-muted">{formatDate(item.depositPaidAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs">
                      {SOURCE_LABEL[item.source]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => openConfirm(item)}
                      className="rounded-lg bg-axon-gold px-3 py-1.5 text-xs font-medium text-black transition hover:opacity-90"
                    >
                      Complete &amp; Bill Balance
                    </button>
                  </td>
                </tr>
              ))}
              {!items.length && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-axon-muted">
                    No balances waiting to be billed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {confirmItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-neutral-900 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-white">Complete &amp; Bill Balance</h2>
            <p className="mt-1 text-sm text-axon-muted">
              {confirmItem.clientEmail} — {confirmItem.serviceName}
            </p>

            <label className="mt-4 block text-xs font-medium text-axon-muted">
              Final Total ($)
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={editedTotal}
                onChange={(e) => setEditedTotal(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-axon-gold"
              />
            </label>

            <dl className="mt-4 space-y-1 text-sm">
              <div className="flex justify-between text-axon-muted">
                <dt>Deposit already paid</dt>
                <dd>{formatCents(confirmItem.depositCents)}</dd>
              </div>
              <div className="flex justify-between font-medium text-white">
                <dt>Will charge saved card now</dt>
                <dd>{formatCents(confirmBalanceCents)}</dd>
              </div>
            </dl>

            {confirmBalanceCents <= 0 && (
              <p className="mt-2 text-xs text-red-300">
                The final total must be more than the deposit already paid.
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeConfirm}
                disabled={billing}
                className="rounded-lg px-4 py-2 text-sm text-axon-muted hover:text-white disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => billBalance(confirmItem)}
                disabled={billing || confirmBalanceCents <= 0}
                className="rounded-lg bg-axon-gold px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {billing ? 'Charging…' : `Confirm — Charge ${formatCents(confirmBalanceCents)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
