import {
	Activity,
	Briefcase,
	DollarSign,
	TrendingUp,
	Users,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Portfolio = Database["public"]["Tables"]["portfolio"]["Row"];

export function GlobalPulse({
	users,
	portfolio,
	loading,
}: {
	users: Profile[];
	portfolio: Portfolio[];
	loading: boolean;
}) {
	const { t } = useTranslation();
	const totalMrr = portfolio.reduce((s, p) => s + (p.mrr ?? 0), 0);
	const totalValue = portfolio.reduce((s, p) => s + (p.asking_price ?? 0), 0);
	const forSale = portfolio.filter((p) => p.for_sale);
	const potentialExit = forSale.reduce((s, p) => s + (p.asking_price ?? 0), 0);

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
			<MetricCard
				label={t("admin.pulse.totalUsers")}
				value={users.length}
				icon={Users}
				accent="primary"
				index={0}
				loading={loading}
			/>
			<MetricCard
				label={t("admin.pulse.combinedMrr")}
				value={totalMrr}
				prefix="€"
				icon={DollarSign}
				accent="success"
				index={1}
				loading={loading}
			/>
			<MetricCard
				label={t("admin.pulse.portfolioValue")}
				value={totalValue}
				prefix="€"
				icon={Briefcase}
				accent="cyan"
				index={2}
				loading={loading}
			/>
			<MetricCard
				label={`${t("adminExtras.potentialExit")} · ${forSale.length} ${t("adminExtras.appsForSale")}`}
				value={potentialExit}
				prefix="€"
				icon={TrendingUp}
				accent="primary"
				index={3}
				loading={loading}
			/>
			<MetricCard
				label={t("admin.pulse.health")}
				value={100}
				suffix="%"
				icon={Activity}
				accent="success"
				index={4}
				loading={loading}
			/>
		</div>
	);
}
