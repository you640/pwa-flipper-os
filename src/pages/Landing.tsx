import { PricingTab } from "@/components/pricing/PricingTab";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnalyzingState } from "@/components/valuation/AnalyzingState";
import { CodeHealthGauge } from "@/components/valuation/CodeHealthGauge";
import { type AiValuationReport, useAiValuation } from "@/hooks/useAiValuation";
import { supabase } from "@/integrations/supabase/client";
import { downloadBlob, generateShareImage } from "@/lib/shareImage";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowRight,
    BarChart2,
    Brain,
    CheckCircle2,
    FileText,
    Github,
    LayoutDashboard,
    Lock,
    Rocket,
    Share2,
    ShieldCheck,
    Sparkles,
    Store,
    TrendingUp,
    Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

const GITHUB_RE = /^https?:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/i;
const ANON_USED_KEY = "rd_anon_audit_used";

const TEASER_PLACEHOLDER_IDS = [
	"teaser-placeholder-1",
	"teaser-placeholder-2",
	"teaser-placeholder-3",
] as const;

const formatEUR = (n: number) =>
	new Intl.NumberFormat("de-DE", {
		style: "currency",
		currency: "EUR",
		maximumFractionDigits: 0,
	}).format(n);

export default function Landing() {
	const { t } = useTranslation();
	const navigate = useNavigate();
	const { run, loading, report } = useAiValuation();
	const [github, setGithub] = useState("");
	const [authed, setAuthed] = useState<boolean | null>(null);
	const [anonUsed, setAnonUsed] = useState(
		typeof window !== "undefined" &&
			localStorage.getItem(ANON_USED_KEY) === "1",
	);

	useEffect(() => {
		let mounted = true;
		supabase.auth.getSession().then(({ data }) => {
			if (!mounted) return;
			const has = !!data.session;
			setAuthed(has);
			if (has) navigate("/dashboard", { replace: true });
		});
		return () => {
			mounted = false;
		};
	}, [navigate]);

	const valid = GITHUB_RE.test(github.trim());

	const handleAudit = async () => {
		if (!valid) {
			toast.error(t("landing.invalidUrl"));
			return;
		}
		if (anonUsed) {
			toast.error(t("landing.anonLimit"));
			return;
		}
		const repoName = github
			.trim()
			.split("/")
			.slice(-1)[0]
			.replace(/\.git$/, "");
		const result = await run({
			anonymous: true,
			name: repoName || "Untitled",
			github_url: github.trim(),
			mrr: 0,
			expenses: 0,
			niche: "B2B SaaS",
		});
		if ((result as { _anonLimit?: boolean })?._anonLimit) {
			localStorage.setItem(ANON_USED_KEY, "1");
			setAnonUsed(true);
			return;
		}
		if (result) {
			localStorage.setItem(ANON_USED_KEY, "1");
			setAnonUsed(true);
		}
	};

	const handleShare = async () => {
		if (!report) return;
		const blob = await generateShareImage({
			appName: github.trim().split("/").slice(-1)[0] || "My App",
			valuation: report.estimated_valuation.mid,
			codeScore: report.code_quality_score,
			codeLabel: report.code_quality_label,
		});
		if (blob) {
			downloadBlob(blob, `rubberduck-score-${Date.now()}.png`);
			toast.success(t("landing.share.downloaded"));
		}
	};

	if (authed === true) return null; // redirecting

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Helmet>
				<title>{t("landing.seo.title")}</title>
				<meta name="description" content={t("landing.seo.desc")} />
				<meta
					name="keywords"
					content="SaaS valuation, sell my PWA, GitHub code audit, micro-SaaS broker, AI app valuation, flip PWA"
				/>
				<link rel="canonical" href="https://rubberduck.space/" />
				<meta property="og:title" content={t("landing.seo.title")} />
				<meta property="og:description" content={t("landing.seo.desc")} />
				<meta property="og:url" content="https://rubberduck.space/" />
				<meta property="og:type" content="website" />
				<meta name="twitter:card" content="summary_large_image" />
				<script type="application/ld+json">
					{JSON.stringify({
						"@context": "https://schema.org",
						"@type": "WebApplication",
						name: "RUBBERDUCK.SPACE",
						url: "https://rubberduck.space/",
						applicationCategory: "BusinessApplication",
						description: t("landing.seo.desc"),
						offers: {
							"@type": "Offer",
							price: "0",
							priceCurrency: "EUR",
						},
					})}
				</script>
			</Helmet>

			{/* Top nav */}
			<header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
					<Link
						to="/"
						className="flex items-center gap-2 text-sm font-semibold tracking-tight"
					>
						<span className="text-xl">🦆</span>
						<span className="text-gradient">RUBBERDUCK.SPACE</span>
					</Link>
					<div className="flex items-center gap-2">
						<Button asChild variant="ghost" size="sm">
							<Link to="/login">{t("auth.signIn")}</Link>
						</Button>
						<Button
							asChild
							size="sm"
							className="bg-gradient-primary text-primary-foreground"
						>
							<Link to="/login?signup=1">{t("landing.nav.start")}</Link>
						</Button>
					</div>
				</div>
			</header>

			{/* HERO */}
			<main className="mx-auto max-w-6xl px-4 pb-20 pt-12 md:pt-20">
				<section className="relative overflow-hidden">
					<div className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
					<div className="pointer-events-none absolute right-0 top-32 -z-10 h-72 w-72 rounded-full bg-accent/15 blur-[100px]" />

					<motion.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className="text-center"
					>
						<Badge
							variant="outline"
							className="mb-6 inline-flex border-0 bg-secondary/60 text-[11px] uppercase tracking-[0.18em] text-primary ring-1 ring-primary/30"
						>
							<Sparkles className="mr-1.5 h-3 w-3" />
							{t("landing.heroBadge")}
						</Badge>
						<h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl">
							{t("landing.heroTitle")}{" "}
							<span className="text-gradient">
								{t("landing.heroTitleAccent")}
							</span>
						</h1>
						<p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
							{t("landing.heroSub")}
						</p>
					</motion.div>

					{/* Hero input */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className="mx-auto mt-10 max-w-2xl"
					>
						<Card className="glass relative overflow-hidden p-4 shadow-elegant md:p-5">
							<div className="absolute -top-20 -right-20 h-44 w-44 rounded-full bg-primary/15 blur-3xl" />
							<div className="relative flex flex-col gap-2 sm:flex-row">
								<div className="relative flex-1">
									<Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
									<Input
										type="url"
										inputMode="url"
										autoComplete="url"
										placeholder={t("landing.inputPh")}
										value={github}
										onChange={(e) => setGithub(e.target.value)}
										className={cn(
											"h-12 bg-card/40 pl-9 text-sm md:text-base",
											github.length > 0 && !valid && "border-destructive/60",
											valid && "border-success/50",
										)}
										maxLength={300}
										aria-label={t("landing.inputPh")}
									/>
								</div>
								<Button
									onClick={handleAudit}
									disabled={!valid || loading || anonUsed}
									className="group relative h-12 overflow-hidden bg-gradient-primary px-6 font-semibold text-primary-foreground shadow-glow"
								>
									<span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
									<Brain className="mr-1.5 h-4 w-4" />
									{loading ? t("landing.analyzing") : t("landing.cta")}
								</Button>
							</div>
							<div className="relative mt-2 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
								<span className="flex items-center gap-1">
									<ShieldCheck className="h-3 w-3 text-success" />
									{t("landing.gateNote")}
								</span>
								{anonUsed && !report && (
									<Link
										to="/login?signup=1"
										className="text-primary underline-offset-2 hover:underline"
									>
										{t("landing.anonUsedCta")}
									</Link>
								)}
							</div>
						</Card>
					</motion.div>

					{/* RESULT */}
					<AnimatePresence mode="wait">
						{loading && (
							<motion.div
								key="loading"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className="mx-auto mt-12 max-w-3xl"
							>
								<Card className="glow-border bg-gradient-card p-8 shadow-elegant">
									<AnalyzingState />
								</Card>
							</motion.div>
						)}

						{!loading && report && (
							<motion.div
								key="result"
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0 }}
								className="mx-auto mt-12 max-w-3xl"
							>
								<TeaserResult report={report} onShare={handleShare} />
							</motion.div>
						)}
					</AnimatePresence>

					{/* Trust strip */}
					{!report && !loading && (
						<div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
							<span>{t("landing.trust.audits")}</span>
							<span className="h-1 w-1 rounded-full bg-border" />
							<span>{t("landing.trust.ai")}</span>
							<span className="h-1 w-1 rounded-full bg-border" />
							<span>{t("landing.trust.exit")}</span>
						</div>
					)}
				</section>

				{/* HOW IT WORKS */}
				<section className="mt-28">
					<h2 className="text-center text-2xl font-semibold tracking-tight md:text-3xl">
						{t("landing.how.title")}
					</h2>
					<div className="mt-10 grid gap-5 md:grid-cols-3">
						{[
							{ icon: Github, key: "step1" },
							{ icon: Brain, key: "step2" },
							{ icon: TrendingUp, key: "step3" },
						].map(({ icon: Icon, key }, i) => (
							<Card key={key} className="glass p-6">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
									<Icon className="h-5 w-5" />
								</div>
								<div className="mt-4 text-xs uppercase tracking-wider text-muted-foreground">
									{t("landing.how.step", { n: i + 1 })}
								</div>
								<h3 className="mt-1 text-lg font-semibold">
									{t(`landing.how.${key}.title`)}
								</h3>
								<p className="mt-2 text-sm text-muted-foreground">
									{t(`landing.how.${key}.desc`)}
								</p>
							</Card>
						))}
					</div>
				</section>

				{/* FEATURES */}
				<FeaturesSection />

				{/* PRICING */}
				<section className="mt-28">
					<div className="mb-8 text-center">
						<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
							{t("pricing.title")}
						</h2>
						<p className="mt-2 text-sm text-muted-foreground">
							{t("pricing.subtitle")}
						</p>
					</div>
					<PricingTab />
				</section>

				{/* FINAL CTA */}
				<section className="mt-28 text-center">
					<Rocket className="mx-auto h-8 w-8 text-primary" />
					<h2 className="mt-3 text-2xl font-semibold md:text-3xl">
						{t("landing.finalCta.title")}
					</h2>
					<p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
						{t("landing.finalCta.sub")}
					</p>
					<Button
						asChild
						size="lg"
						className="mt-6 bg-gradient-primary text-primary-foreground shadow-glow"
					>
						<Link to="/login?signup=1">
							{t("landing.finalCta.btn")}{" "}
							<ArrowRight className="ml-1 h-4 w-4" />
						</Link>
					</Button>
				</section>
			</main>

			<footer className="border-t border-border/50 py-8 text-center text-xs text-muted-foreground">
				© {new Date().getFullYear()} RUBBERDUCK.SPACE ·{" "}
				{t("landing.footer.tagline")}
			</footer>
		</div>
	);
}

function FeaturesSection() {
	const { t } = useTranslation();

	const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
		Brain,
		LayoutDashboard,
		Store,
		Users,
		BarChart2,
		FileText,
	};

	const items = t("landing.features.items", { returnObjects: true }) as Array<{
		icon: string;
		title: string;
		desc: string;
	}>;

	return (
		<section className="mt-28">
			<div className="mb-10 text-center">
				<h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
					{t("landing.features.title")}
				</h2>
				<p className="mt-2 text-sm text-muted-foreground">
					{t("landing.features.sub")}
				</p>
			</div>
			<div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
				{items.map(({ icon, title, desc }) => {
					const Icon = ICONS[icon] ?? Sparkles;
					return (
						<motion.div
							key={title}
							initial={{ opacity: 0, y: 12 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-60px" }}
							transition={{ duration: 0.4 }}
						>
							<Card className="glass flex h-full flex-col gap-4 p-6">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
									<Icon className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-sm font-semibold text-foreground">
										{title}
									</h3>
									<p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
										{desc}
									</p>
								</div>
							</Card>
						</motion.div>
					);
				})}
			</div>
		</section>
	);
}

function TeaserResult({
	report,
	onShare,
}: {
	report: AiValuationReport;
	onShare: () => void;
}) {
	const { t } = useTranslation();
	const { low, mid, high } = report.estimated_valuation;
	return (
		<Card className="glow-border relative overflow-hidden bg-gradient-card p-6 shadow-elegant md:p-8">
			<div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
			<div className="relative space-y-6">
				<div className="text-center">
					<div className="text-[11px] uppercase tracking-[0.18em] text-primary">
						{t("landing.teaser.eyebrow")}
					</div>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={{ duration: 0.5 }}
						className="text-gradient mt-3 text-5xl font-bold tracking-tight md:text-7xl drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
					>
						{formatEUR(mid)}
					</motion.div>
					<div className="mt-2 text-xs text-muted-foreground">
						{formatEUR(low)} – {formatEUR(high)}
					</div>
				</div>

				<CodeHealthGauge
					score={report.code_quality_score}
					label={report.code_quality_label}
				/>

				{report.tech_stack_audit?.detected_stack?.length > 0 && (
					<div className="flex flex-wrap justify-center gap-1.5">
						{report.tech_stack_audit.detected_stack.slice(0, 6).map((tech) => (
							<Badge
								key={tech}
								variant="outline"
								className="border-0 bg-secondary/60 text-[11px] text-foreground/90 ring-1 ring-border/60"
							>
								{tech}
							</Badge>
						))}
					</div>
				)}

				{/* BLURRED PREMIUM SECTIONS */}
				<div className="relative overflow-hidden rounded-xl border border-border/50">
					<div
						className="space-y-3 p-5 blur-[6px] select-none pointer-events-none"
						aria-hidden="true"
					>
						<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
							{t("valuation.ai.report.refactorTips")}
						</div>
						{TEASER_PLACEHOLDER_IDS.map((placeholderId, index) => (
							<div
								key={placeholderId}
								className="rounded-lg border border-border/50 bg-card/40 p-3"
							>
								<div className="text-sm font-medium">
									Refactor opportunity #{index + 1}
								</div>
								<div className="mt-1 text-xs text-muted-foreground">
									Clean up duplicated flows, tighten onboarding, and remove
									manual review steps before launch.
								</div>
							</div>
						))}
						<div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
							{t("valuation.ai.report.valueUpTips")}
						</div>
						{TEASER_PLACEHOLDER_IDS.map((placeholderId, index) => (
							<div
								key={`${placeholderId}-value-up`}
								className="rounded-lg border border-border/50 bg-card/40 p-3"
							>
								<div className="text-sm font-medium">
									Value-up opportunity #{index + 1}
								</div>
								<div className="mt-1 text-xs text-muted-foreground">
									Improve retention loops, add monetization hooks, and package
									the offer for faster buyer diligence.
								</div>
							</div>
						))}
					</div>
					<div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 p-6 text-center backdrop-blur-sm">
						<Lock className="h-8 w-8 text-primary" />
						<h3 className="mt-3 text-lg font-semibold">
							{t("landing.locked.title")}
						</h3>
						<p className="mt-1 max-w-sm text-sm text-muted-foreground">
							{t("landing.locked.desc")}
						</p>
						<ul className="mt-4 space-y-1.5 text-left text-xs text-muted-foreground">
							{[
								t("landing.locked.b1"),
								t("landing.locked.b2"),
								t("landing.locked.b3"),
								t("landing.locked.b4"),
							].map((b) => (
								<li key={b} className="flex items-start gap-2">
									<CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
									<span>{b}</span>
								</li>
							))}
						</ul>
						<Button
							asChild
							size="lg"
							className="mt-5 bg-gradient-primary text-primary-foreground shadow-glow"
						>
							<Link to="/login?signup=1">
								{t("landing.locked.cta")}{" "}
								<ArrowRight className="ml-1 h-4 w-4" />
							</Link>
						</Button>
					</div>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row">
					<Button onClick={onShare} variant="outline" className="h-11 flex-1">
						<Share2 className="mr-2 h-4 w-4" />
						{t("landing.share.btn")}
					</Button>
					<Button
						asChild
						className="h-11 flex-1 bg-gradient-primary text-primary-foreground"
					>
						<Link to="/login?signup=1">{t("landing.locked.cta")}</Link>
					</Button>
				</div>
			</div>
		</Card>
	);
}
