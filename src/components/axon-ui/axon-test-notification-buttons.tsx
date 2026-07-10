'use client';

import { useState } from 'react';
import { apiUrl } from '@/lib/axon/api-base';
import type { ItTestFixtureKey } from '@/lib/axon/it-notification-fixtures';

interface AxonTestNotificationButtonsProps {
  className?: string;
}

const IT_FIXTURES: { key: ItTestFixtureKey; label: string }[] = [
  { key: 'it_launch', label: 'IT Launch Review' },
  { key: 'it_90_day', label: 'IT 90-Day Report' },
  { key: 'archive_revival', label: 'Archive Revival' },
  { key: 'outreach_draft', label: 'Outreach Draft' },
];

export function AxonTestNotificationButtons({ className = '' }: AxonTestNotificationButtonsProps) {
  const [busy, setBusy] = useState(false);

  async function fireItFixture(fixture: ItTestFixtureKey) {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(apiUrl('/api/axon/notifications/test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixture }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.dispatchEvent(
        new CustomEvent('axon:test-notification', { detail: { notification: data.notification } })
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <p className="px-1 text-[10px] uppercase tracking-[0.15em] text-axon-muted/80">
        Test IT Notifications
      </p>
      {IT_FIXTURES.map(({ key, label }) => (
        <button
          key={key}
          type="button"
          disabled={busy}
          onClick={() => fireItFixture(key)}
          className="rounded-lg border border-axon-blue/30 bg-axon-blue/10 px-3 py-2 text-[11px] leading-snug text-axon-cyan transition hover:border-axon-cyan/50 disabled:opacity-50"
        >
          {label}
        </button>
      ))}
    </div>
  );
}
