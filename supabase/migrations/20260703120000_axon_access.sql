-- AXON access codes: issued on subscription purchase; changeable inside AXON portal.

CREATE TABLE IF NOT EXISTS public.axon_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_code_hash text NOT NULL,
  access_code_salt text NOT NULL,
  code_sent_at timestamptz,
  last_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS axon_access_updated_at_idx ON public.axon_access (updated_at DESC);

ALTER TABLE public.axon_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY axon_access_select_own ON public.axon_access
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY axon_access_update_own ON public.axon_access
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.axon_access IS 'Hashed AXON entry codes — plaintext only sent once via email on purchase.';
