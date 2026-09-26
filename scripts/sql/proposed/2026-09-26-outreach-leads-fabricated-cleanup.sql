-- LRN-CLUSTER-OUTREACH-DATA-0925
-- PROPOSED, NOT APPLIED. A human/authorized session must run this against
-- NI-Brain (kxijunwgbrlfzvgkhklo). Never touches a real person's contact
-- data destructively -- this is a status/rejected_reason UPDATE, not a
-- DELETE, so the rows stay auditable.
--
-- Confirmed live 2026-09-26 (SELECT only, no write):
--   1) 3 rows, source='axon_outreach_scout', full_name ending "AgentBot",
--      no profile_url/email/handle at all -- synthetic placeholders, not
--      real businesses:
--        78c92e83-5ade-4d10-b07e-1f94396ca527  Agent Souk Base Bazaar
--        5f713a82-ec16-45f1-b7b0-5c83577e67ba  Agent Nexus Router
--        9526f9b1-74e1-4279-b3e1-9eef34a9acd1  Torquantis Autonomous Order Book
--   2) The named August dead-end contacts from the source Learning
--      (source='hand_researched_2026-08-26'), status already 'dead' or
--      'sent' with no confirmed live contact -- Dennis Plumbing Co.,
--      Kay Nails, Just Great Grooming (ids below). This SQL marks them
--      'rejected' with a reason rather than silently leaving them 'sent'/
--      'dead' with no note of why, so a future dedupe/report does not
--      re-surface them as live leads.
--
-- Rollback: UPDATE outreach_leads SET status = <original>, rejected_reason = NULL
-- WHERE id IN (<same id list>) -- original statuses recorded in the SELECT
-- comment above (all 'new' for the axon_outreach_scout batch; 'dead'/'sent'
-- for the three named August rows).

BEGIN;

UPDATE outreach_leads
SET status = 'rejected',
    rejected_reason = 'fabricated: synthetic placeholder lead (AgentBot-style name, no reachable channel) -- LRN-CLUSTER-OUTREACH-DATA-0925',
    updated_at = now()
WHERE id IN (
  '78c92e83-5ade-4d10-b07e-1f94396ca527',
  '5f713a82-ec16-45f1-b7b0-5c83577e67ba',
  '9526f9b1-74e1-4279-b3e1-9eef34a9acd1'
);

UPDATE outreach_leads
SET status = 'rejected',
    rejected_reason = 'dead end: no confirmed reachable named contact behind the scraped profile_url -- LRN-CLUSTER-OUTREACH-DATA-0925',
    updated_at = now()
WHERE id IN (
  'fba55a19-43c9-4df7-a23a-f373c8a6de97', -- Just Great Grooming
  '391a5f15-b7de-4a7d-a53b-60eecf18fa39', -- Kay Nails
  'c75bc77e-3642-459e-b7c3-31c8f59cd783'  -- Dennis Plumbing Co.
);

-- Verify before COMMIT:
-- SELECT id, company, status, rejected_reason FROM outreach_leads
-- WHERE id IN ('78c92e83-5ade-4d10-b07e-1f94396ca527','5f713a82-ec16-45f1-b7b0-5c83577e67ba',
--   '9526f9b1-74e1-4279-b3e1-9eef34a9acd1','fba55a19-43c9-4df7-a23a-f373c8a6de97',
--   '391a5f15-b7de-4a7d-a53b-60eecf18fa39','c75bc77e-3642-459e-b7c3-31c8f59cd783');

COMMIT;
-- (or ROLLBACK; if the verify SELECT doesn't look right)

-- The ticket's other named finding -- "8 August web-design leads never made
-- it into the DB" (a sync gap, not a bad row) -- could not be independently
-- confirmed from any of the 7 repo clones checked out here: no local record
-- of which 8 leads that refers to was found in outreach_leads, ni_brain_outreach,
-- or any session log grepped in this pass. Needs whoever holds that original
-- August lead list to identify the missing 8 so they can be backfilled; not
-- guessed here.
