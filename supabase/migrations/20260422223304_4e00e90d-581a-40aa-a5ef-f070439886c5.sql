ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';

UPDATE public.profiles SET locale = 'en' WHERE locale IS NULL;