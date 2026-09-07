-- NI-STORE-SHIP-OVERESTIMATE-0817 / PART13: mark orders that priced shipping
-- from the flat-rate placeholder (CJ freight unavailable/empty) instead of a
-- real CJ freight quote, so reconcile-order.ts and manual audits can see it.
ALTER TABLE public.ni_store_orders
  ADD COLUMN IF NOT EXISTS shipping_source text;

COMMENT ON COLUMN public.ni_store_orders.shipping_source IS
  'cj (real CJ freight quote) | fallback_flat_rate (estimateShippingCents placeholder used because CJ freight failed/returned no options) | null (order predates this column).';

CREATE INDEX IF NOT EXISTS ni_store_orders_shipping_source_idx
  ON public.ni_store_orders (shipping_source)
  WHERE shipping_source = 'fallback_flat_rate';
