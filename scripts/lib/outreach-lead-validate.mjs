/**
 * LRN-CLUSTER-OUTREACH-DATA-0925 — real-contact validation before an outreach
 * lead is written to NI-Brain `outreach_leads`.
 *
 * Confirmed live (2026-09-26) fabricated/dead-end rows this closes the gap
 * for:
 *  - source='axon_outreach_scout': 3 rows with full_name like "<X> AgentBot"
 *    and no profile_url/contact at all -- not a real business, a synthetic
 *    placeholder (ids 78c92e83, 5f713a82, 9526f9b1).
 *  - source='hand_researched_2026-08-26': named dead-end contacts (Dennis
 *    Plumbing Co., Kay Nails, Just Great Grooming, ...) that had a
 *    plausible-looking Facebook profile_url but no verifiable named contact
 *    or working channel -- 5 of 8 from that August batch turned out to be
 *    dead ends per the source Learning.
 *
 * This module does NOT touch the live table -- it is a pre-insert gate any
 * caller (a future scout/finder script) should run before writing a row. The
 * one-time cleanup of the rows already in the table is a separate proposed
 * SQL file (scripts/sql/proposed/2026-09-26-outreach-leads-fabricated-cleanup.sql),
 * not applied by this module or this PR.
 */

const AGENTBOT_NAME_RE = /\bagentbot\b/i;

/**
 * @param {object} lead - shape matching the outreach_leads columns this repo
 *   actually writes (see AXON's outreach-sender.ts / a future scout writer).
 * @returns {{ ok: boolean, reasons: string[] }}
 */
export function validateLeadContact(lead) {
  const reasons = [];
  const fullName = (lead?.full_name ?? '').trim();
  const company = (lead?.company ?? '').trim();
  const profileUrl = (lead?.profile_url ?? '').trim();
  const email = (lead?.email ?? '').trim();
  const handle = (lead?.handle ?? '').trim();

  // 1) A synthetic/placeholder name is never a real contact, regardless of
  //    what else is filled in.
  if (AGENTBOT_NAME_RE.test(fullName) || AGENTBOT_NAME_RE.test(company)) {
    reasons.push('full_name/company looks synthetic (matches "AgentBot")');
  }

  // 2) At least one reachable channel is required -- a lead with no email,
  //    no handle and no profile_url can never actually be contacted, so it
  //    should never have been written as a lead in the first place.
  if (!email && !handle && !profileUrl) {
    reasons.push('no reachable channel: email, handle and profile_url are all empty');
  }

  // 3) A profile_url alone, with no full_name and no email, is the exact
  //    shape of the August dead-end batch (a scraped business page with no
  //    verified named contact behind it) -- allow it through as a WEAK lead
  //    (reasons still recorded) rather than hard-rejecting, since it is a
  //    legitimate lower-confidence lead type, but never let it claim a
  //    higher score/priority than a lead with a real named contact.
  if (profileUrl && !fullName && !email) {
    reasons.push('profile_url only, no named contact and no email — weak lead, must not be scored as high-confidence');
  }

  const hardFail = reasons.some((r) => r.startsWith('full_name/company looks synthetic') || r.startsWith('no reachable channel'));

  return { ok: !hardFail, reasons };
}

export default { validateLeadContact };
