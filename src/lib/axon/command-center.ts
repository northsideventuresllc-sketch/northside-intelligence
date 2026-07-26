import 'server-only';

import { fetchDispatchQueue, fetchCompletedDispatches } from './agent-dispatch';
import { fetchMondayReview } from './monday-review';
import { listNiPosts } from '@/lib/content-machine/ni-content';
import { listCronJobs } from './axon-cron-service';
import { loadUsageTower, type UsageTowerData } from './usage-tower';
import type { AxonCronJobView } from './axon-cron-jobs';
import type { DispatchRow } from './agent-dispatch';

export type SiteCheck = { name: string; url: string; ok: boolean };

export type CommandCenterData = {
  needsYou: {
    leadsWaiting: number;
    postsWaiting: number;
  };
  workers: {
    active: DispatchRow[];
    finished: DispatchRow[];
  };
  schedules: AxonCronJobView[];
  health: {
    usage: UsageTowerData;
    sites: SiteCheck[];
  };
};

async function checkSite(name: string, url: string): Promise<SiteCheck> {
  try {
    const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) });
    return { name, url, ok: r.ok };
  } catch {
    return { name, url, ok: false };
  }
}

/**
 * Command Center — the ONE screen (JB decision 2026-07-26, Decisions #335).
 * Droid Space is a section here, not a separate tool. Every value on this
 * screen is read live from its source of truth; nothing is an agent-written
 * summary. If a source fails we show that section degraded rather than
 * blanking the whole screen.
 */
export async function loadCommandCenter(): Promise<CommandCenterData> {
  const [review, posts, active, finished, schedules, usage, sites] = await Promise.all([
    fetchMondayReview().catch(() => ({ approvable: [], needsCleanup: [] })),
    listNiPosts().catch(() => []),
    fetchDispatchQueue().catch(() => []),
    fetchCompletedDispatches(25).catch(() => []),
    listCronJobs().catch(() => [] as AxonCronJobView[]),
    loadUsageTower().catch(() => ({
      days: [],
      providers: [],
      brakes: [],
      totalSpendUsd: 0,
      paidJobs: 0,
      localJobs: 0,
    })),
    Promise.all([
      checkSite('NI Portal', 'https://www.northsideintelligence.com'),
      checkSite('Match Fit', 'https://match-fit.net'),
    ]),
  ]);

  return {
    needsYou: {
      leadsWaiting: review.approvable.length,
      postsWaiting: posts.filter((p) => p.status === 'pending_approval' || p.status === 'draft')
        .length,
    },
    workers: { active, finished },
    schedules,
    health: { usage, sites },
  };
}
