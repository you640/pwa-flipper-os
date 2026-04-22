import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useState } from "react";
import { cn } from "@/lib/utils";

const data = [
  { month: "May", value: 142000 },
  { month: "Jun", value: 158000 },
  { month: "Jul", value: 171500 },
  { month: "Aug", value: 168000 },
  { month: "Sep", value: 184200 },
  { month: "Oct", value: 201400 },
  { month: "Nov", value: 218700 },
  { month: "Dec", value: 232100 },
  { month: "Jan", value: 248500 },
  { month: "Feb", value: 264300 },
  { month: "Mar", value: 281900 },
  { month: "Apr", value: 302600 },
];

const ranges = ["1M", "6M", "12M", "All"] as const;

const formatUSD = (n: number) =>
  n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-popover/95 px-3 py-2 shadow-elegant backdrop-blur-md">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">
        ${payload[0].value.toLocaleString()}
      </div>
    </div>
  );
}

export function ProjectionChart() {
  const [range, setRange] = useState<(typeof ranges)[number]>("12M");

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
              Portfolio Value Projection
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Combined valuation trajectory across all active PWAs
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card/50 p-1">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  r === range
                    ? "bg-secondary text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="valueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.55} />
                  <stop offset="60%" stopColor="hsl(var(--accent))" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="valueStroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="100%" stopColor="hsl(var(--accent))" />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 6" vertical={false} opacity={0.5} />
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
                stroke="url(#valueStroke)"
                strokeWidth={2.5}
                fill="url(#valueFill)"
                activeDot={{ r: 5, fill: "hsl(var(--primary))", stroke: "hsl(var(--background))", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </motion.div>
  );
}
