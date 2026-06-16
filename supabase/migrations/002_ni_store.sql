-- NI Store v1: physical merchandise catalog, orders, and CJ/Make fulfillment hooks.

CREATE TABLE IF NOT EXISTS public.ni_store_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  image_url text,
  cj_product_id text,
  stripe_price_id text,
  is_mock boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ni_store_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_checkout_session_id text UNIQUE,
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'fulfillment_sent', 'failed', 'cancelled')),
  customer_email text,
  shipping jsonb,
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'usd',
  make_webhook_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ni_store_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.ni_store_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.ni_store_products(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ni_store_products_active_sort_idx
  ON public.ni_store_products (active, sort_order);

CREATE INDEX IF NOT EXISTS ni_store_orders_user_id_idx
  ON public.ni_store_orders (user_id);

CREATE INDEX IF NOT EXISTS ni_store_order_items_order_id_idx
  ON public.ni_store_order_items (order_id);

ALTER TABLE public.ni_store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ni_store_order_items ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.ni_store_products IS 'NI merch catalog — mock rows until CJDropshipping SKUs are mapped.';
COMMENT ON TABLE public.ni_store_orders IS 'Paid store orders; Make.com webhook fires after Stripe checkout.';
COMMENT ON TABLE public.ni_store_order_items IS 'Line items for ni_store_orders.';

-- Mock catalog (preview only — checkout blocked via is_mock + store gate)
INSERT INTO public.ni_store_products (slug, name, description, price_cents, image_url, is_mock, sort_order)
VALUES
  (
    'ni-emblem-tee',
    'NI Emblem Tee',
    'Soft cotton tee with the Northside Intelligence hex emblem. Mock listing for storefront preview.',
    3200,
    '/ni-emblem.svg',
    true,
    1
  ),
  (
    'sector3-cap',
    'Sector 3 Cap',
    'Structured cap with embroidered Sector 3 mark. Mock listing until CJDropshipping is wired.',
    2800,
    '/logo.png',
    true,
    2
  ),
  (
    'intelligence-mug',
    'Intelligence Mug',
    'Ceramic mug — “We find the gaps and make it better.” Mock listing for design preview.',
    2200,
    '/logo-full.png',
    true,
    3
  )
ON CONFLICT (slug) DO NOTHING;
