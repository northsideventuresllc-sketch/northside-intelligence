'use client';

import { useState } from 'react';
import type { AxonNotification, ItReportPayload } from '@/lib/axon/axon-types';
import { apiUrl } from '@/lib/axon/api-base';

interface ItReportNotificationCardProps {
  notification: AxonNotification;
  onActionComplete?: () => void;
}

function isReportPayload(payload: unknown): payload is ItReportPayload {
  return typeof payload === 'object' && payload !== null && 'metrics' in payload && 'reportId' in payload;
}

export function ItReportNotificationCard({
  notification,
  onActionComplete,
}: ItReportNotificationCardProps) {
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const payload = notification.itPayload;

  if (!isReportPayload(payload)) return null;
  const { metrics, reportId } = payload;

  async function runAction(action: 'keep' | 'trial' | 'remove') {
    if (busy) return;
    setBusy(action);
    setMessage(null);

    if (notification.isTest) {
      setMessage(`Test ${action} — no production changes made.`);
      setBusy(null);
      return;
    }

    try {
      const res = await fetch(apiUrl(`/api/axon/it-report/${reportId}/${action}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolSlug: metrics.toolSlug }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'locked_until_expires') {
          throw new Error(
            `Keep lock active until ${data.lockedUntil ? new Date(data.lockedUntil).toLocaleDateString() : 'lock end'}. Remove is blocked.`
          );
        }
        throw new Error(data.error || 'Action failed');
      }
      setMessage(
        action === 'keep'
          ? 'Locked for 365 days — next evaluation after lock expires.'
          : action === 'trial'
            ? 'Extended 30 days — new report will follow.'
            : 'Removed — subscribers keep access until billing cycle ends.'
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
          Test notification — metrics are simulated.
        </p>
      )}
      <dl className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-axon-muted">Period</dt>
          <dd>{metrics.periodDays} days</dd>
        </div>
        <div>
          <dt className="text-axon-muted">MRR</dt>
          <dd>${metrics.mrrUsd.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Signups</dt>
          <dd>{metrics.signups}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Active Users</dt>
          <dd>{metrics.activeUsers}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Paying Users</dt>
          <dd>{metrics.payingUsers}</dd>
        </div>
        <div>
          <dt className="text-axon-muted">Churn</dt>
          <dd>{metrics.churnPct}%</dd>
        </div>
      </dl>
      <p className="text-xs text-axon-muted">
        AI recommendation: <strong className="text-axon-cyan">{metrics.aiRecommendation.toUpperCase()}</strong>
      </p>
      <p className="text-xs leading-relaxed">{metrics.rationale}</p>

      {message && <p className="text-xs text-axon-cyan">{message}</p>}

      <footer className="flex flex-wrap gap-2 border-t border-axon-border pt-4">
        <button
          type="button"
          disabled={!!busy}
          onClick={() => runAction('keep')}
          className="axon-notif-primary-btn"
        >
          Keep
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => runAction('trial')}
          className="axon-notif-secondary-btn"
        >
          Trial
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => runAction('remove')}
          className="axon-notif-danger-btn"
        >
          Remove
        </button>
      </footer>
    </div>
  );
}
