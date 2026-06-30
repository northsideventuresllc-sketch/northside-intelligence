-- Lock down ni_billing_get_stripe_secrets: service_role only.
-- Function exposes Stripe secret key; must not be callable by portal users.
-- JB approves + executes manually — do not auto-apply.

REVOKE ALL ON FUNCTION public.ni_billing_get_stripe_secrets() FROM authenticated;
REVOKE ALL ON FUNCTION public.ni_billing_get_stripe_secrets() FROM anon;
REVOKE ALL ON FUNCTION public.ni_billing_get_stripe_secrets() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.ni_billing_get_stripe_secrets() TO service_role;
