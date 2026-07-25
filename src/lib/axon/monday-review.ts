import { getClient } from './leads';

export type MondayReviewRow = {
  message_id: string;
  lead_id: string;
  venture: string | null;
  channel: string | null;
  who: string | null;
  company: string | null;
  city: string | null;
  niche: string | null;
  why_them: string | null;
  score: number | null;
  subject: string | null;
  message: string | null;
  step: string | null;
  profile_url: string | null;
  source: string | null;
  drafted_at: string | null;
};

/**
 * Rows waiting for JB's Monday approval.
 * Junk guard (JB 2026-07-25): a draft is only shown if it has a real person/company,
 * a message body, and is not an obvious mislabelled row. JB must never be asked to
 * approve slop — bad rows are surfaced separately as "needs cleanup", never as approvable.
 */
export function isApprovable(r: MondayReviewRow): boolean {
  const who = (r.who || '').trim();
  const msg = (r.message || '').trim();
  if (!who || msg.length < 40) return false;
  // Match Fit targets VIRTUAL / online coaches nationwide (NOT Atlanta geo, NOT consultants).
  if ((r.venture || '').toLowerCase() === 'match_fit') {
    const blob = `${who} ${r.niche || ''} ${r.why_them || ''} ${msg}`.toLowerCase();
    const consultingNoise =
      /\b(mckinsey|bain|deloitte|accenture|fractional coo|management consult|ai governance|advisory firm)\b/.test(
        blob,
      );
    if (consultingNoise) return false;
  }
  return true;
}

export async function fetchMondayReview(): Promise<{
  approvable: MondayReviewRow[];
  needsCleanup: MondayReviewRow[];
}> {
  const { sbSelect } = getClient();
  const rows = ((await sbSelect(
    'outreach_monday_review',
    'select=*&order=score.desc.nullslast&limit=200',
  )) || []) as MondayReviewRow[];
  const approvable: MondayReviewRow[] = [];
  const needsCleanup: MondayReviewRow[] = [];
  for (const r of rows) (isApprovable(r) ? approvable : needsCleanup).push(r);
  return { approvable, needsCleanup };
}

/** JB ticks boxes → approve. Server-side cap enforced by the Postgres function. */
export async function approveMessages(
  messageIds: string[],
  approvedBy = 'JB',
  dailyCap = 25,
): Promise<{ venture: string; batchId: string; approved: number }[]> {
  if (!messageIds.length) return [];
  const { sbRpc } = getClient();
  const rows =
    ((await sbRpc('outreach_approve', {
      p_message_ids: messageIds,
      p_approved_by: approvedBy,
      p_daily_cap: dailyCap,
    })) as { out_venture: string; out_batch_id: string; out_approved: number }[]) || [];
  return rows.map((r) => ({
    venture: r.out_venture,
    batchId: r.out_batch_id,
    approved: r.out_approved,
  }));
}

export async function rejectMessages(
  messageIds: string[],
  reason = 'not a fit',
): Promise<number> {
  if (!messageIds.length) return 0;
  const { sbRpc } = getClient();
  const n = (await sbRpc('outreach_reject', {
    p_message_ids: messageIds,
    p_reason: reason,
  })) as number | null;
  return typeof n === 'number' ? n : 0;
}

/**
 * Purge the junk pile in one shot. JB approved 2026-07-25: mislabelled
 * NI-consulting rows must never reach the approval list.
 */
export async function purgeJunk(reason = 'junk draft — wrong ICP'): Promise<number> {
  const { needsCleanup } = await fetchMondayReview();
  return rejectMessages(
    needsCleanup.map((r) => r.message_id),
    reason,
  );
}
