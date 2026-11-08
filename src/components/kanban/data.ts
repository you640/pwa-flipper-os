// Column IDs match the portfolio_status enum values in the database
// exactly so they can be passed straight through.
export type ColumnId = "Building" | "Listed" | "Negotiating" | "Sold";

export interface PwaProject {
  id: string;
  name: string;
  askingPrice: number;
  mrr: number;
  expenses: number;
  column: ColumnId;
}

export interface KanbanColumn {
  id: ColumnId;
  title: string;
  accent: string; // top accent gradient
  dot: string;
}

export const COLUMNS: KanbanColumn[] = [
  {
    id: "Building",
    title: "Building",
    accent: "from-slate-400/60 to-slate-400/0",
    dot: "bg-slate-400",
  },
  {
    id: "Listed",
    title: "Listed",
    accent: "from-sky-400/70 to-sky-400/0",
    dot: "bg-sky-400",
  },
  {
    id: "Negotiating",
    title: "Negotiating",
    accent: "from-amber-400/70 to-amber-400/0",
    dot: "bg-amber-400",
  },
  {
    id: "Sold",
    title: "Sold",
    accent: "from-emerald-400/70 to-emerald-400/0",
    dot: "bg-emerald-400",
  },
];

export const COLUMN_IDS = COLUMNS.map((c) => c.id);

export const formatUSD = (n: number, locale = "en-US") =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);

/** Older saved valuations use the legacy database status. */
export function normalizeColumn(status: string): ColumnId {
  if (status == "For Sale") return "Listed";
  return COLUMN_IDS.includes(status as ColumnId) ? status as ColumnId : "Building";
}
