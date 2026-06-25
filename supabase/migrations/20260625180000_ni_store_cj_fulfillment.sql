-- CJ direct fulfillment metadata on store orders
ALTER TABLE public.ni_store_orders
  ADD COLUMN IF NOT EXISTS cj_order_id text,
  ADD COLUMN IF NOT EXISTS cj_order_status text,
  ADD COLUMN IF NOT EXISTS cj_pay_url text;

CREATE INDEX IF NOT EXISTS ni_store_orders_cj_order_id_idx
  ON public.ni_store_orders (cj_order_id)
  WHERE cj_order_id IS NOT NULL;

COMMENT ON COLUMN public.ni_store_orders.cj_order_id IS 'CJ Dropshipping order ID after direct API fulfillment.';
COMMENT ON COLUMN public.ni_store_orders.cj_order_status IS 'Latest CJ order status (CREATED, UNPAID, UNSHIPPED, etc.).';
COMMENT ON COLUMN public.ni_store_orders.cj_pay_url IS 'CJ payment page URL when balance payment failed.';
