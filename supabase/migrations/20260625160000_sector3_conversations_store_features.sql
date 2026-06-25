-- Sector 3 persistent chat conversations + user context learning
-- Smart Store: search history, wishlist, price watches

-- Sector 3 conversations (per tool per user)
CREATE TABLE IF NOT EXISTS public.sector3_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  title text NOT NULL DEFAULT 'New Chat',
  archived_at timestamptz,
  archive_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sector3_conversations_user_tool
  ON public.sector3_conversations(user_id, tool_slug, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sector3_conversations_archive_expiry
  ON public.sector3_conversations(archive_expires_at)
  WHERE archived_at IS NOT NULL;

-- Sector 3 chat messages
CREATE TABLE IF NOT EXISTS public.sector3_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.sector3_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sector3_chat_messages_conversation
  ON public.sector3_chat_messages(conversation_id, created_at ASC);

-- Sector 3 per-user context learning (aggregated preferences per tool)
CREATE TABLE IF NOT EXISTS public.sector3_user_context (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  context_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tool_slug)
);

-- Smart Store search history (clicked/viewed items, 365-day retention)
CREATE TABLE IF NOT EXISTS public.ni_store_search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.ni_store_catalog(id) ON DELETE SET NULL,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  image_url text,
  retail_price_cents int,
  viewed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ni_store_search_history_user
  ON public.ni_store_search_history(user_id, viewed_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ni_store_search_history_user_slug
  ON public.ni_store_search_history(user_id, product_slug);

-- Smart Store wishlist
CREATE TABLE IF NOT EXISTS public.ni_store_wishlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.ni_store_catalog(id) ON DELETE SET NULL,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  image_url text,
  retail_price_cents int,
  variant_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ni_store_wishlist_user_slug_variant
  ON public.ni_store_wishlist(user_id, product_slug, COALESCE(variant_id, ''));

CREATE INDEX IF NOT EXISTS idx_ni_store_wishlist_user
  ON public.ni_store_wishlist(user_id, created_at DESC);

-- Smart Store price watches
CREATE TABLE IF NOT EXISTS public.ni_store_price_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  catalog_id uuid REFERENCES public.ni_store_catalog(id) ON DELETE SET NULL,
  product_slug text NOT NULL,
  product_name text NOT NULL,
  variant_id text,
  baseline_retail_cents int NOT NULL,
  last_known_retail_cents int NOT NULL,
  last_notified_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ni_store_price_watches_user_slug_variant
  ON public.ni_store_price_watches(user_id, product_slug, COALESCE(variant_id, ''))
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_ni_store_price_watches_active
  ON public.ni_store_price_watches(active, updated_at)
  WHERE active = true;

-- RLS
ALTER TABLE public.sector3_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector3_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sector3_user_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_price_watches ENABLE ROW LEVEL SECURITY;

CREATE POLICY sector3_conversations_own ON public.sector3_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY sector3_chat_messages_own ON public.sector3_chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.sector3_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.sector3_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY sector3_user_context_own ON public.sector3_user_context
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY ni_store_search_history_own ON public.ni_store_search_history
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY ni_store_wishlist_own ON public.ni_store_wishlist
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY ni_store_price_watches_own ON public.ni_store_price_watches
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extend notification categories for price alerts
ALTER TABLE public.ni_notifications DROP CONSTRAINT IF EXISTS ni_notifications_category_check;
ALTER TABLE public.ni_notifications ADD CONSTRAINT ni_notifications_category_check
  CHECK (category IN (
    'store_order', 'promo', 'usage_limit', 'announcement', 'billing', 'general', 'price_alert'
  ));

ALTER TABLE public.ni_notification_preferences DROP CONSTRAINT IF EXISTS ni_notification_preferences_category_check;
ALTER TABLE public.ni_notification_preferences ADD CONSTRAINT ni_notification_preferences_category_check
  CHECK (category IN (
    'store_order', 'promo', 'usage_limit', 'announcement', 'billing', 'general', 'price_alert'
  ));
