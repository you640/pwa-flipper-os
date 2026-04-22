import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowLeft,
  Building2,
  Copy,
  Globe,
  Loader2,
  Mail,
  Search,
  Sparkles,
  User2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Status = "lead" | "contacted" | "demo" | "rejected";

interface Lead {
  id: string;
  agency: string;
  contact: string;
  email: string;
  website: string;
  status: Status;
  hue: string;
  initials: string;
}

const STATUS_META: Record<Status, { label: string; className: string }> = {
  lead: { label: "Lead", className: "bg-accent/15 text-accent ring-accent/30" },
  contacted: {
    label: "Contacted",
    className: "bg-primary/15 text-primary-glow ring-primary/30",
  },
  demo: { label: "Demo", className: "bg-warning/15 text-warning ring-warning/30" },
  rejected: {
    label: "Rejected",
    className: "bg-destructive/15 text-destructive ring-destructive/30",
  },
};

const SEED: Lead[] = [
  {
    id: "l1",
    agency: "Helix Marketing",
    contact: "Marcus Chen",
    email: "marcus@helixmarketing.com",
    website: "helixmarketing.com",
    status: "demo",
    hue: "from-emerald-500 to-teal-500",
    initials: "HM",
  },
  {
    id: "l2",
    agency: "Brightpath Agency",
    contact: "Sara Kovacs",
    email: "sara@brightpath.io",
    website: "brightpath.io",
    status: "lead",
    hue: "from-pink-500 to-rose-500",
    initials: "BA",
  },
  {
    id: "l3",
    agency: "SK Beauty Distributors",
    contact: "Lena Park",
    email: "lena@skbeauty.co",
    website: "skbeauty.co",
    status: "contacted",
    hue: "from-fuchsia-500 to-violet-500",
    initials: "SK",
  },
  {
    id: "l4",
    agency: "Northbeam Digital",
    contact: "Diego Alvarez",
    email: "diego@northbeam.digital",
    website: "northbeam.digital",
    status: "demo",
    hue: "from-violet-500 to-cyan-500",
    initials: "ND",
  },
  {
    id: "l5",
    agency: "Rivertown Studios",
    contact: "Priya Desai",
    email: "priya@rivertown.studio",
    website: "rivertown.studio",
    status: "contacted",
    hue: "from-cyan-500 to-sky-500",
    initials: "RS",
  },
  {
    id: "l6",
    agency: "Acme Local Group",
    contact: "Tom Becker",
    email: "tom@acmelocal.com",
    website: "acmelocal.com",
    status: "rejected",
    hue: "from-amber-500 to-orange-500",
    initials: "AL",
  },
];

const PITCH_APPS = [
  { id: "invoiceflow", name: "InvoiceFlow PWA", mrr: 1240 },
  { id: "bookingbuddy", name: "BookingBuddy", mrr: 760 },
  { id: "menumate", name: "MenuMate", mrr: 980 },
];

export default function CRM() {
  const [leads, setLeads] = useState<Lead[]>(SEED);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(SEED[0].id);

  const filtered = leads.filter(
    (l) =>
      l.agency.toLowerCase().includes(query.toLowerCase()) ||
      l.contact.toLowerCase().includes(query.toLowerCase()),
  );

  const selected = leads.find((l) => l.id === selectedId) ?? null;

  const updateStatus = (id: string, status: Status) => {
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
  };

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-[1500px] space-y-6">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-wrap items-end justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Buyer <span className="text-gradient">CRM</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track potential acquirers and fire off AI-generated cold pitches.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
            {leads.length} leads · {leads.filter((l) => l.status === "demo").length} in demo
          </div>
        </motion.header>

        <div
          className={cn(
            "grid gap-5",
            "lg:grid-cols-[minmax(280px,32%)_1fr]",
          )}
        >
          {/* LEFT — Lead list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05, ease: "easeOut" }}
            className={cn(
              "lg:block",
              selected && "hidden", // mobile: hide list when a lead is open
            )}
          >
            <Card className="glass flex h-full flex-col overflow-hidden p-4 shadow-elegant">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search leads…"
                  className="h-10 bg-card/40 pl-9"
                />
              </div>

              <ScrollArea className="-mx-2 mt-3 max-h-[calc(100vh-280px)] flex-1 pr-2">
                <ul className="space-y-1.5 px-2">
                  {filtered.map((lead, i) => {
                    const active = lead.id === selectedId;
                    return (
                      <motion.li
                        key={lead.id}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                      >
                        <button
                          onClick={() => setSelectedId(lead.id)}
                          className={cn(
                            "group flex w-full items-center gap-3 rounded-lg border border-transparent p-3 text-left transition-all",
                            active
                              ? "border-primary/40 bg-primary/10 shadow-glow"
                              : "hover:border-border hover:bg-card/60",
                          )}
                        >
                          <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/60">
                            <AvatarFallback
                              className={cn(
                                "bg-gradient-to-br text-[11px] font-semibold text-white",
                                lead.hue,
                              )}
                            >
                              {lead.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                {lead.agency}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-2">
                              <span className="truncate text-xs text-muted-foreground">
                                {lead.contact}
                              </span>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "shrink-0 border-0 text-[10px] uppercase tracking-wider ring-1",
                                  STATUS_META[lead.status].className,
                                )}
                              >
                                {STATUS_META[lead.status].label}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      </motion.li>
                    );
                  })}
                  {filtered.length === 0 && (
                    <li className="py-10 text-center text-xs text-muted-foreground">
                      No leads match your search.
                    </li>
                  )}
                </ul>
              </ScrollArea>
            </Card>
          </motion.div>

          {/* RIGHT — Detail */}
          <div
            className={cn(
              "lg:block",
              !selected && "hidden",
            )}
          >
            <AnimatePresence mode="wait">
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="space-y-5"
                >
                  {/* Mobile back */}
                  <button
                    onClick={() => setSelectedId(null)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground lg:hidden"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to leads
                  </button>

                  <ContactCard lead={selected} onStatusChange={(s) => updateStatus(selected.id, s)} />
                  <PitchGenerator lead={selected} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ContactCard({
  lead,
  onStatusChange,
}: {
  lead: Lead;
  onStatusChange: (s: Status) => void;
}) {
  return (
    <Card className="glass relative overflow-hidden p-6 shadow-elegant">
      <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/15 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-1 ring-border/60">
            <AvatarFallback
              className={cn("bg-gradient-to-br text-base font-semibold text-white", lead.hue)}
            >
              {lead.initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {lead.agency}
            </h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
              <User2 className="h-3.5 w-3.5" />
              {lead.contact}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Status
          </Label>
          <Select value={lead.status} onValueChange={(v) => onStatusChange(v as Status)}>
            <SelectTrigger className="h-9 w-36 bg-card/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(STATUS_META) as Status[]).map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoTile icon={<Mail className="h-4 w-4" />} label="Email" value={lead.email} />
        <InfoTile icon={<Globe className="h-4 w-4" />} label="Website" value={lead.website} />
      </div>
    </Card>
  );
}

function InfoTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/40 p-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary/60 text-primary ring-1 ring-border/60">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="truncate text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function PitchGenerator({ lead }: { lead: Lead }) {
  const [appId, setAppId] = useState(PITCH_APPS[0].id);
  const [loading, setLoading] = useState(false);
  const [pitch, setPitch] = useState("");

  const handleGenerate = () => {
    setLoading(true);
    setPitch("");
    const app = PITCH_APPS.find((a) => a.id === appId)!;
    setTimeout(() => {
      const text = `Hi ${lead.contact.split(" ")[0]},

I run a micro-SaaS studio focused on lightweight PWAs for service businesses. I saw ${lead.agency} works with local businesses and thought this might be relevant.

I've built ${app.name}, a production PWA currently doing $${app.mrr.toLocaleString()} MRR with retention above 90%. It's stable, well-documented, and could plug straight into your client portfolio — either as an acquisition or as a white-label solution.

Would you be open to a 15-minute call this week to explore whether it's a fit?

Best,
Alex
PWA Flipper OS`;
      setPitch(text);
      setLoading(false);
    }, 1500);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pitch);
      toast.success("Pitch copied!");
    } catch {
      toast.error("Could not access clipboard");
    }
  };

  return (
    <Card className="glow-border relative overflow-hidden bg-gradient-card p-6 shadow-elegant">
      <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-primary/20 blur-3xl animate-pulse-glow" />
      <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            AI Pitch Generator
          </div>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
            Craft a cold email in seconds
          </h3>
        </div>
        <Building2 className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="relative mt-6 grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Select App to Pitch
          </Label>
          <Select value={appId} onValueChange={setAppId}>
            <SelectTrigger className="h-11 bg-card/40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PITCH_APPS.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center justify-between gap-6">
                    <span>{a.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ${a.mrr.toLocaleString()} MRR
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="group relative h-11 overflow-hidden bg-gradient-primary font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)] disabled:opacity-80 disabled:hover:translate-y-0"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {loading ? (
            <>
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              Generating…
            </>
          ) : (
            <>
              <Sparkles className="mr-1 h-4 w-4" />
              Generate AI Pitch
            </>
          )}
        </Button>
      </div>

      <div className="relative mt-5">
        <Textarea
          value={pitch}
          readOnly
          placeholder="Your AI-generated pitch will appear here…"
          className="min-h-[260px] resize-none border-border/60 bg-card/40 font-mono text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/60"
        />

        <AnimatePresence>
          {pitch && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-3 flex justify-end"
            >
              <Button
                variant="outline"
                onClick={handleCopy}
                className="border-border/60 bg-card/40 hover:bg-secondary"
              >
                <Copy className="mr-1 h-4 w-4" />
                Copy to Clipboard
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
