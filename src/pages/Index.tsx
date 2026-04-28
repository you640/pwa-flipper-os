import { motion } from "framer-motion";
import {
	AlertTriangle,
	BarChart3,
	DollarSign,
	Layers,
	TrendingUp,
	Trophy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { IndustryNews } from "@/components/dashboard/IndustryNews";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProjectionChart } from "@/components/dashboard/ProjectionChart";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/hooks/useLocale";
import { useOverviewData } from "@/hooks/useOverviewData";
import { useProfile } from "@/hooks/useProfile";

const Index = () => {
	const { t } = useTranslation();
	const { intlLocale, formatCurrency } = useLocale();
	const { displayName } = useProfile();
	const { portfolio, market, leads, loading, error, refetch } =
		useOverviewData();

	const rows = portfolio ?? [];
	const active = rows.filter((r) => r.status !== "Sold");
	const sold = rows.filter((r) => r.status === "Sold");

	const portfolioValue = active.reduce((s, r) => s + (r.asking_price ?? 0), 0);
	const combinedMRR = active.reduce((s, r) => s + (r.mrr ?? 0), 0);
	const pipelineCount = active.length;
	const totalExits = sold.reduce((s, r) => s + (r.asking_price ?? 0), 0);

	const marketRows = market ?? [];
	const avgPrice = marketRows.length
		? Math.round(
				marketRows.reduce((s, r) => s + (r.price ?? 0), 0) / marketRows.length,
			)
		: 0;
	const avgMrr = marketRows.length
		? Math.round(
				marketRows.reduce((s, r) => s + (r.mrr ?? 0), 0) / marketRows.length,
			)
		: 0;

	const today = new Date().toLocaleDateString(intlLocale, {
		weekday: "long",
		month: "long",
		day: "numeric",
	});

	return (
		<AppLayout>
			<SEO title={t("seo.indexTitle")} description={t("seo.indexDesc")} />
			<div className="mx-auto w-full max-w-[1400px] space-y-6">
				<motion.header
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="flex flex-wrap items-end justify-between gap-3"
				>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
							{t("dashboard.welcome")}{" "}
							<span className="text-gradient">{displayName}</span>
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("dashboard.pulse")} {today}.
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
						<span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
						{t("dashboard.allSystems")}
					</div>
				</motion.header>

				{error && (
					<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						<div className="flex items-center gap-2">
							<AlertTriangle className="h-4 w-4" />
							<span>{t("overview.errorBanner")}</span>
						</div>
						<Button
							size="sm"
							variant="outline"
							onClick={() => refetch()}
							className="border-destructive/40 text-destructive hover:bg-destructive/15"
						>
							{t("overview.retry")}
						</Button>
					</div>
				)}

				<section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label={t("dashboard.totalPortfolio")}
						value={portfolioValue}
						prefix="€"
						icon={DollarSign}
						accent="primary"
						index={0}
						loading={loading}
					/>
					<MetricCard
						label={t("dashboard.combinedMRR")}
						value={combinedMRR}
						prefix="€"
						icon={TrendingUp}
						accent="cyan"
						index={1}
						loading={loading}
					/>
					<MetricCard
						label={t("dashboard.apps")}
						value={pipelineCount}
						icon={Layers}
						accent="warning"
						index={2}
						loading={loading}
					/>
					<MetricCard
						label={t("dashboard.totalExits")}
						value={totalExits}
						prefix="€"
						icon={Trophy}
						accent="success"
						index={3}
						loading={loading}
					/>
				</section>

				<Card className="glass p-5 shadow-elegant md:p-6">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div className="flex items-center gap-2">
							<BarChart3 className="h-4 w-4 text-accent" />
							<h2 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
								{t("overview.marketPulse.title")}
							</h2>
						</div>
						<span className="text-xs text-muted-foreground">
							{t("overview.marketPulse.deals", { count: marketRows.length })}
						</span>
					</div>
					{marketRows.length === 0 ? (
						<p className="mt-3 text-sm text-muted-foreground">
							{t("overview.marketPulse.empty")}
						</p>
					) : (
						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
							<div>
								<p className="text-xs uppercase tracking-wider text-muted-foreground">
									{t("overview.marketPulse.avgPrice")}
								</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatCurrency(avgPrice)}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wider text-muted-foreground">
									{t("overview.marketPulse.avgMrr")}
								</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{formatCurrency(avgMrr)}
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wider text-muted-foreground">
									{t("overview.marketPulse.deals", {
										count: marketRows.length,
									})}
								</p>
								<p className="mt-1 text-xl font-semibold text-foreground">
									{marketRows.length}
								</p>
							</div>
						</div>
					)}
				</Card>

				<ProjectionChart currentMRR={combinedMRR} />

				<div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
					<IndustryNews />
					<ActivityFeed leads={leads} portfolio={portfolio} loading={loading} />
				</div>
			</div>
		</AppLayout>
	);
};

export default Index;
