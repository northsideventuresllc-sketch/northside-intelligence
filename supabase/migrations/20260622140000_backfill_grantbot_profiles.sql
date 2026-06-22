-- Backfill grantbot_profiles for auth.users missing rows (same pattern as replyflow on signup).

INSERT INTO public.grantbot_profiles (
  id,
  email,
  tier,
  grants_used_this_month,
  grants_reset_at,
  created_at,
  updated_at
)
SELECT
  u.id,
  lower(u.email),
  'free',
  0,
  now(),
  u.created_at,
  now()
FROM auth.users u
LEFT JOIN public.grantbot_profiles gp ON gp.id = u.id
WHERE gp.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Keep grantbot profile emails aligned with auth.users.
UPDATE public.grantbot_profiles gp
SET
  email = lower(u.email),
  updated_at = now()
FROM auth.users u
WHERE gp.id = u.id
  AND lower(gp.email) IS DISTINCT FROM lower(u.email);
