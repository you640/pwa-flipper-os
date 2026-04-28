import { Check, Crown, Loader2, Sparkles, Trophy, Zap } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { PricingWaitlistDialog } from "./PricingWaitlistDialog";

type TierKey = "free" | "pro" | "exit";

const ICONS: Record<TierKey, React.ComponentType<{ className?: string }>> = {
	free: Sparkles,
	pro: Crown,
	exit: Trophy,
};

export function PricingTab({ defaultEmail }: { defaultEmail?: string }) {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const [openTier, setOpenTier] = useState<"exit" | null>(null);
	const [checkoutBusy, setCheckoutBusy] = useState(false);

	const tiers: { key: TierKey; suffix: string; highlight?: boolean }[] = [
		{ key: "free", suffix: "" },
		{ key: "pro", suffix: t("pricing.perMonth"), highlight: true },
		{ key: "exit", suffix: t("pricing.successFee") },
	];

	const handleProCta = async () => {
		setCheckoutBusy(true);
		try {
			const { data: sessionData } = await supabase.auth.getSession();
			if (!sessionData.session) {
				navigate("/login");
				return;
			}
			const { data, error } = await supabase.functions.invoke(
				"create-checkout",
				{
					body: { origin: window.location.origin },
				},
			);
			if (error) throw error;
			if ((data as { alreadyActive?: boolean }).alreadyActive) {
				toast.info(t("billing.alreadyActive"));
				navigate("/billing");
				return;
			}
			const url = (data as { url?: string }).url;
			if (url) window.location.href = url;
			else throw new Error("No checkout URL");
		} catch {
			toast.error(t("billing.checkoutFailed"));
		} finally {
			setCheckoutBusy(false);
		}
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-lg font-semibold tracking-tight text-foreground">
					{t("pricing.title")}
				</h2>
				<p className="text-sm text-muted-foreground">{t("pricing.subtitle")}</p>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{tiers.map(({ key, suffix, highlight }) => {
					const Icon = ICONS[key];
					const features = t(`pricing.tiers.${key}.features`, {
						returnObjects: true,
					}) as string[];
					return (
						<div
							key={key}
							className={cn(
								"relative flex flex-col rounded-2xl border bg-card/40 p-6 backdrop-blur-xl transition-all",
								highlight
									? "border-primary/50 shadow-glow ring-1 ring-primary/30"
									: "border-border/60",
							)}
						>
							{highlight && (
								<Badge className="absolute -top-2 right-4 border-0 bg-gradient-primary text-primary-foreground">
									★
								</Badge>
							)}
							<div className="flex items-center gap-2">
								<div
									className={cn(
										"flex h-9 w-9 items-center justify-center rounded-xl ring-1",
										highlight
											? "bg-primary/15 text-primary ring-primary/30"
											: "bg-secondary/60 text-foreground/80 ring-border/60",
									)}
								>
									<Icon className="h-4 w-4" />
								</div>
								<div className="text-base font-semibold text-foreground">
									{t(`pricing.tiers.${key}.name`)}
								</div>
							</div>
							<div className="mt-4 flex items-baseline gap-1">
								<span className="text-3xl font-bold tracking-tight text-foreground">
									{t(`pricing.tiers.${key}.price`)}
								</span>
								{suffix && (
									<span className="text-xs text-muted-foreground">
										{suffix}
									</span>
								)}
							</div>
							<p className="mt-1 text-xs text-muted-foreground">
								{t(`pricing.tiers.${key}.tagline`)}
							</p>

							<ul className="mt-5 flex-1 space-y-2">
								{features.map((f) => (
									<li
										key={f}
										className="flex items-start gap-2 text-xs text-foreground/85"
									>
										<Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
										<span>{f}</span>
									</li>
								))}
							</ul>

							<div className="mt-5">
								{key === "free" ? (
									<Button variant="outline" className="w-full" disabled>
										{t("pricing.current")}
									</Button>
								) : key === "pro" ? (
									<Button
										onClick={handleProCta}
										disabled={checkoutBusy}
										className="w-full bg-gradient-primary text-primary-foreground shadow-glow"
									>
										{checkoutBusy ? (
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										) : (
											<Zap className="mr-2 h-4 w-4" />
										)}
										{t("pricing.cta")}
									</Button>
								) : (
									<Button
										onClick={() => setOpenTier("exit")}
										className="w-full"
										variant="outline"
									>
										{t("pricing.cta")}
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>

			{openTier && (
				<PricingWaitlistDialog
					open={!!openTier}
					onOpenChange={(v) => !v && setOpenTier(null)}
					tier={openTier}
					defaultEmail={defaultEmail}
				/>
			)}
		</div>
	);
}
