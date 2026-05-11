import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export interface OutreachDraft {
  subject: string;
  body_markdown: string;
  tone: string;
}

const TIMEOUT_MS = 45_000;

export function useAiOutreach() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState<OutreachDraft | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const generate = async (lead_id: string, portfolio_id: string) => {
    setLoading(true);
    const controller = new AbortController();
    let timedOut = false;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, TIMEOUT_MS);

    try {
      const { data, error } = await supabase.functions.invoke("draft-outreach", {
        body: { lead_id, portfolio_id },
      });
      if (timedOut) {
        toast.error(t("crm.outreach.errors.timedOut"));
        return null;
      }
      if (error) {
        const status = (error as any).context?.response?.status;
        if (status === 429) toast.error(t("crm.outreach.errors.rateLimit"));
        else if (status === 402) toast.error(t("crm.outreach.errors.credits"));
        else toast.error(t("crm.outreach.errors.generic"), { description: error.message });
        return null;
      }
      if (data?.error === "rate_limit") {
        toast.error(t("crm.outreach.errors.rateLimit"));
        return null;
      }
      if (data?.error === "credits") {
        toast.error(t("crm.outreach.errors.credits"));
        return null;
      }
      if (!data?.draft) {
        toast.error(t("crm.outreach.errors.generic"));
        return null;
      }
      setDraft(data.draft);
      return data.draft as OutreachDraft;
    } catch (e) {
      if (timedOut || (e as any)?.name === "AbortError") {
        toast.error(t("crm.outreach.errors.timedOut"));
      } else {
        toast.error(t("crm.outreach.errors.generic"), {
          description: e instanceof Error ? e.message : undefined,
        });
      }
      return null;
    } finally {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setLoading(false);
    }
  };

  const update = (next: Partial<OutreachDraft>) =>
    setDraft((d) => (d ? { ...d, ...next } : d));
  const reset = () => setDraft(null);

  return { generate, update, reset, draft, loading };
}
