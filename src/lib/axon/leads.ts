import { createSupabaseClient } from './supabase.mjs';
import {
  MAX_DRAFTS_PER_DAY,
  SOURCE,
  parseNotes,
  formatNotes,
  shortId,
  todayUtc,
} from './constants.mjs';
import { filterVisibleLeads, sweepLeadLifecycle } from './outreach-lifecycle';
import { backfillNiServicesArtifacts } from './ni-services-artifact-pipeline.mjs';
import { draftOutreachReviewArtifact } from './outreach-review-gate';
import type { Lead, LeadWithMeta, PipelineStats } from './types';
import { GOAL_TARGET } from './types';

function getSupabaseKey() {
  return process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
}

export function getClient() {
  return createSupabaseClient(getSupabaseKey());
}

export function enrichLead(lead: Lead): LeadWithMeta {
  return {
    ...lead,
    meta: parseNotes(lead.notes),
    shortId: shortId(lead.id),
  };
}

export async function fetchLeads(limit = 200, source = SOURCE): Promise<LeadWithMeta[]> {
  try {
    await sweepLeadLifecycle();
  } catch {
    /* lifecycle sweep is best-effort */
  }
  const { sbSelect } = getClient();
  const rows = (await sbSelect(
    'ni_brain_outreach',
    `source=eq.${source}&status=neq.purged&select=*&order=created_at.desc&limit=${limit}`
  )) as Lead[];
  const leads = filterVisibleLeads((rows || []).map(enrichLead));

  // Decision #1888 Phase 3 (BUILD-ARTIFACT-PIPELINE-OUTREACH-INTEGRATION-0914-03):
  // mirror every NI Services lead awaiting human review into nvg_review_artifacts
  // so it can be approved/edited through the NI Portal Ops review gate. Explicitly
  // scoped to source === SOURCE ('axon_ni_services') — Match Fit (source ===
  // MATCH_FIT_SOURCE) is out of scope for Decision #1888, same carve-out CONTENT's
  // Phase 4 already made. Best-effort, same idiom as sweepLeadLifecycle() above.
  if (source === SOURCE) {
    for (const lead of leads) {
      if (lead.status === 'pending_approval' && lead.comment_draft) {
        try {
          await draftOutreachReviewArtifact(lead);
        } catch {
          /* review-artifact mirroring is best-effort */
        }
      }
    }
  }

  return leads;
}

export async function fetchLeadById(id: string): Promise<LeadWithMeta | null> {
  const { sbSelect } = getClient();
  const rows = (await sbSelect(
    'ni_brain_outreach',
    `source=eq.${SOURCE}&id=eq.${id}&select=*&limit=1`
  )) as Lead[];
  const lead = rows?.[0];
  return lead ? enrichLead(lead) : null;
}

/**
 * ARTIFACT_GENERATION_CLAIM sentinel: written into the `artifact_url` column
 * to atomically "claim" a lead for artifact generation before any GitHub
 * write is attempted (see claimLeadForArtifactBackfill below). Chosen so it
 * also satisfies isNiServicesLeadEligibleForArtifact()'s own `artifact_url`
 * truthy check — a claimed-but-not-yet-generated lead reads as "already has
 * one" to any other caller until the claim resolves or is released.
 */
const ARTIFACT_GENERATION_CLAIM = '__ni_services_artifact_generating__';

/** Atomic claim: succeeds only if this row still has no artifact_url. */
async function claimLeadForArtifactBackfill(id: string): Promise<boolean> {
  const { sbPatch } = getClient();
  const claimed = await sbPatch(
    'ni_brain_outreach',
    `id=eq.${encodeURIComponent(id)}&artifact_url=is.null`,
    { artifact_url: ARTIFACT_GENERATION_CLAIM }
  );
  return Boolean(claimed);
}

/** Release a claim this run made (only ever clears our own sentinel value). */
async function releaseLeadArtifactBackfillClaim(id: string): Promise<void> {
  const { sbPatch } = getClient();
  await sbPatch(
    'ni_brain_outreach',
    `id=eq.${encodeURIComponent(id)}&artifact_url=eq.${encodeURIComponent(ARTIFACT_GENERATION_CLAIM)}`,
    { artifact_url: null }
  );
}

/** Live on/off switch, same automation_controls convention as outreach-sender. Defaults OFF. */
async function isArtifactBackfillEnabled(): Promise<boolean> {
  const { sbSelect } = getClient();
  const rows = (await sbSelect(
    'automation_controls',
    `scope=eq.${encodeURIComponent('ni.artifact_backfill')}&select=enabled&limit=1`
  )) as { enabled?: boolean }[];
  return Boolean(rows?.[0]?.enabled);
}

/**
 * NI-OUTREACH-ARTIFACT-GAP-0914 / NI-OUTREACH-ARTIFACT-CONCURRENCY-0915:
 * explicit, on-purpose entry point for NI Services artifact generation — NOT
 * called from fetchLeads()/fetchLeadById() or any other ordinary read path.
 * Council review on PR #247 found the original inline-on-every-read wiring
 * fired a live external GitHub push (plus a DB write) as a side effect of an
 * ordinary page load, with no on/off switch and no concurrency guard, so two
 * overlapping reads could double-generate/double-push the same lead. This
 * function is the fix: it only runs when a human or the scheduler calls it
 * on purpose (see src/app/api/cron/ni-services-artifact-backfill/route.ts),
 * it no-ops unless the `ni.artifact_backfill` automation_controls switch is
 * explicitly ON, and it claims each lead atomically before generating so
 * concurrent invocations can't collide on the same row.
 */
export async function runNiServicesArtifactBackfill(
  opts: { limit?: number; scanLimit?: number } = {}
): Promise<{ enabled: boolean; scanned: number; generated: number }> {
  const { limit = 3, scanLimit = 50 } = opts;

  if (!(await isArtifactBackfillEnabled())) {
    return { enabled: false, scanned: 0, generated: 0 };
  }

  const { sbSelect } = getClient();
  const rows = (await sbSelect(
    'ni_brain_outreach',
    `source=eq.${SOURCE}&status=neq.purged&artifact_url=is.null&select=*&order=created_at.asc&limit=${scanLimit}`
  )) as Lead[];

  const generated = await backfillNiServicesArtifacts(rows || [], {
    limit,
    claim: claimLeadForArtifactBackfill,
    release: releaseLeadArtifactBackfillClaim,
    persist: (id: string, patch: Record<string, unknown>) => updateLeadStatus(id, patch),
    onError: (err: unknown, lead: { id?: string }) => {
      console.warn(
        `NI Services artifact generation failed for lead ${lead?.id}: ${
          err instanceof Error ? err.message : String(err)
        }`
      );
    },
  });

  return { enabled: true, scanned: rows?.length || 0, generated };
}

export async function findLeadByShortId(sid: string): Promise<LeadWithMeta | null> {
  const leads = await fetchLeads(100);
  return leads.find((l) => l.shortId === sid || l.id === sid) ?? null;
}

export async function fetchPipelineStats(source = SOURCE): Promise<PipelineStats> {
  const { sbSelect } = getClient();
  const today = todayUtc();

  const [statusRows, todayRows] = await Promise.all([
    sbSelect('ni_brain_outreach', `source=eq.${source}&select=status&limit=500`) as Promise<
      { status?: string }[]
    >,
    sbSelect(
      'ni_brain_outreach',
      `source=eq.${source}&created_at=gte.${today}T00:00:00Z&select=id`
    ) as Promise<{ id: string }[]>,
  ]);

  const counts: Record<string, number> = {};
  for (const row of statusRows || []) {
    const s = row.status || 'unknown';
    counts[s] = (counts[s] || 0) + 1;
  }

  return {
    total: statusRows?.length || 0,
    pending: counts.pending_approval || 0,
    approved: counts.approved || 0,
    sent: counts.sent || 0,
    dead: counts.dead || 0,
    closedWon: counts.closed_won || 0,
    goalTarget: GOAL_TARGET,
    draftsToday: todayRows?.length || 0,
    draftsCap: MAX_DRAFTS_PER_DAY,
    counts,
  };
}

export async function updateLeadStatus(id: string, patch: Partial<Lead>) {
  const { sbPatch } = getClient();
  return sbPatch('ni_brain_outreach', `id=eq.${id}`, patch);
}

export async function updateLeadNotes(id: string, meta: Record<string, unknown>) {
  return updateLeadStatus(id, { notes: formatNotes(meta) });
}

export async function bulkUpdateLeads(
  ids: string[],
  patch: Partial<Lead> & { metaPatch?: Record<string, unknown> }
) {
  const { sbSelect, sbPatch } = getClient();
  const { metaPatch, ...leadPatch } = patch;
  const results: string[] = [];

  for (const id of ids) {
    if (metaPatch) {
      const rows = (await sbSelect(
        'ni_brain_outreach',
        `source=eq.${SOURCE}&id=eq.${id}&select=notes&limit=1`
      )) as { notes: string | null }[];
      const meta = { ...parseNotes(rows?.[0]?.notes), ...metaPatch };
      await sbPatch('ni_brain_outreach', `id=eq.${id}`, {
        ...leadPatch,
        notes: formatNotes(meta),
      });
    } else {
      await sbPatch('ni_brain_outreach', `id=eq.${id}`, leadPatch);
    }
    results.push(id);
  }

  return results;
}

export async function addWaitlistEmail(email: string) {
  const { sbInsert } = getClient();
  const today = todayUtc();
  return sbInsert('arm3_weekly_logs', {
    week_of: today,
    log_type: 'axon_waitlist',
    summary: `Waitlist signup: ${email}`,
    detail: { email, signed_up_at: new Date().toISOString() },
    action_required: false,
  });
}
