-- Persist GrantBot search and draft results so users can revisit their work.

CREATE TABLE IF NOT EXISTS public.grantbot_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL CHECK (mode IN ('search', 'draft')),
  org_description text NOT NULL,
  category text NOT NULL DEFAULT '',
  grant_title text,
  funder text,
  prompt_questions text,
  result_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS grantbot_sessions_user_created_idx
  ON public.grantbot_sessions(user_id, created_at DESC);

ALTER TABLE public.grantbot_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own grantbot sessions"
  ON public.grantbot_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own grantbot sessions"
  ON public.grantbot_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own grantbot sessions"
  ON public.grantbot_sessions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

ALTER TABLE public.grantbot_profiles
  ADD COLUMN IF NOT EXISTS last_mode text,
  ADD COLUMN IF NOT EXISTS last_category text;
