export type ColumnId = "building" | "listed" | "negotiation" | "sold";

export interface PwaProject {
  id: string;
  name: string;
  askingPrice: number;
  mrr: number;
  tags: string[];
  column: ColumnId;
}

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  accent: string; // tailwind classes for top border + glow
  dot: string;
}

export const COLUMNS: KanbanColumn[] = [
  {
    id: "building",
    title: "Building / Idea",
    accent: "from-slate-400/60 to-slate-400/0",
    dot: "bg-slate-400",
  },
  {
    id: "listed",
    title: "Listed on Market",
    accent: "from-sky-400/70 to-sky-400/0",
    dot: "bg-sky-400",
  },
  {
    id: "negotiation",
    title: "In Negotiation",
    accent: "from-amber-400/70 to-amber-400/0",
    dot: "bg-amber-400",
  },
  {
    id: "sold",
    title: "Sold",
    accent: "from-emerald-400/70 to-emerald-400/0",
    dot: "bg-emerald-400",
  },
];

export const INITIAL_PROJECTS: PwaProject[] = [
  {
    id: "p1",
    name: "FormForge PWA",
    askingPrice: 0,
    mrr: 0,
    tags: ["React", "Supabase", "Tailwind"],
    column: "building",
  },
  {
    id: "p2",
    name: "InboxZero AI",
    askingPrice: 0,
    mrr: 180,
    tags: ["Next.js", "OpenAI", "Stripe"],
    column: "building",
  },
  {
    id: "p3",
    name: "InvoiceFlow PWA",
    askingPrice: 28500,
    mrr: 1240,
    tags: ["React", "Supabase", "Stripe"],
    column: "listed",
  },
  {
    id: "p4",
    name: "MenuMate PWA",
    askingPrice: 24900,
    mrr: 980,
    tags: ["Vite", "Firebase", "PWA"],
    column: "listed",
  },
  {
    id: "p5",
    name: "TaskPilot",
    askingPrice: 31200,
    mrr: 1420,
    tags: ["React", "Supabase", "Resend"],
    column: "listed",
  },
  {
    id: "p6",
    name: "BookingBuddy",
    askingPrice: 18500,
    mrr: 760,
    tags: ["React", "Supabase", "Stripe"],
    column: "negotiation",
  },
  {
    id: "p7",
    name: "FitTrack PWA",
    askingPrice: 14200,
    mrr: 540,
    tags: ["Svelte", "Supabase"],
    column: "negotiation",
  },
  {
    id: "p8",
    name: "ClinicQueue PWA",
    askingPrice: 22000,
    mrr: 920,
    tags: ["React", "Supabase", "Twilio"],
    column: "sold",
  },
  {
    id: "p9",
    name: "ShipSnap",
    askingPrice: 9800,
    mrr: 410,
    tags: ["Next.js", "Stripe"],
    column: "sold",
  },
];

export const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
