-- Store order economics and reconciliation
ALTER TABLE public.ni_store_orders
  ADD COLUMN IF NOT EXISTS subtotal_cents integer,
  ADD COLUMN IF NOT EXISTS shipping_charged_cents integer,
  ADD COLUMN IF NOT EXISTS shipping_stipend_cents integer,
  ADD COLUMN IF NOT EXISTS supplier_cost_cents integer,
  ADD COLUMN IF NOT EXISTS cj_product_cost_cents integer,
  ADD COLUMN IF NOT EXISTS cj_postage_cents integer,
  ADD COLUMN IF NOT EXISTS stripe_fee_cents integer,
  ADD COLUMN IF NOT EXISTS target_profit_cents integer,
  ADD COLUMN IF NOT EXISTS actual_profit_cents integer,
  ADD COLUMN IF NOT EXISTS reconciliation_status text,
  ADD COLUMN IF NOT EXISTS reconciliation_adjustment_cents integer,
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_payment_method_id text,
  ADD COLUMN IF NOT EXISTS fulfillment_deadline_at timestamptz,
  ADD COLUMN IF NOT EXISTS reconciliation_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS fulfillment_action_required_at timestamptz;

ALTER TABLE public.ni_store_order_items
  ADD COLUMN IF NOT EXISTS supplier_cost_cents integer;

COMMENT ON COLUMN public.ni_store_orders.reconciliation_status IS
  'pending | balanced | refunded | charged | failed_charge | action_required';

CREATE INDEX IF NOT EXISTS ni_store_orders_reconciliation_status_idx
  ON public.ni_store_orders (reconciliation_status)
  WHERE reconciliation_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS ni_store_orders_fulfillment_deadline_idx
  ON public.ni_store_orders (fulfillment_deadline_at)
  WHERE fulfillment_deadline_at IS NOT NULL;
