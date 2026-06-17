-- NI Store Phase 4: catalog line items on orders

ALTER TABLE public.ni_store_order_items
  ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE public.ni_store_order_items
  ADD COLUMN IF NOT EXISTS catalog_id uuid REFERENCES public.ni_store_catalog(id),
  ADD COLUMN IF NOT EXISTS product_slug text,
  ADD COLUMN IF NOT EXISTS product_name text,
  ADD COLUMN IF NOT EXISTS source_product_id text,
  ADD COLUMN IF NOT EXISTS shipping_tier text NOT NULL DEFAULT 'standard'
    CHECK (shipping_tier IN ('standard', 'expedited'));

CREATE INDEX IF NOT EXISTS ni_store_order_items_catalog_id_idx
  ON public.ni_store_order_items (catalog_id)
  WHERE catalog_id IS NOT NULL;
