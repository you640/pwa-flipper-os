-- Add new enum values
ALTER TYPE public.portfolio_status ADD VALUE IF NOT EXISTS 'Listed';
ALTER TYPE public.portfolio_status ADD VALUE IF NOT EXISTS 'Negotiating';