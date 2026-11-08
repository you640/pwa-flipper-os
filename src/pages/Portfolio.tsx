import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo/SEO";
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
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { ProjectCard } from "@/components/kanban/ProjectCard";
import {
  COLUMNS,
  COLUMN_IDS,
  type ColumnId,
  type PwaProject,
} from "@/components/kanban/data";
import { supabase } from "@/integrations/supabase/client";
import { ProjectDialog } from "@/components/kanban/ProjectDialog";
import type { ProjectForm } from "@/components/kanban/validateProject";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PortfolioRow {
  id: string;
  name: string;
  mrr: number;
  expenses: number;
  asking_price: number;
  status: ColumnId;
}

export default function Portfolio() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState<PwaProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PwaProject | null>(null);
  const [defaultCol, setDefaultCol] = useState<ColumnId>("Building");
  const [toDelete, setToDelete] = useState<PwaProject | null>(null);

  const openAdd = (col: ColumnId = "Building") => { setEditing(null); setDefaultCol(col); setDialogOpen(true); };
  const openEdit = (p: PwaProject) => { setEditing(p); setDialogOpen(true); };

  const saveProject = async (f: ProjectForm): Promise<boolean> => {
    const row = { name: f.name, mrr: Math.round(f.mrr), expenses: Math.round(f.expenses), asking_price: Math.round(f.askingPrice), status: f.column };
    if (editing) {
      const prev = projects;
      setProjects((ps) => ps.map((p) => p.id === editing.id ? { ...p, name: row.name, mrr: row.mrr, expenses: row.expenses, askingPrice: row.asking_price, column: f.column } : p));
      const { error } = await supabase.from("portfolio").update(row).eq("id", editing.id);
      if (error) { setProjects(prev); toast.error(t("portfolio.crud.failed")); return false; }
      toast.success(t("portfolio.crud.updated")); return true;
    }
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("portfolio").insert({ ...row, user_id: u.user?.id }).select("id").single();
    if (error || !data) { toast.error(t("portfolio.crud.failed")); return false; }
    setProjects((ps) => [{ id: data.id, name: row.name, mrr: row.mrr, expenses: row.expenses, askingPrice: row.asking_price, column: f.column }, ...ps]);
    toast.success(t("portfolio.crud.created")); return true;
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    const target = toDelete; const prev = projects;
    setToDelete(null);
    setProjects((ps) => ps.filter((p) => p.id !== target.id));
    const { error } = await supabase.from("portfolio").delete().eq("id", target.id);
    if (error) { setProjects(prev); toast.error(t("portfolio.crud.failed")); return; }
    toast.success(t("portfolio.crud.deleted"));
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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
        toast.error(t("portfolio.loadFailed"), { description: t("portfolio.tryAgain") });
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
          column: r.status,
        })),
      );
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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
    ? projects.find((p) => p.id === activeId) ?? null
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
        prev.map((p) => (p.id === projectId ? { ...p, column: previousStatus } : p)),
      );
      toast.error(t("portfolio.moveFailed"), { description: error.message });
      return;
    }
    toast.success(t("portfolio.movedTo", { status: t(`portfolio.columns.${newStatus}` as const) }));
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
      <SEO title={t("seo.portfolioTitle")} description={t("seo.portfolioDesc")} />
      <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              {t("portfolio.title")} <span className="text-gradient">{t("portfolio.titleAccent")}</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("portfolio.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => openAdd()}><Plus className="mr-1 h-4 w-4" />{t("portfolio.crud.add")}</Button>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
            {loading
              ? t("common.loading")
              : t("portfolio.counter", {
                  count: projects.length,
                  sold: projects.filter((p) => p.column === "Sold").length,
                })}
          </div>
          </div>
        </motion.header>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
            {COLUMNS.map((c) => (
              <div key={c.id} className="glass space-y-3 rounded-xl p-4 shadow-elegant">
                <Skeleton className="h-5 w-24" />
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
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
                  onAdd={openAdd}
                  onEdit={openEdit}
                  onDelete={setToDelete}
                />
              ))}
            </div>

            <DragOverlay
              dropAnimation={{
                duration: 220,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeProject ? <ProjectCard project={activeProject} isOverlay /> : null}
            </DragOverlay>
          </DndContext>
        )}

        {!loading && projects.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/30 p-10 text-center text-sm text-muted-foreground">
            {t("portfolio.empty")}
          </div>
        )}
      </div>
      <ProjectDialog open={dialogOpen} onOpenChange={setDialogOpen} project={editing} defaultColumn={defaultCol} onSubmit={saveProject} />
      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("portfolio.crud.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.name} — {t("portfolio.crud.confirmBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("portfolio.crud.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("portfolio.crud.del")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
