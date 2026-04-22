import { useEffect, useState } from "react";
import { SEO } from "@/components/seo/SEO";
import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProjectionChart } from "@/components/dashboard/ProjectionChart";
import { IndustryNews } from "@/components/dashboard/IndustryNews";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Layers, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PortfolioRow {
  asking_price: number;
  mrr: number;
  status: "Building" | "Listed" | "Negotiating" | "Sold";
}

const Index = () => {
  const [rows, setRows] = useState<PortfolioRow[] | null>(null);

  useEffect(() => {
    supabase
      .from("portfolio")
      .select("asking_price, mrr, status")
      .then(({ data }) => setRows((data as PortfolioRow[]) ?? []));
  }, []);

  const loading = rows === null;
  const active = rows?.filter((r) => r.status !== "Sold") ?? [];
  const sold = rows?.filter((r) => r.status === "Sold") ?? [];

  const portfolioValue = active.reduce((s, r) => s + (r.asking_price ?? 0), 0);
  const combinedMRR = active.reduce((s, r) => s + (r.mrr ?? 0), 0);
  const pipelineCount = active.length;
  const totalExits = sold.reduce((s, r) => s + (r.asking_price ?? 0), 0);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <AppLayout>
      <SEO
        title="Command Center | Flipper OS"
        description="Track portfolio value, MRR, and live deal flow across your PWA empire from one premium command center."
      />
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Welcome back, <span className="text-gradient">Alex</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here's the pulse of your PWA portfolio today — {today}.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            All systems nominal
          </div>
        </motion.header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Total Portfolio Value"
            value={portfolioValue}
            prefix="$"
            icon={DollarSign}
            accent="primary"
            index={0}
            loading={loading}
          />
          <MetricCard
            label="Combined MRR"
            value={combinedMRR}
            prefix="$"
            icon={TrendingUp}
            accent="cyan"
            index={1}
            loading={loading}
          />
          <MetricCard
            label="Apps in Pipeline"
            value={pipelineCount}
            icon={Layers}
            accent="warning"
            index={2}
            loading={loading}
          />
          <MetricCard
            label="Total Exits"
            value={totalExits}
            prefix="$"
            icon={Trophy}
            accent="success"
            index={3}
            loading={loading}
          />
        </section>

        <ProjectionChart currentMRR={combinedMRR} />

        <IndustryNews />
      </div>
    </AppLayout>
  );
};

export default Index;
