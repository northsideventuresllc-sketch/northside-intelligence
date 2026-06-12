-- Backfill portal profiles for auth.users missing ni_portal_profiles rows.
-- Fixes username sign-in for legacy accounts (e.g. jonnybooth22).

INSERT INTO public.ni_portal_profiles (
  id,
  email,
  full_name,
  username,
  two_factor_enabled,
  created_at,
  updated_at
)
SELECT
  u.id,
  lower(u.email),
  nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
  nullif(lower(trim(u.raw_user_meta_data->>'username')), ''),
  true,
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.ni_portal_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Keep replyflow profile emails aligned with auth.users.
UPDATE public.replyflow_profiles rp
SET
  email = lower(u.email),
  updated_at = now()
FROM auth.users u
WHERE rp.id = u.id
  AND lower(rp.email) IS DISTINCT FROM lower(u.email);

-- Ensure subscriptions exist for backfilled users.
INSERT INTO public.ni_subscriptions (id, tier, updated_at)
SELECT u.id, 'free', now()
FROM auth.users u
LEFT JOIN public.ni_subscriptions s ON s.id = u.id
WHERE s.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Helper for signup email uniqueness checks (service role only).
CREATE OR REPLACE FUNCTION public.ni_auth_email_exists(check_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(check_email))
  );
$$;

REVOKE ALL ON FUNCTION public.ni_auth_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ni_auth_email_exists(text) TO service_role;
