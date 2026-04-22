import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { toast } from "sonner";
import { Sparkles, TrendingUp, Calculator, Building2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Niche = "b2b" | "ecommerce" | "booking" | "devtool";

const NICHES: { id: Niche; label: string; multiplier: number }[] = [
  { id: "b2b", label: "B2B SaaS", multiplier: 36 },
  { id: "ecommerce", label: "E-commerce", multiplier: 30 },
  { id: "booking", label: "Booking / Scheduling", multiplier: 40 },
  { id: "devtool", label: "Micro-Tool", multiplier: 24 },
];

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

const initialState = {
  name: "",
  mrr: "" as string,
  expenses: "" as string,
  niche: "b2b" as Niche,
};

export default function Valuation() {
  const [form, setForm] = useState(initialState);

  const mrrNum = Number(form.mrr) || 0;
  const expNum = Number(form.expenses) || 0;
  const netProfit = mrrNum - expNum;

  const niche = useMemo(
    () => NICHES.find((n) => n.id === form.niche) ?? NICHES[0],
    [form.niche],
  );

  const isAssetOnly = netProfit <= 0;
  const askingPrice = isAssetOnly ? 1000 : netProfit * niche.multiplier;

  const reportActive = mrrNum > 0 || expNum > 0 || form.name.length > 0;

  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await supabase.from("portfolio").insert({
      name: form.name || "Untitled Project",
      mrr: mrrNum,
      expenses: expNum,
      asking_price: askingPrice,
      status: "Building",
    });
    setSaving(false);

    if (error) {
      toast.error("Failed to save", { description: error.message });
      return;
    }

    toast.success("App added to your pipeline!", {
      description: form.name
        ? `${form.name} valued at ${formatUSD(askingPrice)}`
        : `Valued at ${formatUSD(askingPrice)}`,
    });
    setForm(initialState);
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Valuation <span className="text-gradient">Engine</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Estimate the asking price of any PWA based on financials and niche.
          </p>
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
                    Project inputs
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Numbers update the report in real time.
                  </p>
                </div>
              </div>

              <div className="relative mt-7 space-y-5">
                <Field label="App Name" htmlFor="name">
                  <Input
                    id="name"
                    placeholder="e.g. InvoiceFlow PWA"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-11 bg-card/40"
                  />
                </Field>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <Field label="Monthly MRR" htmlFor="mrr" suffix="USD">
                    <CurrencyInput
                      id="mrr"
                      value={form.mrr}
                      onChange={(v) => setForm({ ...form, mrr: v })}
                      placeholder="0"
                    />
                  </Field>

                  <Field label="Monthly Expenses" htmlFor="exp" suffix="USD">
                    <CurrencyInput
                      id="exp"
                      value={form.expenses}
                      onChange={(v) => setForm({ ...form, expenses: v })}
                      placeholder="0"
                    />
                  </Field>
                </div>

                <Field label="Niche / Category" htmlFor="niche">
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
                            <span>{n.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {n.multiplier}× profit
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </Card>
          </motion.div>

          {/* RIGHT — Live Report */}
          <AnimatePresence mode="wait">
            <motion.div
              key="report"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <Card className="glow-border relative overflow-hidden bg-gradient-card p-6 shadow-elegant md:p-8">
                <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
                <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />

                <div className="relative flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                      <Sparkles className="h-3 w-3 text-primary" />
                      Live Valuation Report
                    </div>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      {form.name || "Untitled Project"}
                    </h2>
                  </div>
                  <Badge
                    variant="outline"
                    className="border-0 bg-secondary/60 text-[10px] uppercase tracking-wider text-muted-foreground ring-1 ring-border/60"
                  >
                    {niche.label}
                  </Badge>
                </div>

                {/* Breakdown rows */}
                <div className="relative mt-6 space-y-3 rounded-xl border border-border/50 bg-card/40 p-4">
                  <ReportRow
                    label="Monthly MRR"
                    value={formatUSD(mrrNum)}
                    icon={<TrendingUp className="h-3.5 w-3.5 text-success" />}
                  />
                  <ReportRow
                    label="Monthly Expenses"
                    value={`− ${formatUSD(expNum)}`}
                  />
                  <div className="my-2 h-px bg-border/60" />
                  <ReportRow
                    label="Net Profit (Monthly)"
                    value={formatUSD(netProfit)}
                    valueClass={cn(
                      "font-semibold",
                      netProfit > 0 ? "text-success" : "text-destructive",
                    )}
                  />
                  <ReportRow
                    label="Industry Multiplier"
                    value={`${niche.multiplier}×`}
                    icon={<Building2 className="h-3.5 w-3.5 text-accent" />}
                  />
                </div>

                {/* Asking price hero */}
                <div className="relative mt-6 text-center">
                  <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                    Estimated Asking Price
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="mt-2"
                  >
                    <CountUpPrice value={askingPrice} />
                  </motion.div>

                  <AnimatePresence>
                    {isAssetOnly && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="mt-3 flex justify-center"
                      >
                        <Badge className="border-0 bg-warning/15 text-warning ring-1 ring-warning/30">
                          Asset Value Only
                        </Badge>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* CTA */}
                <div className="relative mt-7">
                  <Button
                    onClick={handleAdd}
                    disabled={!reportActive || saving}
                    className="group relative h-12 w-full overflow-hidden bg-gradient-primary text-primary-foreground font-semibold shadow-glow transition-all hover:shadow-[0_0_50px_-10px_hsl(var(--primary)/0.7)] hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                  >
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <Sparkles className="mr-1 h-4 w-4" />
                    {saving ? "Saving…" : "Save to Portfolio"}
                  </Button>
                  <p className="mt-2 text-center text-[11px] text-muted-foreground">
                    Estimate is indicative. Actual sale price depends on buyer demand and due diligence.
                  </p>
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
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
      ease: [0.22, 1, 0.36, 1], // easeOutQuint — smooth count-up
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
