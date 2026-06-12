-- Rename NI tiers: standard→core, premium→pro, ultimate→power
-- Update NI plan and tool pricing to new subscription amounts

ALTER TABLE public.ni_subscriptions DROP CONSTRAINT IF EXISTS ni_subscriptions_tier_check;
ALTER TABLE public.ni_plan_pricing DROP CONSTRAINT IF EXISTS ni_plan_pricing_tier_check;

UPDATE public.ni_subscriptions SET tier = 'core' WHERE tier = 'standard';
UPDATE public.ni_subscriptions SET tier = 'pro' WHERE tier = 'premium';
UPDATE public.ni_subscriptions SET tier = 'power' WHERE tier = 'ultimate';

UPDATE public.ni_plan_pricing SET tier = 'core' WHERE tier = 'standard';
UPDATE public.ni_plan_pricing SET tier = 'pro' WHERE tier = 'premium';
UPDATE public.ni_plan_pricing SET tier = 'power' WHERE tier = 'ultimate';

ALTER TABLE public.ni_subscriptions ADD CONSTRAINT ni_subscriptions_tier_check
  CHECK (tier IN ('free', 'core', 'pro', 'power'));

ALTER TABLE public.ni_plan_pricing ADD CONSTRAINT ni_plan_pricing_tier_check
  CHECK (tier IN ('core', 'pro', 'power'));

-- Sync Sector 3 tool subscription prices from market catalog
UPDATE public.ni_tool_pricing SET
  base_monthly_usd = 19.00,
  monthly_price_usd = 21.85,
  annual_price_usd = 218.50,
  lifetime_price_usd = 458.85,
  demand_multiplier = 1.150,
  updated_at = now()
WHERE tool_slug = 'replyflow';

UPDATE public.ni_tool_pricing SET
  base_monthly_usd = 39.00,
  monthly_price_usd = 39.00,
  annual_price_usd = 390.00,
  lifetime_price_usd = 819.00,
  demand_multiplier = 1.000,
  updated_at = now()
WHERE tool_slug = 'grantbot';

UPDATE public.ni_tool_pricing SET
  base_monthly_usd = 24.00,
  monthly_price_usd = 24.00,
  annual_price_usd = 240.00,
  lifetime_price_usd = 504.00,
  demand_multiplier = 1.000,
  updated_at = now()
WHERE tool_slug = 'signaldesk';

UPDATE public.ni_tool_pricing SET
  base_monthly_usd = 18.00,
  monthly_price_usd = 18.00,
  annual_price_usd = 180.00,
  lifetime_price_usd = 378.00,
  demand_multiplier = 1.000,
  updated_at = now()
WHERE tool_slug = 'gapscan';

UPDATE public.ni_tool_pricing SET
  base_monthly_usd = 29.00,
  monthly_price_usd = 33.35,
  annual_price_usd = 333.50,
  lifetime_price_usd = 700.35,
  demand_multiplier = 1.150,
  updated_at = now()
WHERE tool_slug = 'bridgeai';
