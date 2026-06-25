-- Smart Store: shipment tracking, guest checkout flag, extended order statuses

ALTER TABLE public.ni_store_orders
  DROP CONSTRAINT IF EXISTS ni_store_orders_status_check;

ALTER TABLE public.ni_store_orders
  ADD CONSTRAINT ni_store_orders_status_check
  CHECK (
    status IN (
      'pending',
      'paid',
      'fulfillment_sent',
      'shipped',
      'delivered',
      'failed',
      'cancelled'
    )
  );

ALTER TABLE public.ni_store_orders
  ADD COLUMN IF NOT EXISTS guest_checkout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tracking_number text,
  ADD COLUMN IF NOT EXISTS tracking_carrier text,
  ADD COLUMN IF NOT EXISTS tracking_url text,
  ADD COLUMN IF NOT EXISTS shipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE INDEX IF NOT EXISTS ni_store_orders_tracking_number_idx
  ON public.ni_store_orders (tracking_number)
  WHERE tracking_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS ni_store_orders_customer_email_idx
  ON public.ni_store_orders (customer_email)
  WHERE customer_email IS NOT NULL;
