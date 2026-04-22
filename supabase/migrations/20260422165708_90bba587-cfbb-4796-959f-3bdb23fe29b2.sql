CREATE TYPE public.market_source AS ENUM ('acquire', 'flippa');

CREATE TABLE public.market_intel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  niche TEXT NOT NULL DEFAULT 'B2B SaaS',
  source public.market_source NOT NULL DEFAULT 'acquire',
  mrr INTEGER NOT NULL DEFAULT 0,
  price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.market_intel ENABLE ROW LEVEL SECURITY;

-- Public access (no auth implemented yet for this tool)
CREATE POLICY "Anyone can view market intel"
  ON public.market_intel FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert market intel"
  ON public.market_intel FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can delete market intel"
  ON public.market_intel FOR DELETE
  USING (true);

CREATE POLICY "Anyone can update market intel"
  ON public.market_intel FOR UPDATE
  USING (true);

CREATE INDEX idx_market_intel_created_at ON public.market_intel(created_at DESC);