import { useEffect, useMemo, useRef, useState } from "react";
import { SEO } from "@/components/seo/SEO";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Calculator, Building2, Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAiValuation } from "@/hooks/useAiValuation";
import { AiReportCard } from "@/components/valuation/AiReportCard";
import { AnalyzingState } from "@/components/valuation/AnalyzingState";

type Niche = "b2b" | "ecommerce" | "booking" | "devtool";

const NICHES: { id: Niche; multiplier: number }[] = [
  { id: "b2b", multiplier: 36 },
  { id: "ecommerce", multiplier: 30 },
  { id: "booking", multiplier: 40 },
  { id: "devtool", multiplier: 24 },
];

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const initialState = {
  name: "",
  url: "",
  mrr: "",
  expenses: "",
  niche: "b2b" as Niche,
  techStack: "",
  notes: "",
};

export default function Valuation() {
  const { t } = useTranslation();
  const [form, setForm] = useState(initialState);
  const [applying, setApplying] = useState(false);

  const { run, loading: aiLoading, report, inputs: aiInputs, reset } = useAiValuation();

  const mrrNum = Number(form.mrr) || 0;
  const expNum = Number(form.expenses) || 0;
  const netProfit = mrrNum - expNum;

  const niche = useMemo(
    () => NICHES.find((n) => n.id === form.niche) ?? NICHES[0],
    [form.niche],
  );
  const nicheLabel = t(`valuation.niches.${niche.id}`);

  const isAssetOnly = netProfit <= 0;
  const fallbackPrice = isAssetOnly ? 1000 : netProfit * niche.multiplier;
  const reportActive = mrrNum > 0 || expNum > 0 || form.name.length > 0;

  const handleAiAudit = async () => {
    if (!form.name.trim()) {
      toast.error(t("valuation.ai.errors.generic"), {
        description: t("valuation.appName"),
      });
      return;
    }
    await run({
      name: form.name.trim(),
      url: form.url.trim() || undefined,
      mrr: mrrNum,
      expenses: expNum,
      niche: nicheLabel,
      tech_stack: form.techStack.trim() || undefined,
      notes: form.notes.trim() || undefined,
    });
  };

  const persistAudit = async (alsoApply: boolean) => {
    if (!report || !aiInputs) return;
    setApplying(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setApplying(false);
      toast.error(t("valuation.mustBeSignedIn"));
      return;
    }

    let portfolioId: string | null = null;
    if (alsoApply) {
      const { data: pf, error: pfErr } = await supabase
        .from("portfolio")
        .insert({
          name: form.name || t("valuation.untitled"),
          mrr: mrrNum,
          expenses: expNum,
          asking_price: report.estimated_valuation.mid,
          status: "For Sale",
          user_id: user.id,
        })
        .select("id")
        .single();
      if (pfErr) {
        setApplying(false);
        toast.error(t("valuation.saveFailed"), { description: pfErr.message });
        return;
      }
      portfolioId = pf.id;
    }

    const { error: aErr } = await supabase.from("portfolio_audits").insert({
      portfolio_id: portfolioId,
      inputs: aiInputs as any,
      ai_report: report as any,
      user_id: user.id,
    });
    setApplying(false);

    if (aErr) {
      toast.error(t("valuation.saveFailed"), { description: aErr.message });
      return;
    }

    toast.success(
      alsoApply ? t("valuation.ai.appliedToPortfolio") : t("valuation.ai.auditSaved"),
      {
        description: alsoApply
          ? t("valuation.addedDescNamed", {
              name: form.name || t("valuation.untitled"),
              price: formatUSD(report.estimated_valuation.mid),
            })
          : undefined,
      },
    );

    if (alsoApply) {
      setForm(initialState);
      reset();
    }
  };

  return (
    <AppLayout>
      <SEO
        title="AI Valuation Engine | RUBBERDUCK.SPACE"
        description="AI-powered PWA valuation. Gemini analyzes MRR, niche and tech stack to produce a low/mid/high price, risk score and value-up tips."
      />
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            {t("valuation.title")} <span className="text-gradient">{t("valuation.titleAccent")}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("valuation.subtitle")}</p>
        </motion.header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* LEFT — Form */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
          >
            <Card className="glass relative overflow-hidden p-6 shadow-elegant md:p-8">
              <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />

              <div className="relative flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/60 text-primary ring-1 ring-border/60">
                  <Calculator className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-foreground">
                    {t("valuation.inputs")}
                  </h2>
                  <p className="text-xs text-muted-foreground">{t("valuation.inputsHint")}</p>
                </div>
              </div>

              <div className="relative mt-7 space-y-5">
                <Field label={t("valuation.appName")} htmlFor="name">
                  <Input
                    id="name"
                    placeholder={t("valuation.appNamePh")}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 bg-card/40"
                    maxLength={120}
                  />
                </Field>

                <Field label={t("valuation.appUrl")} htmlFor="url">
                  <Input
                    id="url"
                    placeholder={t("valuation.appUrlPh")}
                    value={form.url}
                    onChange={(e) => setForm({ ...form, url: e.target.value })}
                    className="h-11 bg-card/40"
                    maxLength={500}
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label={t("valuation.monthlyMRR")} htmlFor="mrr" suffix="USD">
                    <CurrencyInput
                      id="mrr"
                      value={form.mrr}
                      onChange={(v) => setForm({ ...form, mrr: v })}
                      placeholder="0"
                    />
                  </Field>

                  <Field label={t("valuation.monthlyExpenses")} htmlFor="exp" suffix="USD">
                    <CurrencyInput
                      id="exp"
                      value={form.expenses}
                      onChange={(v) => setForm({ ...form, expenses: v })}
                      placeholder="0"
                    />
                  </Field>
                </div>

                <Field label={t("valuation.niche")} htmlFor="niche">
                  <Select
                    value={form.niche}
                    onValueChange={(v) => setForm({ ...form, niche: v as Niche })}
                  >
                    <SelectTrigger id="niche" className="h-11 bg-card/40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {NICHES.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          <div className="flex items-center justify-between gap-6">
                            <span>{t(`valuation.niches.${n.id}`)}</span>
                            <span className="text-xs text-muted-foreground">
                              {n.multiplier}{t("valuation.multiplierLabel")}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t("valuation.techStack")} htmlFor="stack">
                  <Input
                    id="stack"
                    placeholder={t("valuation.techStackPh")}
                    value={form.techStack}
                    onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                    className="h-11 bg-card/40"
                    maxLength={300}
                  />
                </Field>

                <Field label={t("valuation.notesLabel")} htmlFor="notes">
                  <Textarea
                    id="notes"
                    placeholder={t("valuation.notesPh")}
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="min-h-[88px] resize-none bg-card/40"
                    maxLength={800}
                  />
                </Field>

                <Button
                  onClick={handleAiAudit}
                  disabled={!reportActive || aiLoading}
                  className="group relative h-12 w-full overflow-hidden bg-gradient-primary text-primary-foreground font-semibold shadow-glow transition-all hover:shadow-[0_0_50px_-10px_hsl(var(--primary)/0.7)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                  <Brain className="mr-1 h-4 w-4" />
                  {aiLoading ? t("valuation.ai.auditButtonRunning") : t("valuation.ai.auditButton")}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* RIGHT — Report */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <Card className="glow-border relative overflow-hidden bg-gradient-card p-6 shadow-elegant md:p-8">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
              <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />

              <div className="relative">
                <AnimatePresence mode="wait">
                  {aiLoading ? (
                    <motion.div
                      key="analyzing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <AnalyzingState />
                    </motion.div>
                  ) : report ? (
                    <motion.div
                      key="report"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <AiReportCard
                        report={report}
                        applying={applying}
                        onApply={() => persistAudit(true)}
                        onSave={() => persistAudit(false)}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <PreviewReport
                        name={form.name}
                        nicheLabel={nicheLabel}
                        mrrNum={mrrNum}
                        expNum={expNum}
                        netProfit={netProfit}
                        multiplier={niche.multiplier}
                        fallbackPrice={fallbackPrice}
                        isAssetOnly={isAssetOnly}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}

function PreviewReport({
  name,
  nicheLabel,
  mrrNum,
  expNum,
  netProfit,
  multiplier,
  fallbackPrice,
  isAssetOnly,
}: {
  name: string;
  nicheLabel: string;
  mrrNum: number;
  expNum: number;
  netProfit: number;
  multiplier: number;
  fallbackPrice: number;
  isAssetOnly: boolean;
}) {
  const { t } = useTranslation();
  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            {t("valuation.liveReport")}
          </div>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            {name || t("valuation.untitled")}
          </h2>
        </div>
        <Badge
          variant="outline"
          className="border-0 bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground ring-1 ring-border/60"
        >
          {nicheLabel}
        </Badge>
      </div>

      <div className="mt-6 space-y-3 rounded-xl border border-border/50 bg-card/40 p-4">
        <ReportRow
          label={t("valuation.monthlyMRR")}
          value={formatUSD(mrrNum)}
          icon={<TrendingUp className="h-3.5 w-3.5 text-success" />}
        />
        <ReportRow label={t("valuation.monthlyExpenses")} value={`− ${formatUSD(expNum)}`} />
        <div className="my-2 h-px bg-border/60" />
        <ReportRow
          label={t("valuation.netProfit")}
          value={formatUSD(netProfit)}
          valueClass={cn(
            "font-semibold",
            netProfit > 0 ? "text-success" : "text-destructive",
          )}
        />
        <ReportRow
          label={t("valuation.industryMultiplier")}
          value={`${multiplier}×`}
          icon={<Building2 className="h-3.5 w-3.5 text-accent" />}
        />
      </div>

      <div className="mt-6 text-center">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {t("valuation.estimated")}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="mt-2"
        >
          <CountUpPrice value={fallbackPrice} />
        </motion.div>
        {isAssetOnly && (
          <div className="mt-3 flex justify-center">
            <Badge className="border-0 bg-warning/15 text-warning ring-1 ring-warning/30">
              {t("valuation.assetOnly")}
            </Badge>
          </div>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          {t("valuation.estimateNote")}
        </p>
      </div>
    </>
  );
}

function Field({
  label,
  htmlFor,
  suffix,
  children,
}: {
  label: string;
  htmlFor: string;
  suffix?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={htmlFor} className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </Label>
        {suffix && (
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            {suffix}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function CurrencyInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
        $
      </span>
      <Input
        id={id}
        inputMode="numeric"
        type="number"
        min={0}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value.replace(/[^\d.]/g, ""))}
        className="h-11 bg-card/40 pl-7 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
}

function ReportRow({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={cn("font-mono tabular-nums text-foreground", valueClass)}>{value}</span>
    </div>
  );
}

function CountUpPrice({ value }: { value: number }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => formatUSD(Math.round(v)));
  const prevRef = useRef(0);

  useEffect(() => {
    const controls = animate(motionVal, value, {
      duration: 0.9,
      ease: [0.22, 1, 0.36, 1],
      onComplete: () => {
        prevRef.current = value;
      },
    });
    return () => controls.stop();
  }, [value, motionVal]);

  return (
    <motion.div className="text-gradient text-5xl font-bold tracking-tight md:text-6xl drop-shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
      {rounded}
    </motion.div>
  );
}
