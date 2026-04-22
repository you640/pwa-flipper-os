import { AppLayout } from "@/components/layout/AppLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { ProjectionChart } from "@/components/dashboard/ProjectionChart";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, Users, Package } from "lucide-react";

const metrics = [
  { label: "Total Portfolio Value", value: "$248,500", delta: "12.4%", trend: "up" as const, icon: DollarSign },
  { label: "Combined MRR", value: "$8,420", delta: "5.1%", trend: "up" as const, icon: TrendingUp },
  { label: "Active Buyers", value: "17", delta: "+3", trend: "up" as const, icon: Users },
  { label: "Apps Sold", value: "6", delta: "+1 mo", trend: "up" as const, icon: Package },
];

const Index = () => {
  return (
    <AppLayout>
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
              Here's the pulse of your PWA portfolio today — Tuesday, April 22.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            All systems nominal
          </div>
        </motion.header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((m, i) => (
            <MetricCard key={m.label} {...m} index={i} />
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProjectionChart />
          </div>
          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </section>
      </div>
    </AppLayout>
  );
};

export default Index;
