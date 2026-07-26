import 'server-only';

import { getClient } from './leads';

export type RedditOpportunity = {
  id: string;
  kind: 'promo' | 'pain';
  subreddit: string;
  title: string;
  url: string | null;
  why: string | null;
  product: string | null;
  draft_comment: string | null;
  status: 'new' | 'approved' | 'rejected' | 'posted';
  rules_note: string | null;
  score: number;
  created_at: string;
};

/**
 * NIP-404-TOOLS — Reddit Machine.
 *
 * Two jobs: find subreddits that allow promotion, and find threads where
 * someone has the problem an NI product solves.
 *
 * Non-negotiables baked in here, from the spec and the Morality Code:
 * - Approve-only. Nothing is ever posted without JB pressing approve.
 * - Human-sounding is not the same as deceptive. Every draft names the product
 *   as ours; we never pose as an unaffiliated happy customer.
 * - Subreddit rules are surfaced next to the draft, so an approval is informed.
 */
export const DISCLOSURE_LINE = "Full disclosure, I build this — so take it with that in mind.";

export async function listOpportunities(): Promise<RedditOpportunity[]> {
  const { sbSelect } = getClient();
  const rows = await sbSelect(
    'reddit_opportunities',
    'select=*&status=neq.rejected&order=created_at.desc&limit=100',
  );
  return (rows || []) as RedditOpportunity[];
}

export async function setOpportunityStatus(
  id: string,
  status: RedditOpportunity['status'],
): Promise<void> {
  const { sbPatch } = getClient();
  await sbPatch('reddit_opportunities', `id=eq.${id}`, {
    status,
    updated_at: new Date().toISOString(),
  });
}

export async function updateDraft(id: string, draft: string): Promise<void> {
  const { sbPatch } = getClient();
  await sbPatch('reddit_opportunities', `id=eq.${id}`, {
    draft_comment: draft,
    updated_at: new Date().toISOString(),
  });
}

/**
 * Every generated draft must carry the disclosure. This is enforced here rather
 * than left to the prompt, so a model that "forgets" cannot produce something
 * that reads as an unaffiliated recommendation.
 */
export function ensureDisclosure(comment: string): string {
  const body = comment.trim();
  if (/\b(i build|i made|i work on|my product|full disclosure|i'?m the founder)\b/i.test(body)) {
    return body;
  }
  return `${body}\n\n${DISCLOSURE_LINE}`;
}
