-- ARM3 pipeline: link scaffolded tools back to source opportunities
ALTER TABLE public.arm3_tools
  ADD COLUMN IF NOT EXISTS source_opportunity_id bigint REFERENCES public.arm3_opportunities(id);

CREATE INDEX IF NOT EXISTS arm3_tools_source_opportunity_id_idx
  ON public.arm3_tools(source_opportunity_id);
