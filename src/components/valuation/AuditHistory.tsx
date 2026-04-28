import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type {
    AiValuationReport,
    ValuationInputs,
} from "@/hooks/useAiValuation";
import { supabase } from "@/integrations/supabase/client";
import { History, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

interface AuditRow {
	id: string;
	created_at: string;
	inputs: ValuationInputs;
	ai_report: AiValuationReport;
}

const AUDIT_HISTORY_SKELETON_KEYS = [
	"audit-history-skeleton-1",
	"audit-history-skeleton-2",
	"audit-history-skeleton-3",
] as const;

const formatUSD = (n: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(n);

export function AuditHistory({
	refreshKey,
	onPick,
}: {
	refreshKey: number;
	onPick: (row: AuditRow) => void;
}) {
	const { t } = useTranslation();
	const [rows, setRows] = useState<AuditRow[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		void refreshKey;
		let cancelled = false;
		(async () => {
			setLoading(true);
			const { data, error } = await supabase
				.from("portfolio_audits")
				.select("id,created_at,inputs,ai_report")
				.order("created_at", { ascending: false })
				.limit(5);
			if (cancelled) return;
			if (!error) setRows((data ?? []) as unknown as AuditRow[]);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [refreshKey]);

	return (
		<Card className="glass p-5 shadow-elegant">
			<div className="flex items-center gap-2">
				<History className="h-4 w-4 text-primary" />
				<h3 className="text-sm font-semibold tracking-tight text-foreground">
					{t("valuation.history.title")}
				</h3>
			</div>
			<p className="mt-1 text-xs text-muted-foreground">
				{t("valuation.history.subtitle")}
			</p>

			<div className="mt-4 space-y-2">
				{loading ? (
					AUDIT_HISTORY_SKELETON_KEYS.map((itemKey) => (
						<Skeleton key={itemKey} className="h-16 w-full" />
					))
				) : rows.length === 0 ? (
					<div className="rounded-md border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
						{t("valuation.history.empty")}
					</div>
				) : (
					rows.map((r) => {
						const date = new Date(r.created_at);
						const val = r.ai_report?.estimated_valuation?.mid ?? 0;
						const score = r.ai_report?.code_quality_score ?? 0;
						return (
							<button
								type="button"
								key={r.id}
								onClick={() => onPick(r)}
								className="group block w-full rounded-lg border border-border/60 bg-card/40 p-3 text-left transition-colors hover:border-primary/40 hover:bg-card/60"
							>
								<div className="flex items-center justify-between gap-2">
									<span className="truncate text-sm font-medium text-foreground">
										{r.inputs?.name || t("valuation.untitled")}
									</span>
									<Badge
										variant="outline"
										className="shrink-0 border-border/60 text-[10px]"
									>
										<Sparkles className="mr-1 h-2.5 w-2.5" />
										{score}/100
									</Badge>
								</div>
								<div className="mt-1 flex items-center justify-between text-xs">
									<span className="text-success font-semibold tabular-nums">
										{formatUSD(val)}
									</span>
									<span className="text-muted-foreground">
										{date.toLocaleDateString()}
									</span>
								</div>
							</button>
						);
					})
				)}
			</div>
		</Card>
	);
}
