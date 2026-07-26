/**
 * NIP-OUTREACH-HQ-REBUILD — one place that turns internal status codes into
 * words JB actually uses. Nothing in the outreach UI should render a raw
 * database value or an acronym; if a new status appears here without a label,
 * it falls back to a de-underscored version rather than shouting jargon.
 */
const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  drafted: 'Draft ready',
  pending_approval: 'Waiting on you',
  approved: 'Approved to send',
  scheduled: 'Scheduled',
  sent: 'Sent',
  replied: 'They replied',
  closed_won: 'Became a customer',
  dead: 'No answer',
  rejected: 'Passed on',
  purged: 'Deleted',
  archived: 'Archived',
  icp_auto: 'Filtered out — wrong fit',
};

export function plainStatus(status: string): string {
  const hit = STATUS_LABELS[status];
  if (hit) return hit;
  const spaced = status.replace(/_/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Short line explaining what a status means, for tooltips and empty states. */
const STATUS_HELP: Record<string, string> = {
  drafted: 'Message written, not sent. It needs your approval first.',
  pending_approval: 'Sitting on your approval screen right now.',
  approved: 'You said yes — it goes out on the next send run.',
  sent: 'Already left. Waiting to hear back.',
  dead: 'No reply after the full follow-up sequence.',
  icp_auto: 'Auto-filtered before it reached you — not the kind of person we want.',
};

export function statusHelp(status: string): string | undefined {
  return STATUS_HELP[status];
}
