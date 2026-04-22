import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  icon: LucideIcon;
  index?: number;
}

export function MetricCard({ label, value, delta, trend, icon: Icon, index = 0 }: MetricCardProps) {
  const positive = trend === "up";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.07, ease: "easeOut" }}
    >
      <Card className="glow-border group relative overflow-hidden bg-gradient-card p-5 shadow-elegant transition-all duration-300 hover:-translate-y-0.5 hover:shadow-glow">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-primary/15 blur-3xl transition-opacity duration-500 group-hover:opacity-80" />

        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {label}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-primary ring-1 ring-border/60">
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <div className="relative mt-4 flex items-end justify-between">
          <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
          <div
            className={cn(
              "flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ring-1",
              positive
                ? "bg-success/10 text-success ring-success/20"
                : "bg-destructive/10 text-destructive ring-destructive/20",
            )}
          >
            {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
