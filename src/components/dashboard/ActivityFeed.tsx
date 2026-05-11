import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Inbox } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useLocale } from "@/hooks/useLocale";
import type { LeadRow, PortfolioRow } from "@/hooks/useOverviewData";

interface Props {
  leads: LeadRow[] | null;
  portfolio: PortfolioRow[] | null;
  loading?: boolean;
}

const HUES = [
  "from-fuchsia-500 to-violet-500",
  "from-violet-500 to-cyan-500",
  "from-amber-500 to-orange-500",
  "from-cyan-500 to-sky-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
];

function pickHue(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return HUES[h % HUES.length];
}

function getInitials(name: string) {
  return (name || "?")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const leadBadgeClass: Record<string, string> = {
  Lead: "bg-accent/15 text-accent ring-accent/30",
  Contacted: "bg-primary/15 text-primary-glow ring-primary/30",
  Demo: "bg-warning/15 text-warning ring-warning/30",
  Rejected: "bg-destructive/15 text-destructive ring-destructive/30",
};

const portfolioBadgeClass: Record<string, string> = {
  Building: "bg-primary/15 text-primary-glow ring-primary/30",
  Listed: "bg-warning/15 text-warning ring-warning/30",
  "For Sale": "bg-warning/15 text-warning ring-warning/30",
  Negotiating: "bg-accent/15 text-accent ring-accent/30",
  Sold: "bg-success/15 text-success ring-success/30",
};

interface UnifiedItem {
  id: string;
  actor: string;
  badge: string;
  badgeClass: string;
  message: string;
  createdAt: string;
}

export function ActivityFeed({ leads, portfolio, loading }: Props) {
  const { t, intlLocale } = useLocale();
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" });

  const formatRelative = (iso: string) => {
    const diffSec = (new Date(iso).getTime() - Date.now()) / 1000;
    const abs = Math.abs(diffSec);
    if (abs < 60) return t("overview.activity.justNow");
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");
    if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), "day");
    return rtf.format(Math.round(diffSec / (86400 * 30)), "month");
  };

  const items: UnifiedItem[] = [
    ...(leads ?? []).map<UnifiedItem>((l) => ({
      id: `lead-${l.id}`,
      actor: l.agency_name,
      badge: l.status,
      badgeClass: leadBadgeClass[l.status] ?? leadBadgeClass.Lead,
      message:
        t(`overview.activity.lead.${l.status}`, { defaultValue: l.status }) +
        (l.notes ? ` — ${l.notes.slice(0, 80)}` : ""),
      createdAt: l.created_at,
    })),
    ...(portfolio ?? []).map<UnifiedItem>((p) => ({
      id: `portfolio-${p.id}`,
      actor: p.name,
      badge: p.status,
      badgeClass: portfolioBadgeClass[p.status] ?? portfolioBadgeClass.Building,
      message: t(`overview.activity.portfolio.${p.status}`, {
        defaultValue: p.status,
      }),
      createdAt: p.created_at,
    })),
  ]
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 8);

  const isEmpty = !loading && items.length === 0;

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
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {t("overview.activity.title")}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("overview.activity.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-medium text-success ring-1 ring-success/20">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-glow" />
            {t("overview.activity.live")}
          </div>
        </div>

        <ScrollArea className="-mx-2 mt-5 flex-1 pr-2">
          {loading ? (
            <ul className="space-y-3 px-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <li
                  key={i}
                  className="flex gap-3 rounded-lg border border-border/40 bg-card/40 p-3"
                >
                  <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </li>
              ))}
            </ul>
          ) : isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/60 ring-1 ring-border/60">
                <Inbox className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("overview.activity.empty")}
              </p>
              <Link
                to="/crm"
                className="mt-3 text-xs font-medium text-primary-glow hover:underline"
              >
                {t("overview.activity.emptyCta")}
              </Link>
            </div>
          ) : (
            <ul className="space-y-3 px-2">
              {items.map((a, i) => (
                <motion.li
                  key={a.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.04 }}
                  className="group flex gap-3 rounded-lg border border-border/40 bg-card/40 p-3 transition-colors hover:border-border hover:bg-card/80"
                >
                  <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/60">
                    <AvatarFallback
                      className={cn(
                        "bg-gradient-to-br text-[11px] font-semibold text-white",
                        pickHue(a.id),
                      )}
                    >
                      {getInitials(a.actor)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {a.actor}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 border-0 text-[10px] uppercase tracking-wider ring-1",
                          a.badgeClass,
                        )}
                      >
                        {a.badge}
                      </Badge>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-muted-foreground">
                      {a.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground/70">
                      {formatRelative(a.createdAt)}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </Card>
    </motion.div>
  );
}
