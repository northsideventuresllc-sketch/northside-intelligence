-- Close the latent gap behind CONTENT-MACHINE-BRAND-SLUG-MISLABEL-0914.
--
-- The 2026-09-07 fix (generator.ts generateSlotWithQualityGate) made a banned-phrase
-- hit a hard-fail instead of a flagged-but-inserted draft, specifically to stop
-- Match-Fit-branded copy landing under an NI-family brand_slug. That mechanism only
-- works if the brand's own banned_phrases actually contains the phrase that leaked --
-- and for every NI-family brand it only contained the literal string "Match Fit".
--
-- The 10 real mislabeled posts this ticket was filed over (content_machine_posts,
-- brand_slug in ni/ni-store/ni-webdesign, created 2026-09-02 to 2026-09-04, all
-- already status=rejected) never said "Match Fit" verbatim -- they said "Fitness Pro",
-- "FitHub", and "founding member", Match Fit's own product vocabulary. So today's
-- hard-fail gate would NOT have caught them either, despite already being live: the
-- banned_phrases data was never updated with the words that actually caused the leak.
-- Those 10 rows are dead (rejected, predate both the 09-07 gate fix and the 09-11
-- AXON Content Research agent retirement) -- this migration is not a data cleanup,
-- it is closing the gap so the same leak can't recur if generation resumes for these
-- brands.

update public.content_machine_brand_profiles
set banned_phrases = (
  select jsonb_agg(distinct phrase)
  from jsonb_array_elements_text(
    banned_phrases || '["Fitness Pro","Fitness Pros","FitHub","founding member"]'::jsonb
  ) as phrase
)
where slug in ('ni','ni-store','ni-webdesign','bridgeai','gapscan','grantbot','replyflow','signaldesk');
