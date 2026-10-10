-- ============================================================================
-- NEEDS JB APPROVAL — do not apply.
-- Per rulebook R-DB-001, schema changes are never applied by agents directly.
-- ============================================================================
--
-- Workstream 10 (client-readiness sweep): 72-hour visitor email capture.
--
-- The moment a visitor enters their email anywhere on northsideintelligence.com
-- (waitlists, service quote requests, portal signup, feedback forms, store
-- order tracking, store checkout), the app writes one row here via the
-- service-role API (`recordEmailCapture` in src/lib/tracking/email-capture.ts).
--
-- Retention contract (disclosed in ToS/Privacy by Workstream 11):
--   * Stored: email address + sha256 hash + source page/tool + captured_at.
--     Nothing else. No passwords, no message bodies.
--   * Every row expires exactly 72 hours after capture (expires_at).
--   * A Vercel cron (GET /api/cron/email-capture-cleanup, hourly, declared in
--     vercel.json) deletes all rows with expires_at < now(). Storage is never
--     indefinite — rows cannot outlive 72h + up to one cron interval.
--   * Re-entering the same email refreshes the 72h window (dedupe by
--     email_hash); it never extends retention beyond 72h from last capture.

CREATE TABLE IF NOT EXISTS public.email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  email_hash text NOT NULL,
  source_page text,
  source_tool text NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '72 hours'),
  followed_up_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_captures_expires_at
  ON public.email_captures (expires_at);

CREATE INDEX IF NOT EXISTS idx_email_captures_hash
  ON public.email_captures (email_hash);

-- Backend table: no user-facing policies (service role only).
-- Same convention as ni_promo_segments / ni_user_segment_assignments.
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.email_captures IS
  'Visitor email captures for 72h follow-up (WS10). Purged hourly by /api/cron/email-capture-cleanup. NEEDS JB APPROVAL — do not apply before approval.';
