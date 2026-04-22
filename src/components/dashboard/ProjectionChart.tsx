import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  currentMRR: number;
}

const formatUSD = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 shadow-elegant backdrop-blur-md">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">
        ${payload[0].value.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">MRR</span>
      </div>
    </div>
  );
}

const monthLabels = (() => {
  const now = new Date();
  const out: string[] = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    out.push(d.toLocaleString("en-US", { month: "short" }));
  }
  return out;
})();

export function ProjectionChart({ currentMRR }: Props) {
  // Realistic 6-month projection: ~18% compound monthly growth, slight noise
  const base = Math.max(currentMRR, 500);
  const data = monthLabels.map((month, i) => ({
    month,
    value: Math.round(base * Math.pow(1.18, i) * (1 + (i % 2 === 0 ? 0 : 0.04))),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.25, ease: "easeOut" }}
    >
      <Card className="glass overflow-hidden p-5 shadow-elegant md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Portfolio Projection
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Forecasted MRR growth across active PWAs · next 6 months
            </p>
          </div>
          <div className="rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-medium text-success">
            +18% MoM target
          </div>
        </div>

        <div className="mt-6 h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="mrrFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary-glow))" stopOpacity={0.65} />
                  <stop offset="55%" stopColor="hsl(var(--primary))" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="mrrStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary-glow))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatUSD}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: "hsl(var(--primary))", strokeOpacity: 0.3 }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="url(#mrrStroke)"
                strokeWidth={2.5}
                fill="url(#mrrFill)"
                activeDot={{ r: 5, fill: "hsl(var(--primary-glow))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
