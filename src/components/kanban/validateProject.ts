import type { ColumnId } from "./data";

export interface ProjectForm { name: string; mrr: number; expenses: number; askingPrice: number; column: ColumnId }

/** Returns an i18n key suffix under portfolio.crud, or null when valid. */
export function validateProject(f: ProjectForm): "nameRequired" | "invalidNumber" | null {
  if (!f.name.trim()) return "nameRequired";
  for (const n of [f.mrr, f.expenses, f.askingPrice]) if (!Number.isFinite(n) || n < 0) return "invalidNumber";
  return null;
}
