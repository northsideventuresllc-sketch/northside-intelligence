-- NI Store v2 Phase 1: viral catalog, daily picks, personalization events.

CREATE TABLE IF NOT EXISTS public.ni_store_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_url text,
  category text NOT NULL DEFAULT 'general',
  tags text[] NOT NULL DEFAULT '{}',
  source_platform text NOT NULL DEFAULT 'curated'
    CHECK (source_platform IN ('cj', 'aliexpress', 'temu', 'amazon', 'curated')),
  source_product_id text,
  source_url text,
  supplier_cost_cents integer NOT NULL CHECK (supplier_cost_cents >= 0),
  retail_price_cents integer NOT NULL CHECK (retail_price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  estimated_delivery_days integer NOT NULL DEFAULT 12,
  trend_score numeric(8,4) NOT NULL DEFAULT 0,
  site_score numeric(8,4) NOT NULL DEFAULT 0,
  review_rating numeric(3,2),
  review_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ni_store_viral_picks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pick_date date NOT NULL,
  rank integer NOT NULL CHECK (rank BETWEEN 1 AND 10),
  catalog_id uuid NOT NULL REFERENCES public.ni_store_catalog(id) ON DELETE CASCADE,
  viral_score numeric(10,4) NOT NULL DEFAULT 0,
  trend_source text NOT NULL DEFAULT 'blended',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pick_date, rank),
  UNIQUE (pick_date, catalog_id)
);

CREATE TABLE IF NOT EXISTS public.ni_store_user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  web_tracking_enabled boolean NOT NULL DEFAULT false,
  interest_tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  niche_weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ni_store_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_type text NOT NULL
    CHECK (event_type IN ('view', 'click', 'search', 'purchase', 'carousel_impression')),
  catalog_id uuid REFERENCES public.ni_store_catalog(id) ON DELETE SET NULL,
  search_query text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ni_store_catalog_active_category_idx
  ON public.ni_store_catalog (active, category);

CREATE INDEX IF NOT EXISTS ni_store_catalog_tags_gin_idx
  ON public.ni_store_catalog USING gin (tags);

CREATE INDEX IF NOT EXISTS ni_store_viral_picks_date_idx
  ON public.ni_store_viral_picks (pick_date DESC, rank);

CREATE INDEX IF NOT EXISTS ni_store_events_type_created_idx
  ON public.ni_store_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS ni_store_events_catalog_created_idx
  ON public.ni_store_events (catalog_id, created_at DESC)
  WHERE catalog_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ni_store_events_user_created_idx
  ON public.ni_store_events (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.ni_store_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_viral_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ni_store_catalog IS 'Dropship catalog — supplier_cost_cents is server-only; UI shows retail_price_cents only.';
COMMENT ON TABLE public.ni_store_viral_picks IS 'Global top-10 viral products, refreshed every 24h.';
COMMENT ON TABLE public.ni_store_user_preferences IS 'Per-user store personalization and web-tracking opt-in.';
COMMENT ON TABLE public.ni_store_events IS 'Self-learning feedback loop: views, clicks, searches, purchases.';

-- Seed catalog: trending-style products (supplier cost hidden from API responses)
INSERT INTO public.ni_store_catalog (
  slug, name, description, image_url, category, tags,
  source_platform, supplier_cost_cents, retail_price_cents,
  estimated_delivery_days, trend_score, review_rating, review_count
) VALUES
  (
    'portable-blender-usb',
    'Portable USB Blender',
    'Blend smoothies anywhere — rechargeable, leak-proof cup for gym, office, and travel.',
    'https://images.unsplash.com/photo-1570222094114-d0544f1341fa?w=400&h=400&fit=crop',
    'kitchen', ARRAY['kitchen', 'portable', 'fitness', 'viral'],
    'curated', 1800, 1980, 10, 92.5, 4.6, 2840
  ),
  (
    'magnetic-phone-mount',
    'MagSafe Magnetic Phone Mount',
    'Strong magnetic car and desk mount — one-hand docking, 360° rotation, fits most phones.',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop',
    'tech', ARRAY['tech', 'phone', 'car', 'viral'],
    'curated', 900, 990, 8, 88.0, 4.5, 5120
  ),
  (
    'led-desk-lamp-touch',
    'Touch LED Desk Lamp',
    'Eye-care dimmable lamp with USB charging port — minimalist design, 3 color modes.',
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop',
    'home', ARRAY['home', 'office', 'lighting', 'viral'],
    'curated', 2200, 2420, 12, 85.5, 4.7, 1930
  ),
  (
    'pet-water-fountain',
    'Automatic Pet Water Fountain',
    'Quiet circulating fountain keeps water fresh — cats and small dogs love it.',
    'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop',
    'pets', ARRAY['pets', 'home', 'viral'],
    'curated', 2500, 2750, 14, 90.0, 4.8, 3670
  ),
  (
    'posture-corrector',
    'Smart Posture Corrector',
    'Lightweight back brace with vibration reminder — improve desk posture in 2 weeks.',
    'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
    'health', ARRAY['health', 'fitness', 'office', 'viral'],
    'curated', 1400, 1540, 9, 87.0, 4.4, 2210
  ),
  (
    'mini-projector-hd',
    'Mini HD Projector',
    'Pocket-sized 1080p projector for movies and gaming — HDMI and wireless screen mirror.',
    'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=400&fit=crop',
    'tech', ARRAY['tech', 'entertainment', 'viral'],
    'curated', 6500, 7150, 15, 94.0, 4.5, 890
  ),
  (
    'silicone-food-storage',
    'Collapsible Silicone Food Containers',
    'Stackable, microwave-safe meal prep containers — saves fridge space.',
    'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400&h=400&fit=crop',
    'kitchen', ARRAY['kitchen', 'home', 'meal-prep'],
    'curated', 1600, 1760, 10, 82.0, 4.6, 1450
  ),
  (
    'wireless-earbuds-pro',
    'Wireless Earbuds Pro',
    'Active noise canceling, 32hr battery case, IPX5 sweat resistant — gym and commute ready.',
    'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    'tech', ARRAY['tech', 'audio', 'viral'],
    'curated', 3200, 3520, 11, 96.5, 4.7, 8920
  ),
  (
    'yoga-mat-extra-thick',
    'Extra Thick Yoga Mat',
    'Non-slip 10mm mat with carrying strap — home workouts and hot yoga.',
    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400&h=400&fit=crop',
    'fitness', ARRAY['fitness', 'health', 'yoga'],
    'curated', 2000, 2200, 10, 79.0, 4.8, 3100
  ),
  (
    'car-vacuum-cordless',
    'Cordless Car Vacuum',
    'Compact handheld vacuum with HEPA filter — detail crevice tool included.',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    'auto', ARRAY['auto', 'home', 'cleaning', 'viral'],
    'curated', 2800, 3080, 12, 86.5, 4.5, 1780
  ),
  (
    'sunset-lamp-projector',
    'Sunset Lamp Projector',
    'TikTok-famous ambient light — transforms any room into golden hour vibes.',
    'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=400&h=400&fit=crop',
    'home', ARRAY['home', 'decor', 'viral', 'tiktok'],
    'curated', 1500, 1650, 9, 98.0, 4.6, 6540
  ),
  (
    'ice-roller-face',
    'Stainless Steel Ice Roller',
    'De-puff and soothe skin — morning skincare essential trending on social.',
    'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&h=400&fit=crop',
    'beauty', ARRAY['beauty', 'skincare', 'viral'],
    'curated', 1100, 1210, 8, 91.0, 4.5, 4200
  ),
  (
    'portable-monitor-15',
    '15.6" Portable Monitor',
    'USB-C second screen for laptop — plug and play for remote work anywhere.',
    'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop',
    'tech', ARRAY['tech', 'office', 'remote-work', 'viral'],
    'curated', 8900, 9790, 14, 89.5, 4.6, 720
  ),
  (
    'smart-plug-wifi',
    'WiFi Smart Plug 4-Pack',
    'Voice control with Alexa and Google — schedule lights and appliances from your phone.',
    'https://images.unsplash.com/photo-1558002038-1055907df827?w=400&h=400&fit=crop',
    'smart-home', ARRAY['smart-home', 'tech', 'viral'],
    'curated', 2400, 2640, 10, 84.0, 4.7, 2890
  ),
  (
    'weighted-blanket-15lb',
    '15lb Weighted Blanket',
    'Calming sleep blanket with breathable cotton cover — reduces anxiety, deeper rest.',
    'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=400&fit=crop',
    'home', ARRAY['home', 'sleep', 'wellness', 'viral'],
    'curated', 4500, 4950, 12, 83.5, 4.8, 2340
  )
ON CONFLICT (slug) DO NOTHING;
