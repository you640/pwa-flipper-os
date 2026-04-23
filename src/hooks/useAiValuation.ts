import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export interface ValueUpTip {
  title: string;
  impact: "high" | "medium" | "low";
  detail: string;
}

export interface TechStackAudit {
  summary: string;
  excellence: string[];
  tech_debt: string[];
  detected_stack: string[];
}

export type CodeQualityLabel =
  | "Clean as Glass"
  | "Solid"
  | "Mixed"
  | "Rubberdebt"
  | "Toxic";

export interface AiValuationReport {
  estimated_valuation: { low: number; mid: number; high: number };
  multiple: number;
  risk_score: number;
  code_quality_score: number;
  code_quality_label: CodeQualityLabel;
  tech_stack_audit: TechStackAudit;
  refactor_tips: ValueUpTip[];
  value_up_tips: ValueUpTip[];
  summary: string;
}

export interface ValuationInputs {
  name: string;
  url?: string;
  github_url: string;
  mrr: number;
  expenses: number;
  niche: string;
  tech_stack?: string;
  notes?: string;
}

export function useAiValuation() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AiValuationReport | null>(null);
  const [inputs, setInputs] = useState<ValuationInputs | null>(null);

  const run = async (payload: ValuationInputs) => {
    setLoading(true);
    setReport(null);
    try {
      const { data, error } = await supabase.functions.invoke("valuate-pwa", {
        body: payload,
      });
      if (error) {
        const status = (error as any).context?.response?.status;
        if (status === 429) toast.error(t("valuation.ai.errors.rateLimit"));
        else if (status === 402) toast.error(t("valuation.ai.errors.credits"));
        else toast.error(t("valuation.ai.errors.generic"), { description: error.message });
        return null;
      }
      if (data?.error === "rate_limit") {
        toast.error(t("valuation.ai.errors.rateLimit"));
        return null;
      }
      if (data?.error === "credits") {
        toast.error(t("valuation.ai.errors.credits"));
        return null;
      }
      if (!data?.report) {
        toast.error(t("valuation.ai.errors.generic"));
        return null;
      }
      setReport(data.report);
      setInputs(data.inputs);
      return data.report as AiValuationReport;
    } catch (e) {
      toast.error(t("valuation.ai.errors.generic"), {
        description: e instanceof Error ? e.message : undefined,
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setReport(null);
    setInputs(null);
  };

  return { run, loading, report, inputs, reset };
}
