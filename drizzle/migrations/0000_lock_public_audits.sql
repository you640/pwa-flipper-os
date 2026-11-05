DROP POLICY IF EXISTS "Anyone can view public audits by slug" ON public.public_audits;
CREATE POLICY "Users view own public audits" ON public.public_audits FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE SELECT ON public.public_audits FROM anon;
CREATE OR REPLACE FUNCTION public.get_public_audit_by_slug(_slug text)
RETURNS TABLE(audit_id uuid, slug text, app_name text, created_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT audit_id, slug, app_name, created_at FROM public.public_audits WHERE slug = _slug LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.get_public_audit_by_slug(text) TO anon, authenticated;