import { CSS } from "@dnd-kit/utilities";
import { useSortable } from "@dnd-kit/sortable";
import { motion } from "framer-motion";
import { MoreHorizontal, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatUSD, type PwaProject } from "./data";

interface ProjectCardProps {
  project: PwaProject;
  isOverlay?: boolean;
  index?: number;
}

export function ProjectCard({ project, isOverlay = false, index = 0 }: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: "card", project },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const content = (
    <Card
      className={cn(
        "group relative overflow-hidden bg-gradient-card p-4 shadow-elegant transition-shadow",
        "border-border/60 hover:border-primary/40",
        isOverlay && "rotate-2 scale-[1.03] shadow-glow ring-1 ring-primary/40 cursor-grabbing",
        isDragging && !isOverlay && "opacity-40",
      )}
    >
      {/* drag handle area covers the whole card except the menu */}
      <div className="flex items-start justify-between gap-2">
        <button
          {...attributes}
          {...listeners}
          className="flex-1 cursor-grab text-left active:cursor-grabbing focus:outline-none"
          aria-label={`Drag ${project.name}`}
        >
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{project.name}</h3>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onPointerDown={(e) => e.stopPropagation()}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              aria-label="Card actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive focus:text-destructive">
              Delete
            </DropdownMenuItem>
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
            <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Asking</div>
            <div className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">
              {project.askingPrice > 0 ? formatUSD(project.askingPrice) : "—"}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-success" />
            {project.mrr > 0 ? `${formatUSD(project.mrr)}/mo` : "Pre-revenue"}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-border/60 bg-secondary/50 px-1.5 py-0 text-[10px] font-medium text-muted-foreground"
            >
              {tag}
            </Badge>
          ))}
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
      transition={{ duration: 0.3, delay: index * 0.04, ease: "easeOut" }}
    >
      {content}
    </motion.div>
  );
}
