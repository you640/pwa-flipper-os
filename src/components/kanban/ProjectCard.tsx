import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { MoreHorizontal, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import { type PwaProject } from "./data";

interface ProjectCardProps {
  project: PwaProject;
  isOverlay?: boolean;
  index?: number;
}

export function ProjectCard({ project, isOverlay = false, index = 0 }: ProjectCardProps) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: "card", project },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isListed = project.column === "Listed";
  const isSold = project.column === "Sold";

  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden bg-gradient-card p-4 shadow-elegant transition-shadow",
        "border-border/60 hover:border-primary/40",
        isOverlay && "rotate-2 scale-[1.04] shadow-glow ring-1 ring-primary/40 cursor-grabbing",
        isDragging && !isOverlay && "opacity-40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          {...attributes}
          {...listeners}
          className="flex-1 cursor-grab text-left active:cursor-grabbing focus:outline-none"
          aria-label={`${t("common.edit")} ${project.name}`}
        >
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            {project.name}
          </h3>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label={t("portfolio.cardActions")}
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>{t("portfolio.viewDetails")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {t("portfolio.asking")}
            </div>
            <div
              className={cn(
                "mt-0.5 text-xl font-semibold tracking-tight tabular-nums",
                isListed
                  ? "text-success drop-shadow-[0_0_12px_hsl(var(--success)/0.55)]"
                  : isSold
                    ? "text-muted-foreground line-through"
                    : "text-foreground",
              )}
            >
              {project.askingPrice > 0 ? formatCurrency(project.askingPrice) : "—"}
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-border/60 bg-secondary/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
          >
            <TrendingUp className="mr-1 h-3 w-3" />
            {project.mrr > 0 ? `${formatCurrency(project.mrr)}${t("portfolio.perMonth")}` : t("portfolio.preRevenue")}
          </Badge>
        </div>
      </div>
    </Card>
  );

  if (isOverlay) return content;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.4), ease: "easeOut" }}
    >
      {content}
    </motion.div>
  );
}
