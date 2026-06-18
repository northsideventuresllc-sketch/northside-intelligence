-- Smart Store: track CJ listV2 bulk catalog sync progress (paginated API slices).

CREATE TABLE IF NOT EXISTS public.ni_store_catalog_sync (
  id text PRIMARY KEY,
  keyword_slice text NOT NULL DEFAULT '',
  page_number integer NOT NULL DEFAULT 1,
  total_pages integer,
  total_records integer,
  products_upserted bigint NOT NULL DEFAULT 0,
  last_synced_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ni_store_catalog_sync IS
  'Active cursor for CJ listV2 bulk ingest. keyword_slice empty string = broad catalog listing.';

INSERT INTO public.ni_store_catalog_sync (id, keyword_slice, page_number)
VALUES ('active', '', 1)
ON CONFLICT (id) DO NOTHING;
