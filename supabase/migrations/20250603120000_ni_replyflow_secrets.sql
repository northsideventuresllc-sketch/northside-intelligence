-- ReplyFlow secrets RPC (reads from Supabase Vault; service_role only)
CREATE OR REPLACE FUNCTION public.ni_replyflow_get_secrets()
RETURNS TABLE(
  gateway_secret text,
  anthropic_api_key text,
  stripe_secret_key text,
  stripe_webhook_secret text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public', 'vault'
AS $$
  SELECT
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ni_portal_admin_secret' LIMIT 1),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ni_anthropic_api_key' LIMIT 1),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ni_stripe_secret_key' LIMIT 1),
    (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'ni_stripe_webhook_secret' LIMIT 1);
$$;

REVOKE ALL ON FUNCTION public.ni_replyflow_get_secrets() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ni_replyflow_get_secrets() TO service_role;
