'use client';

import { useState } from 'react';
import type { AxonNotification, ItLaunchPayload } from '@/lib/axon/axon-types';
import { apiUrl } from '@/lib/axon/api-base';

interface ItLaunchNotificationCardProps {
  notification: AxonNotification;
  onActionComplete?: () => void;
}

function isLaunchPayload(payload: unknown): payload is ItLaunchPayload {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'summary' in payload &&
    'launchId' in payload
  );
}

export function ItLaunchNotificationCard({
  notification,
  onActionComplete,
}: ItLaunchNotificationCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const payload = notification.itPayload;

  if (!isLaunchPayload(payload)) return null;
  const { summary, launchId } = payload;

  async function runAction(action: 'approve' | 'change' | 'deny') {
    if (busy) return;
    setBusy(action);
    setMessage(null);

    if (notification.isTest) {
      setMessage(`Test ${action} — no production changes made.`);
      setBusy(null);
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/axon/it-launch/${launchId}/${action}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: action === 'change' ? JSON.stringify({ summary }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');
      setMessage(
        action === 'approve'
          ? 'Approved — tool is now live on NI Portal.'
          : action === 'deny'
            ? 'Denied — preview will not go live.'
            : 'Change request saved — re-notification queued.'
      );
      onActionComplete?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 text-sm text-axon-text">
      {notification.isTest && (
        <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          Test notification — actions are simulated for fixtures.
        </p>
      )}
      <dl className="grid gap-2 text-xs">
        <div>
          <dt className="text-axon-muted">Description</dt>
          <dd>{summary.description}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Target Audience</dt>
          <dd>{summary.targetAudience}</dd>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <dt className="text-axon-muted">Subscription</dt>
            <dd>${summary.subscriptionPriceUsd}/mo</dd>
          </div>
          <div>
            <dt className="text-axon-muted">Lifetime Offer</dt>
            <dd>${summary.lifetimeOfferPriceUsd}</dd>
          </div>
        </div>
        <div>
          <dt className="text-axon-muted">EOY Revenue Est.</dt>
          <dd>${summary.estimatedRevenueEoyUsd.toLocaleString()}/mo — {summary.revenueAssumptions}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Marketing</dt>
          <dd>{summary.marketingStrategy}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Rollout</dt>
          <dd>{summary.rolloutPlan}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Competitors</dt>
          <dd>{summary.competitors.join(', ')} — {summary.differentiation}</dd>
        </div>
      </dl>

      {message && <p className="text-xs text-axon-cyan">{message}</p>}

      <footer className="flex flex-wrap gap-2 border-t border-axon-border pt-4">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => runAction('approve')}
          className="axon-notif-primary-btn"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => runAction('change')}
          className="axon-notif-secondary-btn"
        >
          Change
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => runAction('deny')}
          className="axon-notif-danger-btn"
        >
          Deny
        </button>
      </footer>
    </div>
  );
}
