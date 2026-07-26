import 'server-only';

import { getClient } from './leads';

export type UsageRow = {
  day: string;
  jobs: number;
  spendUsd: number;
};

export type ProviderRow = {
  provider: string;
  jobs: number;
  spendUsd: number;
  /** True when this provider costs nothing — the free tier JB insists on. */
  free: boolean;
};

export type BrakeRow = {
  scope: string;
  enabled: boolean;
  updatedAt: string | null;
};

export type UsageTowerData = {
  days: UsageRow[];
  providers: ProviderRow[];
  brakes: BrakeRow[];
  totalSpendUsd: number;
  paidJobs: number;
  localJobs: number;
};

type SpendEvent = { type?: string; job_code?: string; model?: string; cost_usd?: number };

function isFreeModel(model: string): boolean {
  return /gemini|ollama|axon-|local/i.test(model);
}

/**
 * NIP-404-TOOLS / Usage Tower — what is running, what it costs, and the brake.
 *
 * Spend is reconstructed from the dispatch_spend rows the runners write into
 * Learnings. Anything on a free model is counted separately and priced at zero,
 * because JB's standing rule is that nothing routes to a paid API — the tower
 * exists mainly to prove that stays true.
 */
export async function loadUsageTower(days = 14): Promise<UsageTowerData> {
  const { sbSelect } = getClient();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const [learningRows, controlRows] = await Promise.all([
    sbSelect('Learnings', `select=learning,date&date=gte.${since}&order=date.desc&limit=1000`).catch(
      () => [],
    ),
    sbSelect('automation_controls', 'select=scope,enabled,updated_at&order=scope.asc').catch(
      () => [],
    ),
  ]);

  const byDay = new Map<string, UsageRow>();
  const byProvider = new Map<string, ProviderRow>();
  let totalSpendUsd = 0;
  let paidJobs = 0;
  let localJobs = 0;

  for (const row of (learningRows || []) as { learning?: string; date?: string }[]) {
    if (!row.learning?.trim().startsWith('{')) continue;
    let event: SpendEvent;
    try {
      event = JSON.parse(row.learning) as SpendEvent;
    } catch {
      continue;
    }
    if (event.type !== 'dispatch_spend') continue;

    const day = (row.date || '').slice(0, 10);
    const model = event.model || 'unknown';
    const free = isFreeModel(model);
    const cost = free ? 0 : Number(event.cost_usd || 0);

    totalSpendUsd += cost;
    if (free) localJobs += 1;
    else paidJobs += 1;

    const dayRow = byDay.get(day) ?? { day, jobs: 0, spendUsd: 0 };
    dayRow.jobs += 1;
    dayRow.spendUsd += cost;
    byDay.set(day, dayRow);

    const provRow = byProvider.get(model) ?? { provider: model, jobs: 0, spendUsd: 0, free };
    provRow.jobs += 1;
    provRow.spendUsd += cost;
    byProvider.set(model, provRow);
  }

  const brakes = ((controlRows || []) as { scope: string; enabled: boolean; updated_at: string }[])
    .map((c) => ({ scope: c.scope, enabled: !!c.enabled, updatedAt: c.updated_at ?? null }));

  return {
    days: Array.from(byDay.values()).sort((a, b) => a.day.localeCompare(b.day)),
    providers: Array.from(byProvider.values()).sort((a, b) => b.jobs - a.jobs),
    brakes,
    totalSpendUsd,
    paidJobs,
    localJobs,
  };
}

/** The brake: flip an automation scope on or off. */
export async function setBrake(scope: string, enabled: boolean): Promise<void> {
  const { sbPatch } = getClient();
  await sbPatch('automation_controls', `scope=eq.${encodeURIComponent(scope)}`, {
    enabled,
    updated_by: 'JB',
    updated_from: 'usage-tower',
    updated_at: new Date().toISOString(),
  });
}
