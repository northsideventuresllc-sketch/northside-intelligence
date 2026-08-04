import 'server-only';

import { fetchDispatchQueue, fetchCompletedDispatches } from './agent-dispatch';
import { fetchPipelineStats } from './leads';
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
 *
 * MF-KILL-MONDAY-APPROVALS (2026-08-04): this screen is an NI surface and
 * shows NI numbers only. It used to read the venture-mixed
 * outreach_monday_review view through the now-deleted Monday Approvals
 * screen, which put Match Fit leads in front of JB on an NI page. The
 * outreach count now comes from fetchPipelineStats(), which is hard-scoped
 * to the NI source. Match Fit outreach lives in Match Fit Outreach HQ
 * (/tools/mf-outreach) and must never be surfaced here again.
 */
export async function loadCommandCenter(): Promise<CommandCenterData> {
  const [pipeline, posts, active, finished, schedules, usage, sites] = await Promise.all([
    fetchPipelineStats().catch(() => null),
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
      leadsWaiting: pipeline?.pending ?? 0,
      postsWaiting: posts.filter((p) => p.status === 'pending_approval' || p.status === 'draft')
        .length,
    },
    workers: { active, finished },
    schedules,
    health: { usage, sites },
  };
}
