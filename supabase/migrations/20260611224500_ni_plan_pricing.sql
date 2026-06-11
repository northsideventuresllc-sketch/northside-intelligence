CREATE TABLE IF NOT EXISTS public.ni_plan_pricing (
  tier text PRIMARY KEY CHECK (tier IN ('standard', 'premium', 'ultimate')),
  stripe_monthly_price_id text,
  stripe_annual_price_id text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ni_plan_pricing ENABLE ROW LEVEL SECURITY;
