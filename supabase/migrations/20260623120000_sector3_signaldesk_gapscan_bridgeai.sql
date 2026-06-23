-- Signal Desk, GapScan, BridgeAI — profiles, sessions, and arm3 registry rows

-- signaldesk_profiles
CREATE TABLE IF NOT EXISTS public.signaldesk_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'lite', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  signals_used_this_month integer NOT NULL DEFAULT 0,
  signals_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signaldesk_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own signaldesk profile"
  ON public.signaldesk_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users update own signaldesk profile"
  ON public.signaldesk_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- gapscan_profiles
CREATE TABLE IF NOT EXISTS public.gapscan_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'lite', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  scans_used_this_month integer NOT NULL DEFAULT 0,
  scans_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gapscan_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gapscan profile"
  ON public.gapscan_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users update own gapscan profile"
  ON public.gapscan_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- bridgeai_profiles
CREATE TABLE IF NOT EXISTS public.bridgeai_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  tier text NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'lite', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  workflows_used_this_month integer NOT NULL DEFAULT 0,
  workflows_reset_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bridgeai_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bridgeai profile"
  ON public.bridgeai_profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users update own bridgeai profile"
  ON public.bridgeai_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- sessions
CREATE TABLE IF NOT EXISTS public.signaldesk_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  focus_area text NOT NULL DEFAULT 'General',
  input_summary text NOT NULL,
  result_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS signaldesk_sessions_user_created_idx
  ON public.signaldesk_sessions(user_id, created_at DESC);

ALTER TABLE public.signaldesk_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own signaldesk sessions"
  ON public.signaldesk_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own signaldesk sessions"
  ON public.signaldesk_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.gapscan_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type text NOT NULL DEFAULT 'Workflow',
  input_summary text NOT NULL,
  result_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gapscan_sessions_user_created_idx
  ON public.gapscan_sessions(user_id, created_at DESC);

ALTER TABLE public.gapscan_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own gapscan sessions"
  ON public.gapscan_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own gapscan sessions"
  ON public.gapscan_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.bridgeai_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_system text NOT NULL DEFAULT '',
  target_system text NOT NULL DEFAULT '',
  input_summary text NOT NULL,
  result_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bridgeai_sessions_user_created_idx
  ON public.bridgeai_sessions(user_id, created_at DESC);

ALTER TABLE public.bridgeai_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own bridgeai sessions"
  ON public.bridgeai_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own bridgeai sessions"
  ON public.bridgeai_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- arm3_tools registry
INSERT INTO public.arm3_tools (slug, name, description, status, category, target_user, pricing_model, price_usd)
VALUES
  (
    'signaldesk',
    'Signal Desk',
    'Unified intelligence signals hub — prioritize market and competitive signals in one brief.',
    'live',
    'Intelligence',
    'Analysts, marketers, and operators monitoring market signals',
    'freemium',
    24
  ),
  (
    'gapscan',
    'GapScan',
    'Automated workflow gap detection — find friction, whitespace, and missing steps fast.',
    'live',
    'Productivity',
    'Product teams and founders identifying market and feature gaps',
    'freemium',
    18
  ),
  (
    'bridgeai',
    'BridgeAI',
    'Cross-platform AI orchestration — integration plans that connect your stack.',
    'live',
    'Orchestration',
    'Ops and engineering teams bridging workflows with AI orchestration',
    'freemium',
    29
  )
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status,
  category = EXCLUDED.category,
  target_user = EXCLUDED.target_user,
  pricing_model = EXCLUDED.pricing_model,
  price_usd = EXCLUDED.price_usd,
  updated_at = now();

-- arm3_opportunities (approved, marked launched — built directly in portal)
INSERT INTO public.arm3_opportunities (
  name, description, market_signal, estimated_margin_pct, build_complexity,
  priority_score, status, flagged_for_jonny, notes, sector3_slug, launched_at
)
SELECT * FROM (
  VALUES
    (
      'Signal Desk',
      'Unified intelligence signals hub. User pastes raw signals and gets a prioritized brief with actions.',
      'Operators drowning in alerts need one desk to rank what matters.',
      86::numeric, 'low', 92, 'approved', true,
      'Sector 3 intelligence tool — portal-hosted at /signaldesk',
      'signaldesk', now()
    ),
    (
      'GapScan',
      'Workflow and market gap detection. User describes context and gets severity-ranked gaps.',
      'Founders and PMs need fast gap audits without consultants.',
      84::numeric, 'low', 88, 'approved', true,
      'Sector 3 productivity tool — portal-hosted at /gapscan',
      'gapscan', now()
    ),
    (
      'BridgeAI',
      'Cross-platform orchestration planner. User connects two systems and gets an integration playbook.',
      'Small teams stitch tools manually — orchestration plans are high value.',
      82::numeric, 'medium', 86, 'approved', true,
      'Sector 3 orchestration tool — portal-hosted at /bridgeai',
      'bridgeai', now()
    )
) AS v(name, description, market_signal, estimated_margin_pct, build_complexity, priority_score, status, flagged_for_jonny, notes, sector3_slug, launched_at)
WHERE NOT EXISTS (
  SELECT 1 FROM public.arm3_opportunities o WHERE o.sector3_slug = v.sector3_slug
);

-- backfill profiles for existing users
INSERT INTO public.signaldesk_profiles (id, email, tier, signals_used_this_month, signals_reset_at, created_at, updated_at)
SELECT u.id, lower(u.email), 'free', 0, now(), now(), now()
FROM auth.users u
LEFT JOIN public.signaldesk_profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.gapscan_profiles (id, email, tier, scans_used_this_month, scans_reset_at, created_at, updated_at)
SELECT u.id, lower(u.email), 'free', 0, now(), now(), now()
FROM auth.users u
LEFT JOIN public.gapscan_profiles p ON p.id = u.id
WHERE p.id IS NULL;

INSERT INTO public.bridgeai_profiles (id, email, tier, workflows_used_this_month, workflows_reset_at, created_at, updated_at)
SELECT u.id, lower(u.email), 'free', 0, now(), now(), now()
FROM auth.users u
LEFT JOIN public.bridgeai_profiles p ON p.id = u.id
WHERE p.id IS NULL;
