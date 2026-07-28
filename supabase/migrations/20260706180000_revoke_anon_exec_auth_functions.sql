-- F3/W15 security fix: remove anon (and unintended authenticated) EXECUTE
-- from NI Portal auth helper functions.
--
-- ni_auth_email_exists and ni_portal_email_for_login were declared
-- service_role-only in migrations 20260612120000 and 20260615220000, but the
-- live database drifted: anon and authenticated re-gained EXECUTE (Supabase
-- default privileges re-apply when a function is recreated). Both are only
-- ever called through the service-role client in the portal API routes, so
-- anon exposure via /rest/v1/rpc/* was a SECURITY DEFINER enumeration risk
-- (email existence / username-to-email resolution).
--
-- handle_replyflow_new_user is an auth.users trigger function; triggers fire
-- without a runtime EXECUTE check, so no client role needs EXECUTE on it.
--
-- Intentionally untouched: auth.uid()/auth.jwt()/auth.role()/auth.email()
-- (Supabase built-ins required by RLS policies for anon and authenticated).

REVOKE EXECUTE ON FUNCTION public.ni_auth_email_exists(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ni_auth_email_exists(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.ni_portal_email_for_login(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ni_portal_email_for_login(text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.handle_replyflow_new_user() FROM PUBLIC, anon, authenticated;
