import {
	closestCorners,
	DndContext,
	type DragEndEvent,
	type DragOverEvent,
	DragOverlay,
	type DragStartEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
	COLUMN_IDS,
	type ColumnId,
	COLUMNS,
	type PwaProject,
} from "@/components/kanban/data";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { ProjectCard } from "@/components/kanban/ProjectCard";
import { AppLayout } from "@/components/layout/AppLayout";
import {
	ProjectFormDialog,
	type ProjectFormValue,
} from "@/components/portfolio/ProjectFormDialog";
import { SEO } from "@/components/seo/SEO";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface PortfolioRow {
	id: string;
	name: string;
	mrr: number;
	expenses: number;
	asking_price: number;
	status: ColumnId | "For Sale";
}

const PORTFOLIO_CARD_SKELETON_KEYS = [
	"portfolio-card-skeleton-1",
	"portfolio-card-skeleton-2",
] as const;

function normalizeColumnId(status: PortfolioRow["status"]): ColumnId {
	return status === "For Sale" ? "Listed" : status;
}

export default function Portfolio() {
	const { t } = useTranslation();
	const [projects, setProjects] = useState<PwaProject[]>([]);
	const [loading, setLoading] = useState(true);
	const [activeId, setActiveId] = useState<string | null>(null);
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<PwaProject | null>(null);
	const [defaultStatus, setDefaultStatus] = useState<ColumnId>("Building");
	const [pendingDelete, setPendingDelete] = useState<PwaProject | null>(null);
	const [deleting, setDeleting] = useState(false);

	const handleAdd = (col: ColumnId) => {
		setEditing(null);
		setDefaultStatus(col);
		setFormOpen(true);
	};
	const handleEdit = (p: PwaProject) => {
		setEditing(p);
		setFormOpen(true);
	};
	const handleSaved = (row: ProjectFormValue & { id: string }) => {
		setProjects((prev) => {
			const idx = prev.findIndex((p) => p.id === row.id);
			const mapped: PwaProject = {
				id: row.id,
				name: row.name,
				askingPrice: row.asking_price,
				mrr: row.mrr,
				expenses: row.expenses,
				column: row.status,
			};
			if (idx === -1) return [mapped, ...prev];
			const next = [...prev];
			next[idx] = mapped;
			return next;
		});
	};
	const confirmDelete = async () => {
		if (!pendingDelete) return;
		setDeleting(true);
		const { error } = await supabase
			.from("portfolio")
			.delete()
			.eq("id", pendingDelete.id);
		setDeleting(false);
		if (error) {
			toast.error(t("portfolio.form.deleteFailed"), {
				description: error.message,
			});
			return;
		}
		setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id));
		toast.success(t("portfolio.form.deleted"));
		setPendingDelete(null);
	};

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	// Fetch projects from Supabase
	useEffect(() => {
		let cancelled = false;
		(async () => {
			const { data, error } = await supabase
				.from("portfolio")
				.select("id,name,mrr,expenses,asking_price,status")
				.order("created_at", { ascending: false });

			if (cancelled) return;
			if (error) {
				console.error("Failed to load portfolio", error);
				toast.error(t("portfolio.loadFailed"), {
					description: t("portfolio.tryAgain"),
				});
				setLoading(false);
				return;
			}
			setProjects(
				(data ?? []).map((r: PortfolioRow) => ({
					id: r.id,
					name: r.name,
					askingPrice: r.asking_price,
					mrr: r.mrr,
					expenses: r.expenses,
					column: normalizeColumnId(r.status),
				})),
			);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [t]);

	const projectsByColumn = useMemo(() => {
		const map: Record<ColumnId, PwaProject[]> = {
			Building: [],
			Listed: [],
			Negotiating: [],
			Sold: [],
		};
		for (const p of projects) map[p.column].push(p);
		return map;
	}, [projects]);

	const activeProject = activeId
		? (projects.find((p) => p.id === activeId) ?? null)
		: null;

	const findColumnOfId = (id: string): ColumnId | null => {
		if (COLUMN_IDS.includes(id as ColumnId)) return id as ColumnId;
		return projects.find((p) => p.id === id)?.column ?? null;
	};

	// Persist a status change to Supabase
	const persistStatus = async (
		projectId: string,
		newStatus: ColumnId,
		previousStatus: ColumnId,
	) => {
		const { error } = await supabase
			.from("portfolio")
			.update({ status: newStatus })
			.eq("id", projectId);

		if (error) {
			// Rollback optimistic move
			setProjects((prev) =>
				prev.map((p) =>
					p.id === projectId ? { ...p, column: previousStatus } : p,
				),
			);
			toast.error(t("portfolio.moveFailed"), { description: error.message });
			return;
		}
		toast.success(
			t("portfolio.movedTo", {
				status: t(`portfolio.columns.${newStatus}` as const),
			}),
		);
	};

	const handleDragStart = (event: DragStartEvent) => {
		setActiveId(String(event.active.id));
	};

	// Optimistic cross-column move while dragging (no DB write yet)
	const handleDragOver = (event: DragOverEvent) => {
		const { active, over } = event;
		if (!over) return;

		const activeIdStr = String(active.id);
		const overIdStr = String(over.id);
		if (activeIdStr === overIdStr) return;

		const fromCol = findColumnOfId(activeIdStr);
		const toCol = findColumnOfId(overIdStr);
		if (!fromCol || !toCol || fromCol === toCol) return;

		setProjects((prev) =>
			prev.map((p) => (p.id === activeIdStr ? { ...p, column: toCol } : p)),
		);
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;
		setActiveId(null);
		if (!over) return;

		const activeIdStr = String(active.id);
		const overIdStr = String(over.id);

		// Find the original (pre-drag) status for rollback purposes
		const draggedProject = projects.find((p) => p.id === activeIdStr);
		if (!draggedProject) return;

		const overIsColumn = COLUMN_IDS.includes(overIdStr as ColumnId);
		const targetCol = overIsColumn
			? (overIdStr as ColumnId)
			: findColumnOfId(overIdStr);
		if (!targetCol) return;

		// Reorder within same column when dropped on another card
		if (!overIsColumn && activeIdStr !== overIdStr) {
			setProjects((prev) => {
				const oldIndex = prev.findIndex((p) => p.id === activeIdStr);
				const newIndex = prev.findIndex((p) => p.id === overIdStr);
				if (oldIndex < 0 || newIndex < 0) return prev;
				return arrayMove(prev, oldIndex, newIndex);
			});
		}

		// Read what column the card is in NOW (after dragOver mutations)
		setProjects((current) => {
			const after = current.find((p) => p.id === activeIdStr);
			const newStatus = after?.column ?? targetCol;
			// We need to compare against the original snapshot — capture it from
			// the closure variable `draggedProject` which still holds pre-drag state.
			if (newStatus !== draggedProject.column) {
				// Fire DB update (don't await — UI is already optimistic)
				void persistStatus(activeIdStr, newStatus, draggedProject.column);
			}
			return current;
		});
	};

	return (
		<AppLayout>
			<SEO
				title={t("seo.portfolioTitle")}
				description={t("seo.portfolioDesc")}
			/>
			<div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
				<motion.header
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.4, ease: "easeOut" }}
					className="flex flex-wrap items-end justify-between gap-3"
				>
					<div>
						<h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
							{t("portfolio.title")}{" "}
							<span className="text-gradient">
								{t("portfolio.titleAccent")}
							</span>
						</h1>
						<p className="mt-1 text-sm text-muted-foreground">
							{t("portfolio.subtitle")}
						</p>
					</div>
					<div className="flex items-center gap-2">
						<div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground sm:flex">
							{loading
								? t("common.loading")
								: t("portfolio.counter", {
									count: projects.length,
									sold: projects.filter((p) => p.column === "Sold").length,
								})}
						</div>
						<Button
							onClick={() => handleAdd("Building")}
							className="bg-gradient-primary text-primary-foreground"
						>
							<Plus className="mr-1.5 h-4 w-4" />
							{t("portfolio.addProject")}
						</Button>
					</div>
				</motion.header>

				{loading ? (
					<div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
						{COLUMNS.map((c) => (
							<div
								key={c.id}
								className="glass space-y-3 rounded-xl p-4 shadow-elegant"
							>
								<Skeleton className="h-5 w-24" />
								{PORTFOLIO_CARD_SKELETON_KEYS.map((skeletonKey) => (
									<Skeleton
										key={`${c.id}-${skeletonKey}`}
										className="h-24 w-full"
									/>
								))}
							</div>
						))}
					</div>
				) : (
					<DndContext
						sensors={sensors}
						collisionDetection={closestCorners}
						onDragStart={handleDragStart}
						onDragOver={handleDragOver}
						onDragEnd={handleDragEnd}
						onDragCancel={() => setActiveId(null)}
					>
						<div className="flex gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
							{COLUMNS.map((col, i) => (
								<KanbanColumn
									key={col.id}
									column={col}
									projects={projectsByColumn[col.id]}
									index={i}
									onAdd={handleAdd}
									onEdit={handleEdit}
									onDelete={(p) => setPendingDelete(p)}
								/>
							))}
						</div>

						<DragOverlay
							dropAnimation={{
								duration: 220,
								easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
							}}
						>
							{activeProject ? (
								<ProjectCard project={activeProject} isOverlay />
							) : null}
						</DragOverlay>
					</DndContext>
				)}

				{!loading && projects.length === 0 && (
					<div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground">
						{t("portfolio.empty")}
					</div>
				)}
			</div>

			<ProjectFormDialog
				open={formOpen}
				onOpenChange={setFormOpen}
				initial={
					editing
						? {
							id: editing.id,
							name: editing.name,
							mrr: editing.mrr,
							expenses: editing.expenses,
							asking_price: editing.askingPrice,
							status: editing.column,
						}
						: undefined
				}
				defaultStatus={defaultStatus}
				onSaved={handleSaved}
			/>

			<AlertDialog
				open={!!pendingDelete}
				onOpenChange={(o) => !o && setPendingDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							{t("portfolio.form.deleteTitle")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("portfolio.form.deleteDesc", {
								name: pendingDelete?.name ?? "",
							})}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
						<AlertDialogAction onClick={confirmDelete} disabled={deleting}>
							{t("common.delete")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</AppLayout>
	);
}
