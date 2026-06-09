-- NI portal subscriptions, toolkit entitlements, and per-tool pricing

-- Portal-level NI subscription (Free tier tracked here; no Stripe for free)
CREATE TABLE IF NOT EXISTS public.ni_subscriptions (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tier text NOT NULL DEFAULT 'free'
    CHECK (tier IN ('free', 'standard', 'premium', 'ultimate')),
  billing_interval text
    CHECK (billing_interval IS NULL OR billing_interval IN ('monthly', 'annual')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ni_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own NI subscription"
  ON public.ni_subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Toolkit: tools a user has access to (lifetime, per-tool sub, or NI plan slot)
CREATE TABLE IF NOT EXISTS public.ni_toolkit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  access_type text NOT NULL
    CHECK (access_type IN ('lifetime', 'tool_subscription', 'ni_plan')),
  expires_at timestamptz,
  stripe_subscription_id text,
  purchased_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_slug)
);

CREATE INDEX IF NOT EXISTS ni_toolkit_user_id_idx ON public.ni_toolkit(user_id);
CREATE INDEX IF NOT EXISTS ni_toolkit_expires_at_idx ON public.ni_toolkit(expires_at)
  WHERE expires_at IS NOT NULL;

ALTER TABLE public.ni_toolkit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own toolkit"
  ON public.ni_toolkit FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Per-tool pricing (auto-generated; Stripe price IDs synced via setup script)
CREATE TABLE IF NOT EXISTS public.ni_tool_pricing (
  tool_slug text PRIMARY KEY,
  base_monthly_usd numeric(10,2) NOT NULL,
  monthly_price_usd numeric(10,2) NOT NULL,
  annual_price_usd numeric(10,2) NOT NULL,
  lifetime_price_usd numeric(10,2) NOT NULL,
  demand_multiplier numeric(6,3) NOT NULL DEFAULT 1.000,
  stripe_monthly_price_id text,
  stripe_annual_price_id text,
  stripe_lifetime_price_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ni_tool_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tool pricing"
  ON public.ni_tool_pricing FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed pricing for intelligence tools from arm3_tools market data
INSERT INTO public.ni_tool_pricing (
  tool_slug, base_monthly_usd, monthly_price_usd, annual_price_usd, lifetime_price_usd, demand_multiplier
) VALUES
  ('replyflow', 19.00, 19.00, 190.00, 399.00, 1.150),
  ('grantbot', 39.00, 39.00, 390.00, 799.00, 1.000),
  ('signaldesk', 24.00, 24.00, 240.00, 499.00, 1.080),
  ('gapscan', 18.00, 18.00, 180.00, 379.00, 1.050),
  ('bridgeai', 29.00, 29.00, 290.00, 599.00, 1.120)
ON CONFLICT (tool_slug) DO NOTHING;

-- Seed free tier for existing portal users
INSERT INTO public.ni_subscriptions (id, tier)
SELECT id, 'free' FROM public.ni_portal_profiles
ON CONFLICT (id) DO NOTHING;

-- Expire toolkit entries and downgrade NI subscription when period ends
CREATE OR REPLACE FUNCTION public.expire_ni_entitlements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Remove expired non-lifetime toolkit entries
  DELETE FROM public.ni_toolkit
  WHERE access_type != 'lifetime'
    AND expires_at IS NOT NULL
    AND expires_at < now();

  -- Downgrade expired NI subscriptions to free
  UPDATE public.ni_subscriptions
  SET
    tier = 'free',
    billing_interval = NULL,
    stripe_subscription_id = NULL,
    current_period_end = NULL,
    updated_at = now()
  WHERE tier != 'free'
    AND current_period_end IS NOT NULL
    AND current_period_end < now();

  -- Remove NI plan toolkit slots when subscription expired
  DELETE FROM public.ni_toolkit tk
  USING public.ni_subscriptions ns
  WHERE tk.user_id = ns.id
    AND tk.access_type = 'ni_plan'
    AND ns.tier = 'free';
END;
$$;
