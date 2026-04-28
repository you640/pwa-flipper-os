import { FileSearch, Hash, Link2, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function SeoHub() {
	const { t } = useTranslation();

	const cards = [
		{ icon: Hash, key: "keywordTracking" as const },
		{ icon: Link2, key: "backlinkPulse" as const },
		{ icon: FileSearch, key: "metaAuditor" as const },
	];

	return (
		<div className="space-y-6">
			<Card className="glass relative overflow-hidden p-6 shadow-elegant md:p-8">
				<div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
				<div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
				<div className="relative">
					<div className="flex items-center gap-2">
						<Sparkles className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-semibold tracking-tight text-foreground">
							{t("admin.seo.title")}
						</h2>
					</div>
					<p className="mt-2 max-w-2xl text-sm text-muted-foreground">
						{t("admin.seo.subtitle")}
					</p>

					<div
						id="seo-plugin-slot"
						data-seo-plugin-slot
						className="mt-6 flex min-h-[180px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-card/30 p-8 text-center transition-colors hover:border-primary/40 hover:bg-card/50"
					>
						<div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20">
							<Sparkles className="h-5 w-5 text-primary" />
						</div>
						<div className="text-sm font-medium text-foreground">
							{t("admin.seo.dropZoneTitle")}
						</div>
						<div className="mt-1 text-xs text-muted-foreground">
							{t("admin.seo.dropZoneHint")}
						</div>
					</div>
				</div>
			</Card>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{cards.map(({ icon: Icon, key }) => (
					<Card
						key={key}
						className="glow-border group relative overflow-hidden bg-gradient-card p-5 shadow-elegant transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow"
					>
						<div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />
						<div className="relative">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/60 ring-1 ring-border/60 text-primary">
								<Icon className="h-5 w-5" />
							</div>
							<h3 className="mt-4 text-base font-semibold text-foreground">
								{t(`admin.seo.${key}`)}
							</h3>
							<p className="mt-1 text-xs text-muted-foreground">
								{t("admin.seo.empty")}
							</p>
							<Button size="sm" variant="outline" disabled className="mt-4">
								{t("admin.seo.runAudit")}
							</Button>
						</div>
					</Card>
				))}
			</div>
		</div>
	);
}
