import { motion } from "framer-motion";
import {
  ChevronDown,
  Sparkles,
  TrendingUp,
  Zap,
  ShieldAlert,
  Wrench,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { AiValuationReport } from "@/hooks/useAiValuation";
import { CodeHealthGauge } from "./CodeHealthGauge";

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const IMPACT_ICON = { high: Zap, medium: TrendingUp, low: Sparkles } as const;
const IMPACT_CLR = {
  high: "text-success bg-success/15 ring-success/30",
  medium: "text-primary bg-primary/15 ring-primary/30",
  low: "text-muted-foreground bg-muted/30 ring-border/60",
} as const;

function riskColor(score: number) {
  if (score <= 3) return "text-success";
  if (score <= 6) return "text-warning";
  return "text-destructive";
}

export function AiReportCard({
  report,
  onApply,
  onSave,
  applying,
}: {
  report: AiValuationReport;
  onApply: () => void;
  onSave: () => void;
  applying?: boolean;
}) {
  const { t } = useTranslation();
  const { low, mid, high } = report.estimated_valuation;
  const range = Math.max(high - low, 1);
  const midPct = ((mid - low) / range) * 100;
  const audit = report.tech_stack_audit;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-primary">
        <Sparkles className="h-3.5 w-3.5" />
        {t("valuation.ai.report.title")}
      </div>

      <div className="text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("valuation.ai.report.range")}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-gradient mt-2 text-5xl font-bold tracking-tight md:text-6xl drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]"
        >
          {formatUSD(mid)}
        </motion.div>
        <div className="mx-auto mt-4 max-w-xs">
          <div className="relative h-2 rounded-full bg-muted/40">
            <div className="absolute inset-y-0 left-0 right-0 rounded-full bg-gradient-to-r from-primary/40 via-primary to-primary-glow" />
            <motion.div
              initial={{ left: "0%" }}
              animate={{ left: `${midPct}%` }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute -top-1 h-4 w-4 -translate-x-1/2 rounded-full bg-foreground shadow-glow ring-2 ring-background"
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] font-mono tabular-nums text-muted-foreground">
            <span>{formatUSD(low)}</span>
            <span>{formatUSD(high)}</span>
          </div>
        </div>
      </div>

      {/* Code Health Gauge */}
      <CodeHealthGauge
        score={report.code_quality_score}
        label={report.code_quality_label}
      />

      {/* Detected stack */}
      {audit?.detected_stack && audit.detected_stack.length > 0 && (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("valuation.ai.report.detectedStack")}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {audit.detected_stack.map((tech) => (
              <Badge
                key={tech}
                variant="outline"
                className="border-0 bg-secondary/60 text-[11px] text-foreground/90 ring-1 ring-border/60"
              >
                {tech}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tech excellence vs debt */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-success/30 bg-success/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("valuation.ai.report.techExcellence")}
          </div>
          <ul className="space-y-1.5">
            {audit.excellence.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-foreground/90"
              >
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("valuation.ai.report.techDebt")}
          </div>
          <ul className="space-y-1.5">
            {audit.tech_debt.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-1.5 text-xs text-foreground/90"
              >
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-destructive" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {audit?.summary && (
        <div className="rounded-xl border border-border/50 bg-card/30 p-3 text-xs leading-relaxed text-muted-foreground">
          {audit.summary}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border/50 bg-card/40 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {t("valuation.ai.report.multiple")}
          </div>
          <div className="mt-1 font-mono text-base font-semibold tabular-nums text-foreground">
            {report.multiple > 0 ? `${report.multiple.toFixed(1)}×` : "—"}
          </div>
        </div>
        <div className="rounded-xl border border-border/50 bg-card/40 p-3">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="h-3 w-3" />
            {t("valuation.ai.report.risk")}
          </div>
          <div
            className={cn(
              "mt-1 font-mono text-base font-semibold tabular-nums",
              riskColor(report.risk_score),
            )}
          >
            {report.risk_score}/10
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/30 p-4 text-sm leading-relaxed text-foreground/90">
        {report.summary}
      </div>

      {/* Refactor tips */}
      <div>
        <div className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Wrench className="h-3.5 w-3.5 text-primary" />
          {t("valuation.ai.report.refactorTips")}
        </div>
        <div className="space-y-2">
          {report.refactor_tips?.map((tip, i) => {
            const Icon = IMPACT_ICON[tip.impact] ?? Sparkles;
            return (
              <Collapsible key={`r-${i}`}>
                <Tip tip={tip} index={i} Icon={Icon} />
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* Value-up tips */}
      <div>
        <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("valuation.ai.report.valueUpTips")}
        </div>
        <div className="space-y-2">
          {report.value_up_tips.map((tip, i) => {
            const Icon = IMPACT_ICON[tip.impact] ?? Sparkles;
            return (
              <Collapsible key={`v-${i}`}>
                <Tip tip={tip} index={i} Icon={Icon} />
              </Collapsible>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border/50 pt-4 sm:flex-row">
        <Button
          onClick={onApply}
          disabled={applying}
          className="group relative h-11 flex-1 overflow-hidden bg-gradient-primary font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Sparkles className="mr-1 h-4 w-4" />
          {applying ? t("valuation.saving") : t("valuation.ai.applyToPortfolio")}
        </Button>
        <Button
          onClick={onSave}
          variant="outline"
          disabled={applying}
          className="h-11 flex-1"
        >
          {t("valuation.ai.saveAuditOnly")}
        </Button>
      </div>
    </motion.div>
  );
}

function Tip({
  tip,
  index,
  Icon,
}: {
  tip: { title: string; impact: "high" | "medium" | "low"; detail: string };
  index: number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  const [open, setOpen] = useState(index === 0);
  const { t } = useTranslation();
  return (
    <>
      <CollapsibleTrigger
        onClick={() => setOpen((o) => !o)}
        className="group flex w-full items-center gap-3 rounded-lg border border-border/50 bg-card/40 p-3 text-left transition-colors hover:bg-card/60"
      >
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg ring-1",
            IMPACT_CLR[tip.impact],
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-foreground">{tip.title}</div>
          <Badge
            variant="outline"
            className="mt-0.5 border-0 bg-transparent p-0 text-[10px] uppercase tracking-wider text-muted-foreground"
          >
            {t(`valuation.ai.report.impact.${tip.impact}`)}
          </Badge>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
        <div className="rounded-b-lg border border-t-0 border-border/50 bg-card/20 p-3 text-sm text-muted-foreground">
          {tip.detail}
        </div>
      </CollapsibleContent>
    </>
  );
}
