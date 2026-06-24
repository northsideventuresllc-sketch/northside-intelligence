-- Promos, notifications, email list, and backend audience segments.

-- Email list fields on portal profiles
ALTER TABLE public.ni_portal_profiles
  ADD COLUMN IF NOT EXISTS email_list_subscribed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_list_subscribed_at timestamptz,
  ADD COLUMN IF NOT EXISTS kit_subscriber_id text;

-- Backend-only audience segments (never exposed to users)
CREATE TABLE IF NOT EXISTS public.ni_promo_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  label_internal text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}'::jsonb,
  priority int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- User-to-segment assignments (backend only)
CREATE TABLE IF NOT EXISTS public.ni_user_segment_assignments (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES public.ni_promo_segments(id) ON DELETE CASCADE,
  score_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, segment_id)
);

CREATE INDEX IF NOT EXISTS idx_ni_user_segment_assignments_user
  ON public.ni_user_segment_assignments(user_id);

-- User promos
CREATE TABLE IF NOT EXISTS public.ni_promos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  promo_type text NOT NULL CHECK (
    promo_type IN ('store_discount', 'tool_free_months', 'feature_access', 'manual')
  ),
  title text NOT NULL,
  description text NOT NULL,
  promo_code text,
  discount_percent numeric(5,2) CHECK (discount_percent IS NULL OR (discount_percent >= 0 AND discount_percent <= 100)),
  free_months int CHECK (free_months IS NULL OR (free_months >= 1 AND free_months <= 3)),
  tool_slug text,
  feature_slug text,
  store_product_slug text,
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  is_manual boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ni_promos_user_active
  ON public.ni_promos(user_id, expires_at DESC)
  WHERE claimed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ni_promos_expires
  ON public.ni_promos(expires_at)
  WHERE claimed_at IS NULL;

-- Promo email campaigns (automated + manual)
CREATE TABLE IF NOT EXISTS public.ni_promo_email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_type text NOT NULL CHECK (
    campaign_type IN (
      'weekly_promo',
      'product_launch',
      'store_deal',
      'announcement',
      'promo_expiring',
      'manual'
    )
  ),
  subject text NOT NULL,
  body_html text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  segment_slugs text[] NOT NULL DEFAULT '{}',
  promo_code text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Email campaign events for self-learning
CREATE TABLE IF NOT EXISTS public.ni_promo_email_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid REFERENCES public.ni_promo_email_campaigns(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (
    event_type IN ('sent', 'open', 'click', 'conversion', 'unsubscribe')
  ),
  revenue_cents int NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ni_promo_email_events_campaign
  ON public.ni_promo_email_events(campaign_id, event_type);

-- In-app notifications
CREATE TABLE IF NOT EXISTS public.ni_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (
    category IN (
      'store_order',
      'promo',
      'usage_limit',
      'announcement',
      'billing',
      'general'
    )
  ),
  title text NOT NULL,
  body text NOT NULL,
  link text,
  read_at timestamptz,
  email_sent_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ni_notifications_user_unread
  ON public.ni_notifications(user_id, created_at DESC)
  WHERE read_at IS NULL;

-- Notification preferences per category
CREATE TABLE IF NOT EXISTS public.ni_notification_preferences (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (
    category IN (
      'store_order',
      'promo',
      'usage_limit',
      'announcement',
      'billing',
      'general'
    )
  ),
  in_app_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, category)
);

-- Seed default backend segments (internal labels only)
INSERT INTO public.ni_promo_segments (slug, label_internal, criteria, priority)
VALUES
  ('tier_power', 'High tier subscribers', '{"min_tier":"power"}'::jsonb, 100),
  ('tier_pro', 'Pro tier subscribers', '{"min_tier":"pro"}'::jsonb, 80),
  ('tier_core', 'Core tier subscribers', '{"min_tier":"core"}'::jsonb, 60),
  ('tier_free_active', 'Free tier active users', '{"tier":"free","min_sessions_30d":3}'::jsonb, 40),
  ('tier_free_dormant', 'Free tier dormant users', '{"tier":"free","max_sessions_30d":2}'::jsonb, 20),
  ('payment_consistent', 'Consistent payers', '{"min_paid_months":3}'::jsonb, 90),
  ('payment_new', 'Recent first-time payers', '{"max_paid_months":1}'::jsonb, 50),
  ('store_engaged', 'Smart Store engaged', '{"min_store_orders":1}'::jsonb, 70),
  ('tool_power_user', 'High tool usage', '{"min_tool_sessions_30d":10}'::jsonb, 75)
ON CONFLICT (slug) DO NOTHING;

-- RLS: users can only see their own promos and notifications
ALTER TABLE public.ni_promos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Backend tables: no user-facing policies (service role only)
ALTER TABLE public.ni_promo_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_user_segment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_promo_email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_promo_email_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY ni_promos_select_own ON public.ni_promos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ni_notifications_select_own ON public.ni_notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ni_notifications_update_own ON public.ni_notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY ni_notification_prefs_select_own ON public.ni_notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY ni_notification_prefs_upsert_own ON public.ni_notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Allow users to read email_list_subscribed on their own profile (already covered by profile RLS if exists)
-- Profile email list fields updated via service role API routes only.
