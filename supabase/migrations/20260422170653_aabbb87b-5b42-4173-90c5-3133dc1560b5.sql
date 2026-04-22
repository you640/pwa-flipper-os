-- PORTFOLIO ----------------------------------------------------
CREATE TYPE public.portfolio_status AS ENUM ('Building', 'For Sale', 'Sold');

CREATE TABLE public.portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  mrr INTEGER NOT NULL DEFAULT 0,
  expenses INTEGER NOT NULL DEFAULT 0,
  asking_price INTEGER NOT NULL DEFAULT 0,
  status public.portfolio_status NOT NULL DEFAULT 'Building',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio" ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "Anyone can insert portfolio" ON public.portfolio FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update portfolio" ON public.portfolio FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete portfolio" ON public.portfolio FOR DELETE USING (true);

CREATE INDEX idx_portfolio_created_at ON public.portfolio(created_at DESC);

-- CRM LEADS ----------------------------------------------------
CREATE TYPE public.lead_status AS ENUM ('Lead', 'Contacted', 'Demo', 'Rejected');

CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_name TEXT NOT NULL,
  contact_email TEXT,
  status public.lead_status NOT NULL DEFAULT 'Lead',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view crm_leads" ON public.crm_leads FOR SELECT USING (true);
CREATE POLICY "Anyone can insert crm_leads" ON public.crm_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update crm_leads" ON public.crm_leads FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete crm_leads" ON public.crm_leads FOR DELETE USING (true);

CREATE INDEX idx_crm_leads_created_at ON public.crm_leads(created_at DESC);