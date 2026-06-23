-- Persist CJ variant selection on catalog order line items.

ALTER TABLE public.ni_store_order_items
  ADD COLUMN IF NOT EXISTS variant_id text;

COMMENT ON COLUMN public.ni_store_order_items.variant_id IS 'CJ variation id when the buyer selected a specific option.';
