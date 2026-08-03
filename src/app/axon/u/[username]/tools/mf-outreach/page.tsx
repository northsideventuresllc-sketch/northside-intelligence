import { Suspense } from 'react';
import { OutreachHqTool } from '@/components/axon-ui/outreach-hq-tool';
import { fetchLeads, fetchPipelineStats, getClient, enrichLead } from '@/lib/axon/leads';
import { getOutreachTrainingSummary } from '@/lib/axon/outreach-learn';
import { axonPublicPath } from '@/lib/axon/paths';
import { requireAxonPortalUser } from '@/lib/axon/portal-guard';
import { MATCH_FIT_SOURCE } from '@/lib/axon/constants.mjs';
import type { Lead } from '@/lib/axon/types';

// AX-MKT-OUT-DEMERGE (2026-08-03): Match Fit's own real outreach queue —
// same shared UI/API plumbing as NI Outreach (fetchLeads/fetchPipelineStats
// already accept a source, and the approve/reject/send routes are id-scoped
// so they work unmodified), scoped to source=match_fit instead of the old
// read-only stub inside Match Fit Admin. No NI-specific prospecting/ICP/
// training panels — Match Fit's lead generation lives in its own repo.
export const dynamic = 'force-dynamic';

async function fetchSentLeads() {
  const { sbSelect } = getClient();
  const rows = (await sbSelect(
    'ni_brain_outreach',
    `source=eq.${MATCH_FIT_SOURCE}&status=eq.sent&select=*&order=created_at.desc&limit=200`,
  )) as Lead[];
  const leads = (rows || []).map(enrichLead);
  return {
    pending: leads.filter((l) => !l.meta.follow_up_sent_at),
    done: leads.filter((l) => !!l.meta.follow_up_sent_at),
  };
}

export default async function AxonMfOutreachPage({
  params,
  searchParams,
}: {
  params: { username: string };
  searchParams: { tab?: string; status?: string };
}) {
  const { username } = await requireAxonPortalUser(params.username);
  const basePath = axonPublicPath(username);
  const { tab, status } = searchParams;
  const [stats, leads, followUp, training] = await Promise.all([
    fetchPipelineStats(MATCH_FIT_SOURCE),
    fetchLeads(500, MATCH_FIT_SOURCE),
    fetchSentLeads(),
    getOutreachTrainingSummary(),
  ]);
  const initialTab =
    tab === 'queue' || tab === 'pipeline' || tab === 'follow-up' || tab === 'overview'
      ? tab
      : 'overview';

  return (
    <Suspense fallback={<div className="text-sm text-axon-muted">Loading Match Fit Outreach…</div>}>
      <OutreachHqTool
        stats={stats}
        leads={leads}
        training={training}
        todayQueries={[]}
        minScore={0}
        basePath={basePath}
        initialTab={initialTab}
        pipelineFilter={tab === 'pipeline' ? status : undefined}
        followUpPending={followUp.pending}
        followUpDone={followUp.done}
        venture="match_fit"
        toolSlug="mf-outreach"
        displayNameFallback="Match Fit Outreach"
      />
    </Suspense>
  );
}
