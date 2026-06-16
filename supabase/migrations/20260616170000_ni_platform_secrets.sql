-- Server-only key/value store for production secrets when Vercel env vars are absent.
-- Read via service role in API routes (see src/lib/platform-secrets.ts).

CREATE TABLE IF NOT EXISTS public.ni_platform_secrets (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ni_platform_secrets IS
  'NI portal platform secrets (Stripe, etc.). No RLS — service role only.';

ALTER TABLE public.ni_platform_secrets ENABLE ROW LEVEL SECURITY;
