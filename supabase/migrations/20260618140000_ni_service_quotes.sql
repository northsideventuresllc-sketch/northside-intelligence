-- Service quotes with dynamic pricing from intake forms
CREATE TABLE IF NOT EXISTS public.ni_service_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  service_slug text NOT NULL,
  account_type text NOT NULL CHECK (account_type IN ('personal', 'business')),
  intake_payload jsonb NOT NULL DEFAULT '{}',
  market_reference_cents integer NOT NULL,
  top_price_cents integer NOT NULL,
  floor_price_cents integer NOT NULL,
  current_price_cents integer NOT NULL,
  negotiation_level integer NOT NULL DEFAULT 0,
  line_items jsonb NOT NULL DEFAULT '[]',
  reasoning jsonb NOT NULL DEFAULT '[]',
  payment_plans jsonb NOT NULL DEFAULT '[]',
  bnpl_eligible boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'accepted', 'expired', 'paid')),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ni_service_quotes_user_id_idx
  ON public.ni_service_quotes (user_id);

CREATE INDEX IF NOT EXISTS ni_service_quotes_status_idx
  ON public.ni_service_quotes (status);

ALTER TABLE public.ni_service_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY ni_service_quotes_select_own
  ON public.ni_service_quotes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY ni_service_quotes_insert_own
  ON public.ni_service_quotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ni_service_quotes_update_own
  ON public.ni_service_quotes
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Negotiation chat history per quote
CREATE TABLE IF NOT EXISTS public.ni_service_negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.ni_service_quotes (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  messages jsonb NOT NULL DEFAULT '[]',
  negotiation_level integer NOT NULL DEFAULT 0,
  offered_price_cents integer,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'declined', 'escalated')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ni_service_negotiations_quote_id_idx
  ON public.ni_service_negotiations (quote_id);

ALTER TABLE public.ni_service_negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY ni_service_negotiations_select_own
  ON public.ni_service_negotiations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY ni_service_negotiations_insert_own
  ON public.ni_service_negotiations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ni_service_negotiations_update_own
  ON public.ni_service_negotiations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Link service requests to quotes and Stripe
ALTER TABLE public.ni_service_requests
  ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.ni_service_quotes (id),
  ADD COLUMN IF NOT EXISTS agreed_price_cents integer,
  ADD COLUMN IF NOT EXISTS stripe_session_id text,
  ADD COLUMN IF NOT EXISTS payment_plan_months integer DEFAULT 1;
