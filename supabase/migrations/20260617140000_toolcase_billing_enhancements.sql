-- Sector 3 per-tool pricing (ReplyFlow $15/mo) and Tool Case enhancements.

-- ReplyFlow unlimited monthly subscription at $15.00
UPDATE public.ni_tool_pricing
SET
  base_monthly_usd = 15.00,
  monthly_price_usd = 15.00,
  annual_price_usd = 150.00,
  lifetime_price_usd = 315.00,
  demand_multiplier = 1.000,
  updated_at = now()
WHERE tool_slug = 'replyflow';

-- Tool Case: allow free-tier toolkit entries (tool must be added before use).
ALTER TABLE public.ni_toolkit
  DROP CONSTRAINT IF EXISTS ni_toolkit_access_type_check;

ALTER TABLE public.ni_toolkit
  ADD CONSTRAINT ni_toolkit_access_type_check
  CHECK (access_type IN ('free', 'lifetime', 'tool_subscription', 'ni_plan'));

-- Track when an unlimited NI-plan slot was assigned (for 72h swap cooldown).
ALTER TABLE public.ni_toolkit
  ADD COLUMN IF NOT EXISTS unlimited_assigned_at timestamptz;

-- Track last unlimited-tool swap across NI plan slots.
ALTER TABLE public.ni_subscriptions
  ADD COLUMN IF NOT EXISTS last_unlimited_swap_at timestamptz;

-- Billing grace: downgrade only after period end + 48 hours.
CREATE OR REPLACE FUNCTION public.expire_ni_entitlements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove expired non-lifetime toolkit entries (after grace period).
  DELETE FROM public.ni_toolkit tk
  WHERE tk.access_type IN ('tool_subscription', 'ni_plan')
    AND tk.expires_at IS NOT NULL
    AND tk.expires_at < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = tk.user_id
        AND p.is_master_account = true
    );

  -- Downgrade expired NI subscriptions after 48h grace past period end.
  UPDATE public.ni_subscriptions ns
  SET
    tier = 'free',
    billing_interval = NULL,
    stripe_subscription_id = NULL,
    current_period_end = NULL,
    updated_at = now()
  WHERE ns.tier != 'free'
    AND ns.current_period_end IS NOT NULL
    AND ns.current_period_end + interval '48 hours' < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = ns.id
        AND p.is_master_account = true
    );

  -- Remove NI plan toolkit slots when subscription lapsed (after grace).
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

  -- Downgrade paid tool subscriptions to free toolkit access after lapse.
  UPDATE public.ni_toolkit tk
  SET
    access_type = 'free',
    expires_at = NULL,
    stripe_subscription_id = NULL,
    unlimited_assigned_at = NULL,
    updated_at = now()
  WHERE tk.access_type = 'tool_subscription'
    AND tk.expires_at IS NOT NULL
    AND tk.expires_at < now()
    AND NOT EXISTS (
      SELECT 1
      FROM public.ni_portal_profiles p
      WHERE p.id = tk.user_id
        AND p.is_master_account = true
    );
END;
$$;
