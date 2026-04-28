import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { ColumnId } from "@/components/kanban/data";
import { Button } from "@/components/ui/button";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const STATUSES: ColumnId[] = ["Building", "Listed", "Negotiating", "Sold"];

export interface ProjectFormValue {
	id?: string;
	name: string;
	mrr: number;
	expenses: number;
	asking_price: number;
	status: ColumnId;
}

export function ProjectFormDialog({
	open,
	onOpenChange,
	initial,
	defaultStatus,
	onSaved,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	initial?: ProjectFormValue;
	defaultStatus?: ColumnId;
	onSaved: (row: ProjectFormValue & { id: string }) => void;
}) {
	const { t } = useTranslation();
	const isEdit = !!initial?.id;
	const [name, setName] = useState("");
	const [mrr, setMrr] = useState("");
	const [expenses, setExpenses] = useState("");
	const [askingPrice, setAskingPrice] = useState("");
	const [status, setStatus] = useState<ColumnId>("Building");
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		if (open) {
			setName(initial?.name ?? "");
			setMrr(initial?.mrr ? String(initial.mrr) : "");
			setExpenses(initial?.expenses ? String(initial.expenses) : "");
			setAskingPrice(initial?.asking_price ? String(initial.asking_price) : "");
			setStatus(initial?.status ?? defaultStatus ?? "Building");
		}
	}, [open, initial, defaultStatus]);

	const submit = async () => {
		if (!name.trim()) {
			toast.error(t("portfolio.form.nameRequired"));
			return;
		}
		setBusy(true);
		const payload = {
			name: name.trim(),
			mrr: Math.max(0, Number(mrr) || 0),
			expenses: Math.max(0, Number(expenses) || 0),
			asking_price: Math.max(0, Number(askingPrice) || 0),
			status,
		};

		if (isEdit && initial?.id) {
			const { error } = await supabase
				.from("portfolio")
				.update(payload)
				.eq("id", initial.id);
			setBusy(false);
			if (error) {
				toast.error(t("portfolio.form.saveFailed"), {
					description: error.message,
				});
				return;
			}
			toast.success(t("portfolio.form.updated"));
			onSaved({ ...payload, id: initial.id });
		} else {
			const {
				data: { user },
			} = await supabase.auth.getUser();
			if (!user) {
				setBusy(false);
				toast.error(t("portfolio.form.mustSignIn"));
				return;
			}
			const { data, error } = await supabase
				.from("portfolio")
				.insert({ ...payload, user_id: user.id })
				.select("id")
				.single();
			setBusy(false);
			if (error || !data) {
				toast.error(t("portfolio.form.saveFailed"), {
					description: error?.message,
				});
				return;
			}
			toast.success(t("portfolio.form.created"));
			onSaved({ ...payload, id: data.id });
		}
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit
							? t("portfolio.form.editTitle")
							: t("portfolio.form.addTitle")}
					</DialogTitle>
					<DialogDescription>{t("portfolio.form.subtitle")}</DialogDescription>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="pf-name">{t("portfolio.form.name")}</Label>
						<Input
							id="pf-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							maxLength={120}
						/>
					</div>
					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-2">
							<Label htmlFor="pf-mrr">{t("portfolio.form.mrr")}</Label>
							<Input
								id="pf-mrr"
								inputMode="numeric"
								value={mrr}
								onChange={(e) => setMrr(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="pf-exp">{t("portfolio.form.expenses")}</Label>
							<Input
								id="pf-exp"
								inputMode="numeric"
								value={expenses}
								onChange={(e) => setExpenses(e.target.value)}
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="pf-ap">{t("portfolio.form.askingPrice")}</Label>
						<Input
							id="pf-ap"
							inputMode="numeric"
							value={askingPrice}
							onChange={(e) => setAskingPrice(e.target.value)}
						/>
					</div>
					<div className="space-y-2">
						<Label>{t("portfolio.form.status")}</Label>
						<Select
							value={status}
							onValueChange={(v) => setStatus(v as ColumnId)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{STATUSES.map((s) => (
									<SelectItem key={s} value={s}>
										{t(`portfolio.columns.${s}` as const)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						{t("common.cancel")}
					</Button>
					<Button onClick={submit} disabled={busy}>
						{busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						{isEdit ? t("common.saveChanges") : t("common.add")}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
