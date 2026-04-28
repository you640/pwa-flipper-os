import { Crown, ExternalLink, Loader2, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/hooks/useLocale";
import { useProfile } from "@/hooks/useProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";

export default function Billing() {
	const { isAdmin } = useProfile();
	const { subscription, isPro, loading, refetch } = useSubscription();
	const { t } = useTranslation();
	const { intlLocale } = useLocale();
	const [searchParams, setSearchParams] = useSearchParams();
	const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);

	// Handle Stripe redirect callbacks
	useEffect(() => {
		if (searchParams.get("success") === "1") {
			toast.success(t("billing.successToast"));
			refetch();
			setSearchParams({}, { replace: true });
		} else if (searchParams.get("canceled") === "1") {
			toast.info(t("billing.canceledToast"));
			setSearchParams({}, { replace: true });
		}
	}, [searchParams, setSearchParams, refetch, t]);

	const handleUpgrade = async () => {
		setBusy("checkout");
		try {
			const { data, error } = await supabase.functions.invoke(
				"create-checkout",
				{
					body: { origin: window.location.origin },
				},
			);
			if (error) throw error;
			if ((data as { alreadyActive?: boolean }).alreadyActive) {
				toast.info(t("billing.alreadyActive"));
				refetch();
				return;
			}
			const url = (data as { url?: string }).url;
			if (url) window.location.href = url;
			else throw new Error("No checkout URL returned");
		} catch {
			toast.error(t("billing.checkoutFailed"));
		} finally {
			setBusy(null);
		}
	};

	const handlePortal = async () => {
		setBusy("portal");
		try {
			const { data, error } = await supabase.functions.invoke(
				"customer-portal",
				{
					body: { origin: window.location.origin },
				},
			);
			if (error) throw error;
			const url = (data as { url?: string }).url;
			if (url) window.location.href = url;
			else throw new Error("No portal URL returned");
		} catch {
			toast.error(t("billing.portalFailed"));
		} finally {
			setBusy(null);
		}
	};

	// Plan display logic
	const isFounder = isAdmin;
	const planName = isFounder
		? t("billing.planFounder")
		: isPro
			? t("billing.planPro")
			: t("billing.planStarter");
	const planDesc = isFounder
		? t("billing.planFounderDesc")
		: isPro
			? t("billing.planProDesc")
			: t("billing.planStarterDesc");
	const PlanIcon = isFounder || isPro ? Crown : Sparkles;
	const badgeVariant: "default" | "secondary" =
		isFounder || isPro ? "default" : "secondary";

	const renewDate =
		isPro && subscription?.current_period_end
			? new Date(subscription.current_period_end).toLocaleDateString(intlLocale)
			: null;

	return (
		<AppLayout>
			<SEO title={t("seo.billingTitle")} description={t("seo.billingDesc")} />

			<div className="mx-auto max-w-3xl space-y-6">
				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						{t("billing.title")}
					</h1>
					<p className="text-sm text-muted-foreground">
						{t("billing.subtitle")}
					</p>
				</div>

				{/* Current plan card */}
				<div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl shadow-xl">
					<div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
					<div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
						<div className="flex items-start gap-4">
							<div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
								<PlanIcon className="h-6 w-6 text-primary-foreground" />
							</div>
							<div>
								<div className="flex flex-wrap items-center gap-2">
									<h2 className="text-lg font-semibold text-foreground">
										{planName}
									</h2>
									<Badge variant={badgeVariant}>{t("common.current")}</Badge>
								</div>
								<p className="mt-1 text-sm text-muted-foreground">{planDesc}</p>
								{renewDate && (
									<p className="mt-1 text-xs text-muted-foreground">
										{t("billing.renewsOn", { date: renewDate })}
									</p>
								)}
							</div>
						</div>

						{!isFounder && !loading && (
							<div className="flex flex-col gap-2 sm:items-end">
								{!isPro ? (
									<Button
										onClick={handleUpgrade}
										disabled={busy === "checkout"}
										className="bg-gradient-primary shadow-glow"
									>
										{busy === "checkout" ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Zap className="mr-2 h-4 w-4" />
										)}
										{t("billing.upgrade")}
									</Button>
								) : (
									<Button
										onClick={handlePortal}
										disabled={busy === "portal"}
										variant="outline"
									>
										{busy === "portal" ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<ExternalLink className="mr-2 h-4 w-4" />
										)}
										{t("billing.manage")}
									</Button>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Invoices */}
				<div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl">
					<div className="flex items-center justify-between">
						<h3 className="text-sm font-semibold text-foreground">
							{t("billing.invoices")}
						</h3>
						{isPro && (
							<Button
								size="sm"
								variant="ghost"
								onClick={handlePortal}
								disabled={busy === "portal"}
								className="text-xs"
							>
								{busy === "portal" ? (
									<Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
								) : (
									<ExternalLink className="mr-1.5 h-3 w-3" />
								)}
								{t("billing.openPortal")}
							</Button>
						)}
					</div>
					<p className="mt-2 text-sm text-muted-foreground">
						{isPro ? t("billing.invoicesHint") : t("billing.noInvoices")}
					</p>
				</div>
			</div>
		</AppLayout>
	);
}
