-- NI Store: replace AliExpress/Temu with Spocket/Zendrop as dropship platforms.

UPDATE public.ni_store_catalog
SET source_platform = 'curated', updated_at = now()
WHERE source_platform IN ('aliexpress', 'temu');

ALTER TABLE public.ni_store_catalog
  DROP CONSTRAINT IF EXISTS ni_store_catalog_source_platform_check;

ALTER TABLE public.ni_store_catalog
  ADD CONSTRAINT ni_store_catalog_source_platform_check
  CHECK (source_platform IN ('cj', 'spocket', 'zendrop', 'amazon', 'curated'));

COMMENT ON COLUMN public.ni_store_catalog.source_platform IS
  'Dropship supplier: cj, spocket, zendrop, amazon, or curated NI deals.';
