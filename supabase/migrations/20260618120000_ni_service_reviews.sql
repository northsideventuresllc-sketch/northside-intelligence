-- Service reviews from authenticated portal customers
CREATE TABLE IF NOT EXISTS public.ni_service_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  service_slug text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title text,
  body text NOT NULL,
  status text NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, service_slug)
);

CREATE INDEX IF NOT EXISTS ni_service_reviews_service_slug_idx
  ON public.ni_service_reviews (service_slug);

CREATE INDEX IF NOT EXISTS ni_service_reviews_status_idx
  ON public.ni_service_reviews (status);

ALTER TABLE public.ni_service_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY ni_service_reviews_select_published
  ON public.ni_service_reviews
  FOR SELECT
  USING (status = 'published');

CREATE POLICY ni_service_reviews_insert_own
  ON public.ni_service_reviews
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ni_service_reviews_update_own
  ON public.ni_service_reviews
  FOR UPDATE
  USING (auth.uid() = user_id);
