import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import type { Database } from "@/integrations/supabase/types";

type Portfolio = Database["public"]["Tables"]["portfolio"]["Row"];
type Lead = Database["public"]["Tables"]["crm_leads"]["Row"];

const PAGE_SIZE = 20;

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
	if (!rows.length) return;
	const headers = Object.keys(rows[0]);
	const escape = (v: unknown) => {
		const s = v === null || v === undefined ? "" : String(v);
		return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
	};
	const csv = [
		headers.join(","),
		...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
	].join("\n");
	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

function Paginated<T>({
	rows,
	columns,
	renderRow,
	csvFilename,
	emptyText,
}: {
	rows: T[];
	columns: string[];
	renderRow: (row: T) => React.ReactNode;
	csvFilename: string;
	emptyText: string;
}) {
	const { t } = useTranslation();
	const [page, setPage] = useState(0);
	const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
	const slice = rows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<div className="text-xs text-muted-foreground">
					{t("admin.db.page")} {page + 1} / {totalPages} · {rows.length}
				</div>
				<Button
					size="sm"
					variant="outline"
					onClick={() =>
						downloadCsv(
							csvFilename,
							rows as unknown as Record<string, unknown>[],
						)
					}
					disabled={rows.length === 0}
				>
					<Download className="mr-1.5 h-3.5 w-3.5" />
					{t("admin.db.exportCsv")}
				</Button>
			</div>
			<div className="overflow-hidden rounded-lg border border-border/60">
				<Table>
					<TableHeader>
						<TableRow>
							{columns.map((c) => (
								<TableHead key={c}>{c}</TableHead>
							))}
						</TableRow>
					</TableHeader>
					<TableBody>
						{slice.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="py-6 text-center text-sm text-muted-foreground"
								>
									{emptyText}
								</TableCell>
							</TableRow>
						) : (
							slice.map(renderRow)
						)}
					</TableBody>
				</Table>
			</div>
			<div className="flex items-center justify-end gap-2">
				<Button
					size="sm"
					variant="ghost"
					disabled={page === 0}
					onClick={() => setPage((p) => Math.max(0, p - 1))}
				>
					<ChevronLeft className="h-4 w-4" />
				</Button>
				<Button
					size="sm"
					variant="ghost"
					disabled={page >= totalPages - 1}
					onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
				>
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}

export function DatabaseExplorer({
	portfolio,
	leads,
}: {
	portfolio: Portfolio[];
	leads: Lead[];
}) {
	const { t } = useTranslation();

	return (
		<Card className="glass p-5 md:p-6 shadow-elegant">
			<h2 className="text-lg font-semibold tracking-tight text-foreground">
				{t("admin.db.title")}
			</h2>
			<Accordion type="multiple" className="mt-4" defaultValue={["portfolio"]}>
				<AccordionItem value="portfolio">
					<AccordionTrigger>
						{t("admin.db.portfolio")} ({portfolio.length})
					</AccordionTrigger>
					<AccordionContent>
						<Paginated
							rows={portfolio}
							columns={[
								"name",
								"user_id",
								"mrr",
								"asking_price",
								"status",
								"created_at",
							]}
							csvFilename="portfolio.csv"
							emptyText={t("admin.db.empty")}
							renderRow={(p) => (
								<TableRow key={p.id}>
									<TableCell className="font-medium">{p.name}</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{(p.user_id ?? "").slice(0, 8)}…
									</TableCell>
									<TableCell>€{p.mrr}</TableCell>
									<TableCell>€{p.asking_price}</TableCell>
									<TableCell>{p.status}</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(p.created_at).toLocaleDateString()}
									</TableCell>
								</TableRow>
							)}
						/>
					</AccordionContent>
				</AccordionItem>
				<AccordionItem value="leads">
					<AccordionTrigger>
						{t("admin.db.leads")} ({leads.length})
					</AccordionTrigger>
					<AccordionContent>
						<Paginated
							rows={leads}
							columns={[
								"agency_name",
								"contact_email",
								"status",
								"user_id",
								"created_at",
							]}
							csvFilename="crm_leads.csv"
							emptyText={t("admin.db.empty")}
							renderRow={(l) => (
								<TableRow key={l.id}>
									<TableCell className="font-medium">{l.agency_name}</TableCell>
									<TableCell className="text-sm">
										{l.contact_email ?? "—"}
									</TableCell>
									<TableCell>{l.status}</TableCell>
									<TableCell className="font-mono text-xs text-muted-foreground">
										{(l.user_id ?? "").slice(0, 8)}…
									</TableCell>
									<TableCell className="text-xs text-muted-foreground">
										{new Date(l.created_at).toLocaleDateString()}
									</TableCell>
								</TableRow>
							)}
						/>
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</Card>
	);
}
