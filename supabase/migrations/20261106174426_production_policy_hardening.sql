-- Forward-only hardening, safe for both Supabase and the historical Drizzle state.
BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT _user_id = auth.uid() AND EXISTS (
 SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
 )
$$;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Listed does not mean every underlying portfolio column is public.
DROP POLICY IF EXISTS "Anyone view for_sale portfolio" ON public.portfolio;
DROP POLICY IF EXISTS "Anyone can view public audits by slug" ON public.public_audits;
DROP POLICY IF EXISTS "Users view own public audits" ON public.public_audits;
CREATE POLICY "Users view own public audits" ON public.public_audits
 FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);
REVOKE SELECT ON public.public_audits FROM anon;
-- No public report route consumes this legacy RPC. Fail closed until an explicit
-- reviewed public projection is implemented; never expose the whole audit JSON.
DROP FUNCTION IF EXISTS public.get_public_audit_by_slug(text);

DROP POLICY IF EXISTS "Users insert own audits" ON public.portfolio_audits;
CREATE POLICY "Users insert own audits" ON public.portfolio_audits
 FOR INSERT TO authenticated WITH CHECK (
 (SELECT auth.uid()) = user_id AND (portfolio_id IS NULL OR EXISTS (
   SELECT 1 FROM public.portfolio p WHERE p.id = portfolio_id AND p.user_id = (SELECT auth.uid())
 )));
DROP POLICY IF EXISTS "Users insert own public audits" ON public.public_audits;
CREATE POLICY "Users insert own public audits" ON public.public_audits
 FOR INSERT TO authenticated WITH CHECK (
 (SELECT auth.uid()) = user_id AND EXISTS (
 SELECT 1 FROM public.portfolio_audits a WHERE a.id = audit_id AND a.user_id = (SELECT auth.uid())
 ));

-- This narrowly scoped helper avoids granting SELECT on private portfolio rows.
CREATE OR REPLACE FUNCTION private.listed_seller_matches(project_id uuid, seller_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
 SELECT auth.uid() IS NOT NULL AND EXISTS (
 SELECT 1 FROM public.portfolio p WHERE p.id = project_id AND p.user_id = seller_id AND p.for_sale
 )
$$;
REVOKE ALL ON FUNCTION private.listed_seller_matches(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.listed_seller_matches(uuid, uuid) TO authenticated;

-- Public inquiries are not wired into the app. Restrict creation to authenticated
-- callers until a rate-limited public endpoint exists.
DROP POLICY IF EXISTS "Anyone can submit a deal inquiry" ON public.deal_inquiries;
CREATE POLICY "Authenticated buyers submit listed inquiries" ON public.deal_inquiries
 FOR INSERT TO authenticated WITH CHECK (
 status = 'new' AND length(buyer_email) BETWEEN 4 AND 255 AND length(message) BETWEEN 5 AND 2000
 AND private.listed_seller_matches(portfolio_id, seller_user_id)
 );
-- Prevent changing an inquiry to reference somebody else's portfolio.
DROP POLICY IF EXISTS "Sellers update own inquiries" ON public.deal_inquiries;
CREATE POLICY "Sellers update own inquiries" ON public.deal_inquiries
 FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = seller_user_id)
 WITH CHECK ((SELECT auth.uid()) = seller_user_id AND EXISTS (
 SELECT 1 FROM public.portfolio p WHERE p.id = portfolio_id AND p.user_id = (SELECT auth.uid())
 ));

CREATE TABLE private.ai_audit_quotas (
 quota_key text PRIMARY KEY, used integer NOT NULL, expires_at timestamptz NOT NULL
);
ALTER TABLE private.ai_audit_quotas ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA private TO service_role;
GRANT SELECT, INSERT, UPDATE ON private.ai_audit_quotas TO service_role;
-- Service-only RPC: the Edge function derives the key from verified user ID or
-- an explicitly configured gateway-owned IP header. Atomic UPSERT serializes races.
CREATE FUNCTION public.reserve_ai_audit(_key text, _limit integer) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE reserved integer;
BEGIN
 IF length(_key) NOT BETWEEN 8 AND 200 OR _limit NOT BETWEEN 1 AND 10 THEN
   RAISE EXCEPTION 'Invalid quota parameters';
 END IF;
 INSERT INTO private.ai_audit_quotas AS q (quota_key, used, expires_at)
 VALUES (_key, 1, now() + interval '24 hours')
 ON CONFLICT (quota_key) DO UPDATE SET
 used = CASE WHEN q.expires_at <= now() THEN 1 ELSE q.used + 1 END,
 expires_at = CASE WHEN q.expires_at <= now() THEN now() + interval '24 hours' ELSE q.expires_at END
 WHERE q.expires_at <= now() OR q.used < _limit
 RETURNING used INTO reserved;
 RETURN reserved IS NOT NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.reserve_ai_audit(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_ai_audit(text, integer) TO service_role;
-- New writes and deletions enforce lifecycle ownership. NOT VALID avoids
-- silently deleting historic orphan data: staging must inspect and VALIDATE it.
ALTER TABLE public.portfolio_audits ADD CONSTRAINT audits_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.public_audits ADD CONSTRAINT public_audits_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.public_audits ADD CONSTRAINT public_audits_audit_fk FOREIGN KEY (audit_id) REFERENCES public.portfolio_audits(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.deal_inquiries ADD CONSTRAINT inquiries_seller_fk FOREIGN KEY (seller_user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.deal_inquiries ADD CONSTRAINT inquiries_portfolio_fk FOREIGN KEY (portfolio_id) REFERENCES public.portfolio(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.pricing_waitlist ADD CONSTRAINT waitlist_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL NOT VALID;
COMMIT;
