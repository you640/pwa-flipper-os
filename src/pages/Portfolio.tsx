import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { AppLayout } from "@/components/layout/AppLayout";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { ProjectCard } from "@/components/kanban/ProjectCard";
import {
  COLUMNS,
  INITIAL_PROJECTS,
  type ColumnId,
  type PwaProject,
} from "@/components/kanban/data";

export default function Portfolio() {
  const [projects, setProjects] = useState<PwaProject[]>(INITIAL_PROJECTS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const projectsByColumn = useMemo(() => {
    const map: Record<ColumnId, PwaProject[]> = {
      building: [],
      listed: [],
      negotiation: [],
      sold: [],
    };
    for (const p of projects) map[p.column].push(p);
    return map;
  }, [projects]);

  const activeProject = activeId ? projects.find((p) => p.id === activeId) ?? null : null;

  const findColumnOfId = (id: string): ColumnId | null => {
    if ((COLUMNS.map((c) => c.id) as string[]).includes(id)) return id as ColumnId;
    return projects.find((p) => p.id === id)?.column ?? null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

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
    if (activeIdStr === overIdStr) return;

    const overIsColumn = (COLUMNS.map((c) => c.id) as string[]).includes(overIdStr);
    if (overIsColumn) return; // already handled by dragOver

    setProjects((prev) => {
      const oldIndex = prev.findIndex((p) => p.id === activeIdStr);
      const newIndex = prev.findIndex((p) => p.id === overIdStr);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  return (
    <AppLayout>
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Portfolio <span className="text-gradient">Kanban</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag projects across stages to track your sales pipeline.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
            {projects.length} projects · {projects.filter((p) => p.column === "sold").length} sold
          </div>
        </motion.header>

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
              />
            ))}
          </div>

          <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {activeProject ? <ProjectCard project={activeProject} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </AppLayout>
  );
}
