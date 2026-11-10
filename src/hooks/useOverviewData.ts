import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export type PortfolioRow = Pick<
  Tables<"portfolio">,
  "id" | "name" | "asking_price" | "mrr" | "expenses" | "status" | "created_at"
>;
export type MarketRow = Pick<
  Tables<"market_intel">,
  "id" | "name" | "niche" | "source" | "mrr" | "price" | "created_at"
>;
export type LeadRow = Pick<
  Tables<"crm_leads">,
  "id" | "agency_name" | "status" | "contact_email" | "notes" | "created_at"
>;

export interface OverviewData {
  portfolio: PortfolioRow[] | null;
  market: MarketRow[] | null;
  leads: LeadRow[] | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOverviewData(): OverviewData {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioRow[] | null>(null);
  const [market, setMarket] = useState<MarketRow[] | null>(null);
  const [leads, setLeads] = useState<LeadRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data: auth } = await supabase.auth.getSession();
    if (!auth.session) { setPortfolio([]); setMarket([]); setLeads([]); setLoading(false); return; }
    const [pRes, mRes, lRes] = await Promise.all([
      supabase
        .from("portfolio")
        .select("id, name, asking_price, mrr, expenses, status, created_at")
        .eq("user_id", auth.session.user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("market_intel")
        .select("id, name, niche, source, mrr, price, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("crm_leads")
        .select("id, agency_name, status, contact_email, notes, created_at")
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    let firstError: string | null = null;
    const handle = (label: string, err: { message: string } | null) => {
      if (!err) return;
      console.error(`[overview] ${label} failed:`, err);
      if (!firstError) firstError = err.message;
      toast({
        title: t("overview.loadError", { source: label }),
        description: err.message,
        variant: "destructive",
      });
    };
    handle("portfolio", pRes.error);
    handle("market_intel", mRes.error);
    handle("crm_leads", lRes.error);

    setPortfolio((pRes.data as PortfolioRow[]) ?? []);
    setMarket((mRes.data as MarketRow[]) ?? []);
    setLeads((lRes.data as LeadRow[]) ?? []);
    setError(firstError);
    setLoading(false);
  }, [t, toast]);

  useEffect(() => {
    fetchAll();
    const { data: sub } = supabase.auth.onAuthStateChange((_e, _s) => {
      // refetch when auth changes (login/logout)
      fetchAll();
    });
    return () => sub.subscription.unsubscribe();
  }, [fetchAll]);

  return { portfolio, market, leads, loading, error, refetch: fetchAll };
}
