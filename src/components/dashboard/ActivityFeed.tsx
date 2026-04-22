import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Status = "lead" | "valuation" | "listed" | "offer" | "sold";

interface Activity {
  initials: string;
  actor: string;
  message: React.ReactNode;
  time: string;
  status: Status;
  hue: string;
}

const statusMap: Record<Status, { label: string; className: string }> = {
  lead: { label: "Lead", className: "bg-accent/15 text-accent ring-accent/30" },
  valuation: { label: "Valuation", className: "bg-primary/15 text-primary-glow ring-primary/30" },
  listed: { label: "Listed", className: "bg-warning/15 text-warning ring-warning/30" },
  offer: { label: "Offer", className: "bg-primary/15 text-primary-glow ring-primary/30" },
  sold: { label: "Sold", className: "bg-success/15 text-success ring-success/30" },
};

const activities: Activity[] = [
  {
    initials: "ND",
    actor: "Northbeam Digital",
    message: (
      <>
        requested demo of <b className="text-foreground">InvoiceFlow PWA</b>{" "}
        <span className="text-muted-foreground">($1,240 MRR)</span>
      </>
    ),
    time: "12m ago",
    status: "lead",
    hue: "from-fuchsia-500 to-violet-500",
  },
  {
    initials: "RS",
    actor: "Rivertown Studios",
    message: (
      <>
        sent offer of <b className="text-foreground">$18,500</b> for{" "}
        <b className="text-foreground">BookingBuddy</b>
      </>
    ),
    time: "1h ago",
    status: "offer",
    hue: "from-violet-500 to-cyan-500",
  },
  {
    initials: "AC",
    actor: "Acquire.com",
    message: (
      <>
        <b className="text-foreground">MenuMate PWA</b> listed at{" "}
        <b className="text-foreground">$24,900</b>
      </>
    ),
    time: "3h ago",
    status: "listed",
    hue: "from-amber-500 to-orange-500",
  },
  {
    initials: "VE",
    actor: "Valuation Engine",
    message: (
      <>
        updated <b className="text-foreground">TaskPilot</b> →{" "}
        <b className="text-foreground">$31,200</b>{" "}
        <span className="text-muted-foreground">(4.2× MRR)</span>
      </>
    ),
    time: "6h ago",
    status: "valuation",
    hue: "from-cyan-500 to-sky-500",
  },
  {
    initials: "HM",
    actor: "Helix Marketing",
    message: (
      <>
        purchased <b className="text-foreground">ClinicQueue PWA</b> for{" "}
        <b className="text-foreground">$22,000</b>
      </>
    ),
    time: "Yesterday",
    status: "sold",
    hue: "from-emerald-500 to-teal-500",
  },
  {
    initials: "BA",
    actor: "Brightpath Agency",
    message: (
      <>
        new lead — interested in <b className="text-foreground">FormForge</b>
      </>
    ),
    time: "2d ago",
    status: "lead",
    hue: "from-pink-500 to-rose-500",
  },
];

export function ActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="glass flex h-full flex-col overflow-hidden p-5 shadow-elegant md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Recent Activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">Live signals from your portfolio</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success ring-1 ring-success/20">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            Live
          </div>
        </div>

        <ScrollArea className="-mx-2 mt-5 flex-1 pr-2">
          <ul className="space-y-3 px-2">
            {activities.map((a, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.4 + i * 0.05 }}
                className="group flex gap-3 rounded-lg border border-border/40 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/80"
              >
                <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/60">
                  <AvatarFallback
                    className={cn(
                      "bg-gradient-to-br text-[11px] font-semibold text-white",
                      a.hue,
                    )}
                  >
                    {a.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{a.actor}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 border-0 text-[10px] uppercase tracking-wider ring-1",
                        statusMap[a.status].className,
                      )}
                    >
                      {statusMap[a.status].label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">{a.message}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground/70">{a.time}</p>
                </div>
              </motion.li>
            ))}
          </ul>
        </ScrollArea>
      </Card>
    </motion.div>
  );
}
