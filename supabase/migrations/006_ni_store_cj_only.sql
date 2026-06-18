-- CJ-only NI Store: deactivate mock/curated rows, add CJ metadata columns.

UPDATE public.ni_store_catalog
SET active = false, updated_at = now()
WHERE source_platform <> 'cj';

ALTER TABLE public.ni_store_catalog
  ADD COLUMN IF NOT EXISTS image_source text,
  ADD COLUMN IF NOT EXISTS cj_variants jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS retail_price_min_cents integer,
  ADD COLUMN IF NOT EXISTS retail_price_max_cents integer;

ALTER TABLE public.ni_store_catalog
  DROP CONSTRAINT IF EXISTS ni_store_catalog_source_platform_check;

ALTER TABLE public.ni_store_catalog
  ADD CONSTRAINT ni_store_catalog_source_platform_check
  CHECK (source_platform IN ('cj', 'amazon', 'curated'));

COMMENT ON COLUMN public.ni_store_catalog.image_source IS 'cj = supplier image; serpapi = web fallback (show stock photo disclaimer).';
COMMENT ON COLUMN public.ni_store_catalog.cj_variants IS 'CJ variant options with NI retail prices (supplier + 10%).';
