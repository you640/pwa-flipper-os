import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
	anonymous?: boolean;
}

type FunctionErrorWithStatus = Error & {
	context?: {
		response?: {
			status?: number;
		};
	};
};

type AnonymousLimitResult = {
	_anonLimit: true;
};

const TIMEOUT_MS = 60_000;

export function useAiValuation() {
	const { t } = useTranslation();
	const [loading, setLoading] = useState(false);
	const [report, setReport] = useState<AiValuationReport | null>(null);
	const [inputs, setInputs] = useState<ValuationInputs | null>(null);
	const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const run = async (
		payload: ValuationInputs,
	): Promise<AiValuationReport | AnonymousLimitResult | null> => {
		setLoading(true);
		setReport(null);

		let timedOut = false;
		if (timeoutRef.current) clearTimeout(timeoutRef.current);
		timeoutRef.current = setTimeout(() => {
			timedOut = true;
		}, TIMEOUT_MS);

		try {
			const { data, error } = await supabase.functions.invoke("valuate-pwa", {
				body: payload,
			});
			if (timedOut) {
				toast.error(t("valuation.ai.errors.timedOut"));
				return null;
			}
			if (error) {
				const status = (error as FunctionErrorWithStatus).context?.response
					?.status;
				if (status === 429) toast.error(t("valuation.ai.errors.rateLimit"));
				else if (status === 402) toast.error(t("valuation.ai.errors.credits"));
				else
					toast.error(t("valuation.ai.errors.generic"), {
						description: error.message,
					});
				return null;
			}
			if (data?.error === "anon_limit") {
				toast.error(t("landing.anonLimit"));
				return { _anonLimit: true };
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
			if (timedOut || (e instanceof Error && e.name === "AbortError")) {
				toast.error(t("valuation.ai.errors.timedOut"));
			} else {
				toast.error(t("valuation.ai.errors.generic"), {
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

	const reset = () => {
		setReport(null);
		setInputs(null);
	};

	const loadFromHistory = (
		nextReport: AiValuationReport,
		nextInputs: ValuationInputs,
	) => {
		setReport(nextReport);
		setInputs(nextInputs);
	};

	return { run, loading, report, inputs, reset, loadFromHistory };
}
