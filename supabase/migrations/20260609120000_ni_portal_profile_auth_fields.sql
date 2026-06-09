-- Username + optional 2FA for NI portal accounts
ALTER TABLE public.ni_portal_profiles
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS two_factor_enabled boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS ni_portal_profiles_username_unique
  ON public.ni_portal_profiles (lower(username))
  WHERE username IS NOT NULL;
