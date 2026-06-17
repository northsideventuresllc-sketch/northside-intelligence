-- Account type (personal / business) on portal profiles
ALTER TABLE public.ni_portal_profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'personal'
    CHECK (account_type IN ('personal', 'business')),
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS business_website text,
  ADD COLUMN IF NOT EXISTS business_size text;

-- Service request submissions (requires authenticated portal account)
CREATE TABLE IF NOT EXISTS public.ni_service_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  service_slug text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('personal', 'business')),
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'declined', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ni_service_requests_user_id_idx
  ON public.ni_service_requests (user_id);

CREATE INDEX IF NOT EXISTS ni_service_requests_service_slug_idx
  ON public.ni_service_requests (service_slug);

ALTER TABLE public.ni_service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY ni_service_requests_select_own
  ON public.ni_service_requests
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY ni_service_requests_insert_own
  ON public.ni_service_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
