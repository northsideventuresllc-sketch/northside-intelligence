-- Resolve email or username to auth email for portal sign-in (service role only).

CREATE OR REPLACE FUNCTION public.ni_portal_email_for_login(login_identifier text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  resolved_email TEXT;
  trimmed TEXT;
BEGIN
  trimmed := lower(trim(login_identifier));

  IF trimmed IS NULL OR trimmed = '' THEN
    RETURN NULL;
  END IF;

  -- Allow @username style identifiers.
  IF trimmed LIKE '@%' AND trimmed !~ '^[^@]+@[^@]+\.[^@]+$' THEN
    trimmed := ltrim(trimmed, '@');
  END IF;

  IF trimmed ~ '^[^@]+@[^@]+\.[^@]+$' THEN
    RETURN trimmed;
  END IF;

  SELECT lower(p.email) INTO resolved_email
  FROM public.ni_portal_profiles p
  WHERE lower(p.username) = trimmed
  LIMIT 1;

  IF resolved_email IS NOT NULL THEN
    RETURN resolved_email;
  END IF;

  SELECT lower(u.email) INTO resolved_email
  FROM auth.users u
  WHERE lower(u.raw_user_meta_data->>'username') = trimmed
  LIMIT 1;

  RETURN resolved_email;
END;
$$;

REVOKE ALL ON FUNCTION public.ni_portal_email_for_login(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ni_portal_email_for_login(text) TO service_role;
