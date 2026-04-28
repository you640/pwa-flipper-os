import { useDroppable } from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { KanbanColumn as KColumn, PwaProject } from "./data";
import { ProjectCard } from "./ProjectCard";

interface ColumnProps {
	column: KColumn;
	projects: PwaProject[];
	index: number;
}

export function KanbanColumn({
	column,
	projects,
	index,
	onAdd,
	onEdit,
	onDelete,
}: ColumnProps & {
	onAdd?: (col: KColumn["id"]) => void;
	onEdit?: (project: PwaProject) => void;
	onDelete?: (project: PwaProject) => void;
}) {
	const { t } = useTranslation();
	const { setNodeRef, isOver } = useDroppable({
		id: column.id,
		data: { type: "column", columnId: column.id },
	});

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.45, delay: index * 0.08, ease: "easeOut" }}
			className="flex h-full min-w-[280px] flex-1 flex-col"
		>
			<div className="glass relative flex h-full flex-col overflow-hidden rounded-xl shadow-elegant">
				{/* Top accent bar */}
				<div className={cn("h-[3px] w-full bg-gradient-to-r", column.accent)} />

				{/* Header */}
				<div className="flex items-center justify-between px-4 pb-3 pt-4">
					<div className="flex items-center gap-2">
						<span
							className={cn("h-2 w-2 rounded-full shadow-glow", column.dot)}
						/>
						<h2 className="text-sm font-semibold tracking-tight text-foreground">
							{t(`portfolio.columns.${column.id}` as const)}
						</h2>
						<span className="rounded-full bg-secondary/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/60">
							{projects.length}
						</span>
					</div>
					<button
						type="button"
						onClick={() => onAdd?.(column.id)}
						className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
						aria-label={t("portfolio.addProject")}
					>
						<Plus className="h-4 w-4" />
					</button>
				</div>

				{/* Droppable list */}
				<div
					ref={setNodeRef}
					className={cn(
						"flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3 transition-colors",
						isOver && "bg-primary/5",
					)}
				>
					<SortableContext
						items={projects.map((p) => p.id)}
						strategy={verticalListSortingStrategy}
					>
						{projects.map((project, i) => (
							<ProjectCard
								key={project.id}
								project={project}
								index={i}
								onEdit={onEdit}
								onDelete={onDelete}
							/>
						))}
					</SortableContext>

					{projects.length === 0 && (
						<div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 py-10 text-xs text-muted-foreground">
							{t("portfolio.dropHere")}
						</div>
					)}
				</div>
			</div>
		</motion.div>
	);
}
