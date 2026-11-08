import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useLocale } from "@/hooks/useLocale";
import { COLUMN_IDS, type ColumnId, type PwaProject } from "./data";
import { validateProject, type ProjectForm } from "./validateProject";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  project: PwaProject | null; // null = create
  defaultColumn: ColumnId;
  onSubmit: (form: ProjectForm) => Promise<boolean>;
}

interface AuditRow { id: string; created_at: string; ai_report: { code_quality_score?: number; estimated_valuation?: { mid?: number } } }

export function ProjectDialog({ open, onOpenChange, project, defaultColumn, onSubmit }: Props) {
  const { t } = useTranslation();
  const { formatCurrency } = useLocale();
  const [form, setForm] = useState<ProjectForm>({ name: "", mrr: 0, expenses: 0, askingPrice: 0, column: defaultColumn });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [audits, setAudits] = useState<AuditRow[] | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setForm(project
      ? { name: project.name, mrr: project.mrr, expenses: project.expenses, askingPrice: project.askingPrice, column: project.column }
      : { name: "", mrr: 0, expenses: 0, askingPrice: 0, column: defaultColumn });
    setAudits(null);
    if (project) {
      supabase.from("portfolio_audits").select("id,created_at,ai_report").eq("portfolio_id", project.id)
        .order("created_at", { ascending: false }).limit(10)
        .then(({ data }) => setAudits((data ?? []) as unknown as AuditRow[]));
    }
  }, [open, project, defaultColumn]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateProject(form);
    if (err) { setError(t(`portfolio.crud.${err}`)); return; }
    setSaving(true);
    const ok = await onSubmit({ ...form, name: form.name.trim() });
    setSaving(false);
    if (ok) onOpenChange(false);
  };

  const num = (k: "mrr" | "expenses" | "askingPrice") => ({
    type: "number", min: 0, value: String(form[k]),
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: Number(e.target.value) }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader><DialogTitle>{project ? t("portfolio.crud.edit") : t("portfolio.crud.add")}</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="space-y-1.5"><Label htmlFor="p-name">{t("portfolio.crud.name")}</Label>
            <Input id="p-name" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5"><Label htmlFor="p-mrr">{t("portfolio.crud.mrr")}</Label><Input id="p-mrr" {...num("mrr")} /></div>
            <div className="space-y-1.5"><Label htmlFor="p-exp">{t("portfolio.crud.expenses")}</Label><Input id="p-exp" {...num("expenses")} /></div>
            <div className="space-y-1.5"><Label htmlFor="p-ask">{t("portfolio.crud.asking")}</Label><Input id="p-ask" {...num("askingPrice")} /></div>
          </div>
          <div className="space-y-1.5"><Label>{t("portfolio.crud.status")}</Label>
            <Select value={form.column} onValueChange={(v) => setForm({ ...form, column: v as ColumnId })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COLUMN_IDS.map((c) => <SelectItem key={c} value={c}>{t(`portfolio.columns.${c}` as const)}</SelectItem>)}</SelectContent>
            </Select></div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {project && (
            <div className="space-y-2 border-t border-border/60 pt-3">
              <h4 className="text-sm font-semibold">{t("portfolio.crud.history")}</h4>
              {audits === null ? <p className="text-xs text-muted-foreground">{t("common.loading")}</p>
                : audits.length === 0 ? <p className="text-xs text-muted-foreground">{t("portfolio.crud.noHistory")}</p>
                : <ul className="space-y-1.5">{audits.map((a) => (
                    <li key={a.id} className="flex justify-between rounded-md bg-secondary/40 px-3 py-2 text-xs">
                      <span>{new Date(a.created_at).toLocaleDateString()}</span>
                      <span>{t("portfolio.crud.score")}: {a.ai_report?.code_quality_score ?? "—"}</span>
                      <span>{a.ai_report?.estimated_valuation?.mid ? formatCurrency(a.ai_report.estimated_valuation.mid) : "—"}</span>
                    </li>))}</ul>}
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>{t("portfolio.crud.cancel")}</Button>
            <Button type="submit" disabled={saving}>{t("portfolio.crud.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
