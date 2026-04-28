import { motion } from "framer-motion";
import {
	ArrowRight,
	Search,
	ShoppingBag,
	Sparkles,
	TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface Listing {
	id: string;
	name: string;
	mrr: number;
	expenses: number;
	asking_price: number;
	user_id: string;
	listed_at: string | null;
}

const formatUSD = (n: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(n);

const DEAL_ROOM_SKELETON_KEYS = [
	"deal-room-skeleton-1",
	"deal-room-skeleton-2",
	"deal-room-skeleton-3",
	"deal-room-skeleton-4",
	"deal-room-skeleton-5",
	"deal-room-skeleton-6",
] as const;

export default function DealRoom() {
	const { t } = useTranslation();
	const [listings, setListings] = useState<Listing[]>([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState("");
	const [active, setActive] = useState<Listing | null>(null);
	const [buyerEmail, setBuyerEmail] = useState("");
	const [buyerName, setBuyerName] = useState("");
	const [message, setMessage] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data, error } = await supabase
				.from("portfolio")
				.select("id,name,mrr,expenses,asking_price,user_id,listed_at")
				.eq("for_sale", true)
				.order("listed_at", { ascending: false, nullsFirst: false });
			if (cancelled) return;
			if (error) {
				toast.error(t("deals.loadFailed"));
			} else {
				setListings((data ?? []) as Listing[]);
			}
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [t]);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return listings;
		return listings.filter((l) => l.name.toLowerCase().includes(q));
	}, [listings, search]);

	const submitInquiry = async () => {
		if (!active) return;
		if (!buyerEmail.includes("@") || message.trim().length < 5) {
			toast.error(t("deals.inquiry.invalid"));
			return;
		}
		setSubmitting(true);
		const { error } = await supabase.from("deal_inquiries").insert({
			portfolio_id: active.id,
			seller_user_id: active.user_id,
			buyer_email: buyerEmail.trim(),
			buyer_name: buyerName.trim() || null,
			message: message.trim(),
		});
		setSubmitting(false);
		if (error) {
			toast.error(t("deals.inquiry.failed"), { description: error.message });
			return;
		}
		toast.success(t("deals.inquiry.sent"));
		setActive(null);
		setBuyerEmail("");
		setBuyerName("");
		setMessage("");
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Helmet>
				<title>{t("deals.seo.title")}</title>
				<meta name="description" content={t("deals.seo.desc")} />
				<link rel="canonical" href="https://rubberduck.space/deals" />
			</Helmet>

			<header className="sticky top-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-xl">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
					<Link
						to="/"
						className="flex items-center gap-2 text-sm font-semibold tracking-tight"
					>
						<span className="text-xl">🦆</span>
						<span className="text-gradient">RUBBERDUCK.SPACE</span>
					</Link>
					<Button asChild variant="ghost" size="sm">
						<Link to="/login">{t("auth.signIn")}</Link>
					</Button>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 pb-20 pt-10 md:pt-16">
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4 }}
					className="text-center"
				>
					<Badge
						variant="outline"
						className="mb-4 inline-flex border-0 bg-secondary/60 text-[11px] uppercase tracking-[0.18em] text-primary ring-1 ring-primary/30"
					>
						<ShoppingBag className="mr-1.5 h-3 w-3" />
						{t("deals.badge")}
					</Badge>
					<h1 className="text-balance text-3xl font-bold tracking-tight md:text-5xl">
						{t("deals.title")}{" "}
						<span className="text-gradient">{t("deals.titleAccent")}</span>
					</h1>
					<p className="mx-auto mt-4 max-w-2xl text-balance text-sm text-muted-foreground md:text-base">
						{t("deals.subtitle")}
					</p>
				</motion.div>

				<div className="mx-auto mt-8 max-w-md">
					<div className="relative">
						<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={t("deals.searchPh")}
							className="h-11 pl-9"
						/>
					</div>
				</div>

				<section className="mt-10">
					{loading ? (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{DEAL_ROOM_SKELETON_KEYS.map((skeletonKey) => (
								<Skeleton key={skeletonKey} className="h-44 w-full rounded-2xl" />
							))}
						</div>
					) : filtered.length === 0 ? (
						<div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-12 text-center text-sm text-muted-foreground">
							{t("deals.empty")}
						</div>
					) : (
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
							{filtered.map((l, i) => {
								const profit = (l.mrr ?? 0) - (l.expenses ?? 0);
								return (
									<motion.div
										key={l.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ duration: 0.3, delay: i * 0.04 }}
									>
										<Card className="glass relative flex h-full flex-col overflow-hidden p-5 shadow-elegant">
											<div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
											<div className="relative flex items-center gap-2">
												<Sparkles className="h-4 w-4 text-primary" />
												<h3 className="truncate text-base font-semibold text-foreground">
													{l.name}
												</h3>
											</div>
											<div className="relative mt-4">
												<div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
													{t("deals.askingPrice")}
												</div>
												<div className="text-2xl font-bold tabular-nums text-success">
													{l.asking_price > 0 ? formatUSD(l.asking_price) : "—"}
												</div>
											</div>
											<div className="relative mt-3 grid grid-cols-2 gap-2 text-xs">
												<div className="rounded-md bg-secondary/50 px-2 py-1.5">
													<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
														MRR
													</div>
													<div className="font-medium text-foreground">
														{formatUSD(l.mrr ?? 0)}
													</div>
												</div>
												<div className="rounded-md bg-secondary/50 px-2 py-1.5">
													<div className="text-[10px] uppercase tracking-wider text-muted-foreground">
														{t("deals.netProfit")}
													</div>
													<div
														className={`font-medium ${
															profit > 0
																? "text-success"
																: "text-muted-foreground"
														}`}
													>
														{formatUSD(profit)}
													</div>
												</div>
											</div>
											<Button
												onClick={() => setActive(l)}
												className="relative mt-5 w-full bg-gradient-primary text-primary-foreground"
											>
												<TrendingUp className="mr-2 h-4 w-4" />
												{t("deals.contactSeller")}
												<ArrowRight className="ml-2 h-4 w-4" />
											</Button>
										</Card>
									</motion.div>
								);
							})}
						</div>
					)}
				</section>
			</main>

			<Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("deals.inquiry.title")}</DialogTitle>
						<DialogDescription>
							{active && t("deals.inquiry.subtitle", { name: active.name })}
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="bemail">{t("deals.inquiry.email")}</Label>
							<Input
								id="bemail"
								type="email"
								value={buyerEmail}
								onChange={(e) => setBuyerEmail(e.target.value)}
								placeholder="you@company.com"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="bname">{t("deals.inquiry.name")}</Label>
							<Input
								id="bname"
								value={buyerName}
								onChange={(e) => setBuyerName(e.target.value)}
								placeholder={t("deals.inquiry.namePh")}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="bmsg">{t("deals.inquiry.message")}</Label>
							<Textarea
								id="bmsg"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								rows={5}
								placeholder={t("deals.inquiry.messagePh")}
								maxLength={2000}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setActive(null)}>
							{t("common.cancel")}
						</Button>
						<Button onClick={submitInquiry} disabled={submitting}>
							{submitting ? t("common.pleaseWait") : t("deals.inquiry.send")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
