'use client';

import { useState } from 'react';
import type { ItTestFixtureKey } from '@/lib/axon/it-notification-fixtures';
import { formatAxonButton, formatAxonDescription, formatAxonTitle } from '@/lib/axon/axon-copy';
import { fireItTestNotification } from './fire-it-test-notification';

interface AxonTestNotificationButtonsProps {
  className?: string;
  /** Compact sidebar / home widget layout */
  compact?: boolean;
}

const IT_TESTS: {
  fixture: ItTestFixtureKey;
  label: string;
  hint: string;
  accent: 'default' | 'cyan' | 'amber' | 'outreach';
}[] = [
  {
    fixture: 'it_launch',
    label: 'IT Launch',
    hint: 'Executive summary with Approve / Change / Deny.',
    accent: 'cyan',
  },
  {
    fixture: 'it_90_day',
    label: 'IT 90-Day Report',
    hint: 'Metrics + Keep / Trial / Remove actions.',
    accent: 'default',
  },
  {
    fixture: 'archive_revival',
    label: 'Archive Revival',
    hint: 'Monthly scan revival recommendation card.',
    accent: 'amber',
  },
  {
    fixture: 'outreach_draft',
    label: 'Outreach Draft',
    hint: 'Existing outreach draft-ready flow.',
    accent: 'outreach',
  },
];

function accentClass(accent: (typeof IT_TESTS)[number]['accent']): string {
  switch (accent) {
    case 'cyan':
      return 'border-axon-blue/30 bg-axon-blue/10 text-axon-cyan hover:border-axon-cyan/50';
    case 'amber':
      return 'border-amber-500/30 bg-amber-950/20 text-amber-200 hover:border-amber-400/50';
    case 'outreach':
      return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200 hover:border-emerald-400/50';
    default:
      return 'border-axon-border/60 bg-axon-elevated/80 text-axon-muted hover:border-axon-blue/40 hover:text-axon-cyan';
  }
}

export function AxonTestNotificationButtons({
  className = '',
  compact = false,
}: AxonTestNotificationButtonsProps) {
  const [busy, setBusy] = useState<ItTestFixtureKey | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fireTest(fixture: ItTestFixtureKey, label: string) {
    if (busy) return;
    setBusy(fixture);
    setError(null);
    setLastResult(null);
    try {
      await fireItTestNotification(fixture);
      setLastResult(`Fired: ${label}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="px-1">
        <p className="text-[10px] uppercase tracking-[0.15em] text-axon-muted/80">
          {formatAxonTitle('Test IT Notifications')}
        </p>
        {!compact && (
          <p className="mt-1 text-xs text-axon-muted">
            {formatAxonDescription(
              'Master-only fixtures — each inserts an isTest inbox card with the real IT action UI.',
            )}
          </p>
        )}
      </div>

      {IT_TESTS.map((test) => (
        <button
          key={test.fixture}
          type="button"
          disabled={!!busy}
          onClick={() => fireTest(test.fixture, test.label)}
          className={`rounded-lg border px-3 py-2 text-left text-[11px] leading-snug transition disabled:opacity-50 ${accentClass(test.accent)}`}
        >
          <span className="block font-medium">{formatAxonButton(test.label)}</span>
          {!compact && <span className="mt-0.5 block opacity-80">{test.hint}</span>}
          {busy === test.fixture && <span className="mt-1 block text-[10px] opacity-70">Sending…</span>}
        </button>
      ))}

      {lastResult && (
        <p className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1.5 text-[11px] text-emerald-200">
          {lastResult}
        </p>
      )}
      {error && (
        <p className="rounded border border-red-500/30 bg-red-950/20 px-2 py-1.5 text-[11px] text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
