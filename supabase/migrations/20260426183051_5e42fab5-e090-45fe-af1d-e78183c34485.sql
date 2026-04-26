
-- 1) PUBLIC AUDITS (shareable reports)
CREATE TABLE public.public_audits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID NOT NULL,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  app_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_public_audits_slug ON public.public_audits(slug);
CREATE INDEX idx_public_audits_user ON public.public_audits(user_id);
ALTER TABLE public.public_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public audits by slug"
  ON public.public_audits FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users insert own public audits"
  ON public.public_audits FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own public audits"
  ON public.public_audits FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage public audits"
  ON public.public_audits FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2) DEAL INQUIRIES (buyer messages from public Deal Room)
CREATE TABLE public.deal_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL,
  seller_user_id UUID NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_name TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_deal_inquiries_seller ON public.deal_inquiries(seller_user_id);
CREATE INDEX idx_deal_inquiries_portfolio ON public.deal_inquiries(portfolio_id);
ALTER TABLE public.deal_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a deal inquiry"
  ON public.deal_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(buyer_email) BETWEEN 4 AND 255
    AND length(message) BETWEEN 5 AND 2000
  );

CREATE POLICY "Sellers view own inquiries"
  ON public.deal_inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_user_id);

CREATE POLICY "Sellers update own inquiries"
  ON public.deal_inquiries FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_user_id)
  WITH CHECK (auth.uid() = seller_user_id);

CREATE POLICY "Admins manage all inquiries"
  ON public.deal_inquiries FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) SUBSCRIPTIONS (Stripe Pro tier)
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  tier TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all subscriptions"
  ON public.subscriptions FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) CRM_LEADS — last_outreach_at
ALTER TABLE public.crm_leads
  ADD COLUMN IF NOT EXISTS last_outreach_at TIMESTAMPTZ;

-- 5) PORTFOLIO — public read for listed apps (Deal Room)
CREATE POLICY "Anyone view for_sale portfolio"
  ON public.portfolio FOR SELECT
  TO anon, authenticated
  USING (for_sale = true);
