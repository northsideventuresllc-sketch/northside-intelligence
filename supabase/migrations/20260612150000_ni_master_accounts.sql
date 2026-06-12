-- Master accounts: permanent unlimited access to all Sector 3 tools and future NI products.

ALTER TABLE public.ni_portal_profiles
  ADD COLUMN IF NOT EXISTS is_master_account boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS ni_portal_profiles_is_master_account_idx
  ON public.ni_portal_profiles (is_master_account)
  WHERE is_master_account = true;

-- Designate @jonnybooth22 as a master account.
UPDATE public.ni_portal_profiles
SET
  is_master_account = true,
  updated_at = now()
WHERE lower(username) = 'jonnybooth22';

-- Grant lifetime toolkit entries for all current intelligence tools.
INSERT INTO public.ni_toolkit (user_id, tool_slug, access_type, expires_at, purchased_at, updated_at)
SELECT
  p.id,
  tool.slug,
  'lifetime',
  NULL,
  now(),
  now()
FROM public.ni_portal_profiles p
CROSS JOIN (
  VALUES
    ('replyflow'),
    ('grantbot'),
    ('signaldesk'),
    ('gapscan'),
    ('bridgeai')
) AS tool(slug)
WHERE p.is_master_account = true
ON CONFLICT (user_id, tool_slug) DO UPDATE
SET
  access_type = 'lifetime',
  expires_at = NULL,
  updated_at = now();

-- Master accounts are never downgraded by entitlement expiry sweeps.
CREATE OR REPLACE FUNCTION public.expire_ni_entitlements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.ni_toolkit tk
  WHERE tk.access_type != 'lifetime'
    AND tk.expires_at IS NOT NULL
    AND tk.expires_at < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = tk.user_id
        AND p.is_master_account = true
    );

  UPDATE public.ni_subscriptions ns
  SET
    tier = 'free',
    billing_interval = NULL,
    stripe_subscription_id = NULL,
    current_period_end = NULL,
    updated_at = now()
  WHERE ns.tier != 'free'
    AND ns.current_period_end IS NOT NULL
    AND ns.current_period_end < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = ns.id
        AND p.is_master_account = true
    );

  DELETE FROM public.ni_toolkit tk
  USING public.ni_subscriptions ns
  WHERE tk.user_id = ns.id
    AND tk.access_type = 'ni_plan'
    AND ns.tier = 'free'
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = tk.user_id
        AND p.is_master_account = true
    );
END;
$$;
