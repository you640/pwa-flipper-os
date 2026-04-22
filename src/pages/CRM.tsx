import { useEffect, useMemo, useState } from "react";
import { SEO } from "@/components/seo/SEO";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Building2,
  Copy,
  Loader2,
  Mail,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type LeadStatus = "Lead" | "Contacted" | "Demo" | "Rejected";

interface Lead {
  id: string;
  agency_name: string;
  contact_email: string | null;
  status: LeadStatus;
  notes: string | null;
}

interface PortfolioApp {
  id: string;
  name: string;
  mrr: number;
  asking_price: number;
}

const STATUS_META: Record<LeadStatus, string> = {
  Lead: "bg-accent/15 text-accent ring-accent/30",
  Contacted: "bg-primary/15 text-primary-glow ring-primary/30",
  Demo: "bg-warning/15 text-warning ring-warning/30",
  Rejected: "bg-destructive/15 text-destructive ring-destructive/30",
};

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export default function CRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [apps, setApps] = useState<PortfolioApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [leadsRes, appsRes] = await Promise.all([
        supabase.from("crm_leads").select("*").order("created_at", { ascending: false }),
        supabase.from("portfolio").select("id,name,mrr,asking_price").order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;

      if (leadsRes.error) {
        toast.error("Failed to load leads", { description: leadsRes.error.message });
      } else {
        setLeads((leadsRes.data ?? []) as Lead[]);
      }
      if (appsRes.error) {
        toast.error("Failed to load portfolio", { description: appsRes.error.message });
      } else {
        setApps((appsRes.data ?? []) as PortfolioApp[]);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter(
      (l) =>
        l.agency_name.toLowerCase().includes(q) ||
        (l.contact_email ?? "").toLowerCase().includes(q),
    );
  }, [leads, query]);

  const handleAddLead = async (data: {
    agency_name: string;
    contact_email: string;
    notes: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be signed in to add a lead");
      return;
    }
    const { data: row, error } = await supabase
      .from("crm_leads")
      .insert({
        agency_name: data.agency_name,
        contact_email: data.contact_email || null,
        notes: data.notes || null,
        status: "Lead",
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast.error("Failed to add lead", { description: error.message });
      return;
    }
    setLeads((prev) => [row as Lead, ...prev]);
    toast.success("Lead added!");
    setAddOpen(false);
  };

  return (
    <AppLayout>
      <SEO
        title="Buyer CRM | Pitch Generator | Flipper OS"
        description="Track acquisition agencies, generate AI cold-email pitches, and close deals faster with the built-in PWA buyer CRM."
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
              Buyer <span className="text-gradient">CRM</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track potential acquirers and fire off AI-generated cold pitches.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-3 py-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            {loading ? "Loading…" : `${leads.length} leads tracked`}
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05, ease: "easeOut" }}
        >
          <Card className="glass overflow-hidden p-5 shadow-elegant md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by agency or email…"
                  className="h-10 bg-card/40 pl-9"
                />
              </div>

              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild>
                  <Button className="group relative h-10 overflow-hidden bg-gradient-primary font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-[0_0_40px_-8px_hsl(var(--primary)/0.7)]">
                    <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                    <Plus className="mr-1 h-4 w-4" />
                    Add Lead
                  </Button>
                </DialogTrigger>
                <AddLeadDialog onSubmit={handleAddLead} />
              </Dialog>
            </div>

            <div className="mt-5 overflow-x-auto rounded-xl border border-border/50">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/60 hover:bg-transparent">
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Agency
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Contact
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                      Notes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading &&
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={`sk-${i}`} className="border-b border-border/40 hover:bg-transparent">
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                      </TableRow>
                    ))}

                  {!loading && filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-sm text-muted-foreground">
                        {leads.length === 0
                          ? "No leads yet. Add your first agency above."
                          : "No leads match your search."}
                      </TableCell>
                    </TableRow>
                  )}

                  {!loading &&
                    filtered.map((lead, i) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: Math.min(i * 0.04, 0.4), ease: "easeOut" }}
                        onClick={() => setSelectedLead(lead)}
                        className="cursor-pointer border-b border-border/40 transition-colors hover:bg-card/40"
                      >
                        <TableCell className="py-3.5 font-semibold text-foreground">
                          {lead.agency_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {lead.contact_email || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              "border-0 text-[10px] uppercase tracking-wider ring-1",
                              STATUS_META[lead.status],
                            )}
                          >
                            {lead.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {lead.notes || "—"}
                        </TableCell>
                      </motion.tr>
                    ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Pitch Generator Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(o) => !o && setSelectedLead(null)}>
        <SheetContent
          side="right"
          className="glass w-full overflow-y-auto border-border/60 sm:max-w-xl"
        >
          {selectedLead && (
            <PitchPanel lead={selectedLead} apps={apps} />
          )}
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}

// ---------------------------------------------------------------
// Add lead dialog
// ---------------------------------------------------------------
function AddLeadDialog({
  onSubmit,
}: {
  onSubmit: (data: { agency_name: string; contact_email: string; notes: string }) => void;
}) {
  const [agency, setAgency] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const valid = agency.trim().length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    onSubmit({ agency_name: agency.trim(), contact_email: email.trim(), notes: notes.trim() });
    setAgency("");
    setEmail("");
    setNotes("");
  };

  return (
    <DialogContent className="glass border-border/60 sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add a new lead</DialogTitle>
        <DialogDescription>Track a potential buyer agency.</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Agency Name</Label>
          <Input
            value={agency}
            onChange={(e) => setAgency(e.target.value)}
            placeholder="e.g. Pixel Forge Studios"
            className="h-10 bg-card/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@agency.com"
            className="h-10 bg-card/40"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything worth remembering…"
            className="min-h-[88px] resize-none bg-card/40"
          />
        </div>
        <DialogFooter className="pt-2">
          <Button
            type="submit"
            disabled={!valid}
            className="bg-gradient-primary font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
          >
            Save Lead
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ---------------------------------------------------------------
// Pitch generator panel (in Sheet)
// ---------------------------------------------------------------
function PitchPanel({ lead, apps }: { lead: Lead; apps: PortfolioApp[] }) {
  const [appId, setAppId] = useState<string>(apps[0]?.id ?? "");
  const [generating, setGenerating] = useState(false);
  const [pitch, setPitch] = useState("");

  const selectedApp = useMemo(
    () => apps.find((a) => a.id === appId) ?? null,
    [appId, apps],
  );

  // Auto-generate pitch when app changes
  useEffect(() => {
    if (!selectedApp) {
      setPitch("");
      return;
    }
    setGenerating(true);
    const timer = setTimeout(() => {
      setPitch(buildPitch(lead, selectedApp));
      setGenerating(false);
    }, 600);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appId, lead.id]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pitch);
      toast.success("Pitch copied to clipboard!");
    } catch {
      toast.error("Could not access clipboard");
    }
  };

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="space-y-2 text-left">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          <Sparkles className="h-3 w-3 text-primary" />
          AI Pitch Generator
        </div>
        <SheetTitle className="text-2xl font-semibold tracking-tight">
          {lead.agency_name}
        </SheetTitle>
        <SheetDescription className="flex items-center gap-1.5 text-sm">
          <Mail className="h-3.5 w-3.5" />
          {lead.contact_email || "No email on file"}
        </SheetDescription>
      </SheetHeader>

      <div className="mt-6 flex-1 space-y-5">
        {/* App selector */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Select an app from your portfolio
          </Label>
          {apps.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-sm text-muted-foreground">
              No portfolio apps yet. Add one from the Valuation Engine.
            </div>
          ) : (
            <Select value={appId} onValueChange={setAppId}>
              <SelectTrigger className="h-11 bg-card/40">
                <SelectValue placeholder="Pick an app to pitch" />
              </SelectTrigger>
              <SelectContent>
                {apps.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <div className="flex items-center justify-between gap-6">
                      <span>{a.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatUSD(a.mrr)} MRR
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* App stats */}
        <AnimatePresence mode="wait">
          {selectedApp && (
            <motion.div
              key={selectedApp.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-2 gap-3"
            >
              <Stat label="MRR" value={formatUSD(selectedApp.mrr)} />
              <Stat label="Asking Price" value={formatUSD(selectedApp.asking_price)} highlight />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pitch textarea */}
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Cold email
          </Label>
          <div className="relative">
            <Textarea
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder={selectedApp ? "Generating…" : "Pick an app to generate a pitch."}
              className="min-h-[280px] resize-none border-border/60 bg-card/40 font-mono text-[13px] leading-relaxed"
            />
            {generating && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-md bg-background/40 backdrop-blur-sm">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 border-t border-border/50 pt-5">
        <Button
          onClick={handleCopy}
          disabled={!pitch || generating}
          className="group relative h-12 w-full overflow-hidden bg-gradient-primary font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-[0_0_50px_-10px_hsl(var(--primary)/0.7)] disabled:opacity-50 disabled:hover:translate-y-0"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Copy className="mr-1.5 h-4 w-4" />
          Copy to Clipboard
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-border/50 bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div
        className={cn(
          "mt-1 font-mono text-base font-semibold tabular-nums",
          highlight ? "text-gradient" : "text-foreground",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function buildPitch(lead: Lead, app: PortfolioApp): string {
  const firstName = (lead.agency_name.split(/\s+/)[0] || "there").replace(/[^A-Za-z]/g, "") || "team";
  return `Subject: Quick idea for ${lead.agency_name} — acquiring ${app.name}

Hi ${firstName} team,

I run a small studio building lightweight PWAs for service businesses, and I came across ${lead.agency_name} while researching agencies that work with growing brands.

I wanted to put one of my apps on your radar:

  • ${app.name}
  • Current MRR: ${formatUSD(app.mrr)}
  • Asking price: ${formatUSD(app.asking_price)}

It's stable, fully documented, and ready to plug into your client portfolio — either as a direct acquisition or a white-label offering. Customers stick around (>90% retention), and the codebase is clean enough to hand off in a single afternoon.

Would you be open to a 15-minute call this week to see if it's a fit?

Best,
Alex
PWA Flipper OS`;
}
