import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
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
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    MoreHorizontal,
    Plus,
    Radar,
    Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type Source = "acquire" | "flippa";

interface IntelRow {
	id: string;
	name: string;
	niche: string;
	source: Source;
	mrr: number;
	price: number;
}

type SortKey = "price" | "mrr" | null;
type SortDir = "asc" | "desc";

const formatUSD = (n: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 0,
	}).format(n);

const calcMultiplier = (price: number, mrr: number) =>
	mrr > 0 ? +(price / mrr).toFixed(1) : null;

const MARKET_SKELETON_ROW_KEYS = [
	"market-skeleton-1",
	"market-skeleton-2",
	"market-skeleton-3",
	"market-skeleton-4",
	"market-skeleton-5",
	"market-skeleton-6",
] as const;

export default function Market() {
	const { t } = useTranslation();
	const [rows, setRows] = useState<IntelRow[]>([]);
	const [loading, setLoading] = useState(true);
	const [query, setQuery] = useState("");
	const [sortKey, setSortKey] = useState<SortKey>("price");
	const [sortDir, setSortDir] = useState<SortDir>("desc");
	const [open, setOpen] = useState(false);

	// Fetch from Supabase on mount
	useEffect(() => {
		let cancelled = false;
		const fetchRows = async () => {
			const { data, error } = await supabase
				.from("market_intel")
				.select("*")
				.order("created_at", { ascending: false });

			if (cancelled) return;
			if (error) {
				console.error("Failed to load market intel", error);
				toast.error("Failed to load market intel", {
					description: "Please try again.",
				});
				setLoading(false);
				return;
			}
			setRows(
				(data ?? []).map((r) => ({
					id: r.id,
					name: r.name,
					niche: r.niche,
					source: r.source as Source,
					mrr: r.mrr,
					price: r.price,
				})),
			);
			setLoading(false);
		};
		fetchRows();
		return () => {
			cancelled = true;
		};
	}, []);

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase();
		let list = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
		if (sortKey) {
			list = [...list].sort((a, b) => {
				const diff = a[sortKey] - b[sortKey];
				return sortDir === "asc" ? diff : -diff;
			});
		}
		return list;
	}, [rows, query, sortKey, sortDir]);

	const toggleSort = (key: Exclude<SortKey, null>) => {
		if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir("desc");
		}
	};

	const handleAdd = async (row: Omit<IntelRow, "id" | "niche">) => {
		// Optimistic insert
		const tempId = `temp-${Date.now()}`;
		const optimistic: IntelRow = {
			...row,
			id: tempId,
			niche: "B2B SaaS",
		};
		setRows((prev) => [optimistic, ...prev]);
		setOpen(false);

		const { data, error } = await supabase
			.from("market_intel")
			.insert({
				name: row.name,
				source: row.source,
				mrr: row.mrr,
				price: row.price,
			})
			.select()
			.single();

		if (error) {
			// Roll back optimistic update
			setRows((prev) => prev.filter((r) => r.id !== tempId));
			console.error("Failed to add intel", error);
			toast.error("Failed to add intel", { description: "Please try again." });
			return;
		}

		// Replace temp row with real one
		setRows((prev) =>
			prev.map((r) =>
				r.id === tempId
					? {
							id: data.id,
							name: data.name,
							niche: data.niche,
							source: data.source as Source,
							mrr: data.mrr,
							price: data.price,
						}
					: r,
			),
		);
		toast.success("Market intel added!", {
			description: `${row.name} · ${formatUSD(row.price)}`,
		});
	};

	const handleDelete = async (id: string) => {
		const prev = rows;
		setRows((p) => p.filter((r) => r.id !== id)); // optimistic
		const { error } = await supabase.from("market_intel").delete().eq("id", id);
		if (error) {
			setRows(prev); // rollback
			console.error("Failed to delete market intel", error);
			toast.error("Failed to delete", { description: "Please try again." });
			return;
		}
		toast.success("Listing deleted");
	};

	return (
		<AppLayout>
			<SEO title={t("seo.marketTitle")} description={t("seo.marketDesc")} />
			<div className="mx-auto w-full max-w-[1400px] space-y-6">
				<motion.header
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="flex flex-wrap items-end justify-between gap-3"
				>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
							{t("market.title")}{" "}
							<span className="text-gradient">{t("market.titleAccent")}</span>
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("market.subtitle")}
						</p>
					</div>
					<div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
						<Radar className="h-3.5 w-3.5 text-primary" />
						{loading
							? t("common.loading")
							: t("market.tracked", { count: rows.length })}
					</div>
				</motion.header>

				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
				>
					<Card className="glass overflow-hidden p-5 shadow-elegant md:p-6">
						{/* Toolbar */}
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div className="relative w-full max-w-xs">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
								<Input
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder={t("market.searchPh")}
									className="h-10 bg-card/40 pl-9"
								/>
							</div>

							<Dialog open={open} onOpenChange={setOpen}>
								<DialogTrigger asChild>
									<Button className="group relative h-10 overflow-hidden bg-gradient-primary font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)]">
										<span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
										<Plus className="mr-1 h-4 w-4" />
										{t("market.addIntel")}
									</Button>
								</DialogTrigger>
								<AddIntelDialog onSubmit={handleAdd} />
							</Dialog>
						</div>

						{/* Table */}
						<div className="mt-5 overflow-x-auto rounded-xl border border-border/50">
							<Table>
								<TableHeader>
									<TableRow className="border-border/60 hover:bg-transparent">
										<TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
											App
										</TableHead>
										<TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
											Source
										</TableHead>
										<TableHead className="text-right">
											<SortBtn
												active={sortKey === "mrr"}
												dir={sortDir}
												onClick={() => toggleSort("mrr")}
											>
												MRR
											</SortBtn>
										</TableHead>
										<TableHead className="text-right">
											<SortBtn
												active={sortKey === "price"}
												dir={sortDir}
												onClick={() => toggleSort("price")}
											>
												Listed Price
											</SortBtn>
										</TableHead>
										<TableHead className="text-right text-xs uppercase tracking-wider text-muted-foreground">
											Multiplier
										</TableHead>
										<TableHead className="w-12" />
									</TableRow>
								</TableHeader>
								<TableBody>
									{loading &&
										MARKET_SKELETON_ROW_KEYS.map((rowKey) => (
											<TableRow
												key={rowKey}
												className="border-b border-border/40 hover:bg-transparent"
											>
												<TableCell className="py-3.5">
													<Skeleton className="h-4 w-32" />
													<Skeleton className="mt-2 h-3 w-16" />
												</TableCell>
												<TableCell>
													<Skeleton className="h-5 w-20" />
												</TableCell>
												<TableCell className="text-right">
													<Skeleton className="ml-auto h-4 w-16" />
												</TableCell>
												<TableCell className="text-right">
													<Skeleton className="ml-auto h-4 w-20" />
												</TableCell>
												<TableCell className="text-right">
													<Skeleton className="ml-auto h-4 w-10" />
												</TableCell>
												<TableCell />
											</TableRow>
										))}

									{!loading && filtered.length === 0 && (
										<TableRow>
											<TableCell
												colSpan={6}
												className="py-12 text-center text-sm text-muted-foreground"
											>
												{rows.length === 0
													? 'No listings yet. Click "Add Intel" to log your first one.'
													: "No listings match your search."}
											</TableCell>
										</TableRow>
									)}

									{!loading &&
										filtered.map((row, i) => {
											const mult = calcMultiplier(row.price, row.mrr);
											return (
												<motion.tr
													key={row.id}
													initial={{ opacity: 0, y: 6 }}
													animate={{ opacity: 1, y: 0 }}
													transition={{
														duration: 0.3,
														delay: Math.min(i * 0.04, 0.4),
														ease: "easeOut",
													}}
													className="border-b border-border/40 transition-colors hover:bg-card/40"
												>
													<TableCell className="py-3.5">
														<div className="font-semibold text-foreground">
															{row.name}
														</div>
														<Badge
															variant="outline"
															className="mt-1 border-border/60 bg-secondary/40 px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
														>
															{row.niche}
														</Badge>
													</TableCell>
													<TableCell>
														<SourceBadge source={row.source} />
													</TableCell>
													<TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
														{row.mrr > 0 ? formatUSD(row.mrr) : "—"}
													</TableCell>
													<TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">
														{formatUSD(row.price)}
													</TableCell>
													<TableCell className="text-right">
														{mult !== null ? (
															<span className="font-mono text-sm tabular-nums text-primary-glow">
																{mult}×
															</span>
														) : (
															<Badge className="border-0 bg-warning/15 text-warning ring-1 ring-warning/30">
																Asset
															</Badge>
														)}
													</TableCell>
													<TableCell className="text-right">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<button
																	type="button"
																	title="Actions"
																	className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
																>
																	<MoreHorizontal className="h-4 w-4" />
																</button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end" className="w-36">
																<DropdownMenuItem>Edit</DropdownMenuItem>
																<DropdownMenuSeparator />
																<DropdownMenuItem
																	className="text-destructive focus:text-destructive"
																	onClick={() => handleDelete(row.id)}
																>
																	Delete
																</DropdownMenuItem>
															</DropdownMenuContent>
														</DropdownMenu>
													</TableCell>
												</motion.tr>
											);
										})}
								</TableBody>
							</Table>
						</div>
					</Card>
				</motion.div>
			</div>
		</AppLayout>
	);
}

function SortBtn({
	active,
	dir,
	onClick,
	children,
}: {
	active: boolean;
	dir: SortDir;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"ml-auto inline-flex items-center gap-1 text-xs uppercase tracking-wider transition-colors",
				active
					? "text-foreground"
					: "text-muted-foreground hover:text-foreground",
			)}
		>
			{children}
			{!active && <ArrowUpDown className="h-3 w-3 opacity-60" />}
			{active && dir === "asc" && <ArrowUp className="h-3 w-3" />}
			{active && dir === "desc" && <ArrowDown className="h-3 w-3" />}
		</button>
	);
}

function SourceBadge({ source }: { source: Source }) {
	if (source === "acquire") {
		return (
			<Badge
				variant="outline"
				className="border-border/60 bg-secondary/60 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"
			>
				Acquire.com
			</Badge>
		);
	}
	return (
		<Badge className="border-0 bg-sky-500/15 text-[10px] font-medium uppercase tracking-wider text-sky-300 ring-1 ring-sky-500/30">
			Flippa
		</Badge>
	);
}

function AddIntelDialog({
	onSubmit,
}: {
	onSubmit: (row: {
		name: string;
		source: Source;
		mrr: number;
		price: number;
	}) => void;
}) {
	const { t } = useTranslation();
	const [name, setName] = useState("");
	const [source, setSource] = useState<Source>("acquire");
	const [mrr, setMrr] = useState("");
	const [price, setPrice] = useState("");

	const valid = name.trim().length > 0 && Number(price) > 0;

	const submit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!valid) return;
		onSubmit({
			name: name.trim(),
			source,
			mrr: Number(mrr) || 0,
			price: Number(price) || 0,
		});
		setName("");
		setSource("acquire");
		setMrr("");
		setPrice("");
	};

	return (
		<DialogContent className="glass border-border/60 sm:max-w-md">
			<DialogHeader>
				<DialogTitle>{t("market.dialogTitle")}</DialogTitle>
				<DialogDescription>{t("market.dialogDesc")}</DialogDescription>
			</DialogHeader>
			<form onSubmit={submit} className="space-y-4">
				<div className="space-y-1.5">
					<Label
						htmlFor="m-name"
						className="text-xs uppercase tracking-wider text-muted-foreground"
					>
						{t("market.app")}
					</Label>
					<Input
						id="m-name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder={t("market.appNamePh")}
						className="h-10 bg-card/40"
					/>
				</div>

				<div className="space-y-1.5">
					<Label className="text-xs uppercase tracking-wider text-muted-foreground">
						{t("market.source")}
					</Label>
					<Select value={source} onValueChange={(v) => setSource(v as Source)}>
						<SelectTrigger className="h-10 bg-card/40">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="acquire">Acquire.com</SelectItem>
							<SelectItem value="flippa">Flippa</SelectItem>
						</SelectContent>
					</Select>
				</div>

				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1.5">
						<Label
							htmlFor="m-mrr"
							className="text-xs uppercase tracking-wider text-muted-foreground"
						>
							{t("market.mrr")} ($)
						</Label>
						<Input
							id="m-mrr"
							type="number"
							min={0}
							value={mrr}
							onChange={(e) => setMrr(e.target.value)}
							placeholder="0"
							className="h-10 bg-card/40"
						/>
					</div>
					<div className="space-y-1.5">
						<Label
							htmlFor="m-price"
							className="text-xs uppercase tracking-wider text-muted-foreground"
						>
							{t("market.listedPrice")} ($)
						</Label>
						<Input
							id="m-price"
							type="number"
							min={0}
							value={price}
							onChange={(e) => setPrice(e.target.value)}
							placeholder="0"
							className="h-10 bg-card/40"
						/>
					</div>
				</div>

				<DialogFooter className="pt-2">
					<Button
						type="submit"
						disabled={!valid}
						className="bg-gradient-primary font-semibold text-primary-foreground shadow-glow hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] disabled:opacity-50"
					>
						{t("market.saveBtn")}
					</Button>
				</DialogFooter>
			</form>
		</DialogContent>
	);
}
