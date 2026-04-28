import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { DatabaseExplorer } from "@/components/admin/sections/DatabaseExplorer";
import { GlobalGrowthChart } from "@/components/admin/sections/GlobalGrowthChart";
import { GlobalPulse } from "@/components/admin/sections/GlobalPulse";
import { SeoHub } from "@/components/admin/sections/SeoHub";
import { SystemLogs } from "@/components/admin/sections/SystemLogs";
import { UserManagement } from "@/components/admin/sections/UserManagement";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminData } from "@/hooks/useAdminData";
import { useLocale } from "@/hooks/useLocale";

export default function Admin() {
	const { t } = useTranslation();
	const { intlLocale } = useLocale();
	const {
		users,
		roles,
		portfolio,
		leads,
		uploadErrors,
		growthSeries,
		loading,
		error,
		refreshedAt,
		refetch,
	} = useAdminData();

	return (
		<AdminLayout>
			<SEO
				title={`${t("admin.title")} · RUBBERDUCK.SPACE`}
				description={t("admin.subtitle")}
			/>
			<div className="mx-auto max-w-7xl space-y-6">
				<div className="flex flex-wrap items-end justify-between gap-3">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
							{t("admin.title")}
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("admin.subtitle")}
						</p>
					</div>
					<div className="flex items-center gap-3">
						<span className="text-xs text-muted-foreground">
							{t("admin.lastRefresh")}{" "}
							{refreshedAt.toLocaleTimeString(intlLocale)}
						</span>
						<Button
							size="sm"
							variant="outline"
							onClick={refetch}
							disabled={loading}
						>
							<RefreshCw
								className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
							/>
							{t("admin.refresh")}
						</Button>
					</div>
				</div>

				{error && (
					<div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				)}

				<Tabs defaultValue="analytics" className="w-full">
					<TabsList>
						<TabsTrigger value="analytics">
							{t("admin.tabs.analytics")}
						</TabsTrigger>
						<TabsTrigger value="users">{t("admin.tabs.users")}</TabsTrigger>
						<TabsTrigger value="seoTools">
							{t("admin.tabs.seoTools")}
						</TabsTrigger>
					</TabsList>

					<TabsContent value="analytics" className="mt-6 space-y-6">
						<section id="pulse" className="space-y-6 scroll-mt-24">
							<GlobalPulse
								users={users}
								portfolio={portfolio}
								loading={loading}
							/>
							<GlobalGrowthChart data={growthSeries} />
						</section>
						<section id="logs" className="scroll-mt-24">
							<SystemLogs users={users} uploadErrors={uploadErrors} />
						</section>
					</TabsContent>

					<TabsContent value="users" className="mt-6 space-y-6">
						<section id="users" className="scroll-mt-24">
							<UserManagement
								users={users}
								roles={roles}
								loading={loading}
								onRefetch={refetch}
							/>
						</section>
						<section id="db" className="scroll-mt-24">
							<DatabaseExplorer portfolio={portfolio} leads={leads} />
						</section>
					</TabsContent>

					<TabsContent value="seoTools" className="mt-6">
						<section id="seo" className="scroll-mt-24">
							<SeoHub />
						</section>
					</TabsContent>
				</Tabs>
			</div>
		</AdminLayout>
	);
}
