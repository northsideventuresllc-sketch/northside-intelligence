-- NI-OUTREACH-ARTIFACT-GAP-0914: Decision #1888 (2026-09-11) locked the spec that
-- OUTREACH delivers an individualized interactive HTML site preview for every NI
-- Services lead with no existing website. `ni_brain_outreach` had no column at all
-- to hold that deliverable's link, so nothing could store or serve it. This adds
-- the missing column; see src/lib/axon/ni-services-artifact-pipeline.mjs for the
-- generator that populates it.
ALTER TABLE public.ni_brain_outreach
  ADD COLUMN IF NOT EXISTS artifact_url text;

COMMENT ON COLUMN public.ni_brain_outreach.artifact_url IS
  'Link to this lead''s generated deliverable artifact — for source=axon_ni_services (NI Services) leads with no existing website, the individualized interactive HTML site preview built for that business (Decision #1888). Raw-content URL (e.g. raw.githubusercontent.com) served through /api/leads/[id]/deliverable, which never exposes storage credentials to the browser. Null until generated; null forever for lead types with no artifact deliverable (e.g. Match Fit).';

CREATE INDEX IF NOT EXISTS ni_brain_outreach_artifact_url_pending_idx
  ON public.ni_brain_outreach (source)
  WHERE artifact_url IS NULL;
