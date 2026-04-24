
-- 1) Add for_sale flag + listed_at to portfolio
ALTER TABLE public.portfolio
  ADD COLUMN IF NOT EXISTS for_sale boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS listed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_portfolio_for_sale ON public.portfolio (for_sale) WHERE for_sale = true;

-- 2) Pricing waitlist (email capture)
CREATE TABLE IF NOT EXISTS public.pricing_waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('pro', 'exit')),
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pricing_waitlist_email ON public.pricing_waitlist (email);

ALTER TABLE public.pricing_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone (incl. anon) can insert waitlist entries
CREATE POLICY "Anyone can join waitlist"
  ON public.pricing_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (length(email) > 3 AND length(email) < 255);

-- Only admins can read
CREATE POLICY "Admins view waitlist"
  ON public.pricing_waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Anonymous audit attempts (IP gate)
CREATE TABLE IF NOT EXISTS public.anon_audit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  github_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_anon_audit_attempts_ip_created
  ON public.anon_audit_attempts (ip_hash, created_at DESC);

ALTER TABLE public.anon_audit_attempts ENABLE ROW LEVEL SECURITY;

-- No public access — only edge functions via service role read/write this table.
-- Admins can SELECT for visibility.
CREATE POLICY "Admins view anon attempts"
  ON public.anon_audit_attempts FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
