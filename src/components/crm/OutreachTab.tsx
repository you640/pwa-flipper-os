import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Brain, Copy, Loader2, Mail, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAiOutreach } from "@/hooks/useAiOutreach";
import { toast } from "sonner";

interface PortfolioApp {
  id: string;
  name: string;
  mrr: number;
}

interface OutreachTabProps {
  leadId: string;
  contactEmail: string | null;
  apps: PortfolioApp[];
}

const formatUSD = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);

export function OutreachTab({ leadId, contactEmail, apps }: OutreachTabProps) {
  const { t } = useTranslation();
  const [appId, setAppId] = useState<string>(apps[0]?.id ?? "");
  const { generate, update, draft, loading } = useAiOutreach();

  const handleGenerate = async () => {
    if (!appId) {
      toast.error(t("crm.outreach.errors.noApp"));
      return;
    }
    await generate(leadId, appId);
  };

  const handleCopy = async () => {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body_markdown}`);
      toast.success(t("crm.copied"));
    } catch {
      toast.error(t("crm.copyFailed"));
    }
  };

  const handleMailto = () => {
    if (!draft) return;
    const to = contactEmail || "";
    const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
      draft.subject,
    )}&body=${encodeURIComponent(draft.body_markdown)}`;
    window.location.href = url;
  };

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">
          {t("crm.outreach.selectApp")}
        </Label>
        {apps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/30 p-4 text-center text-sm text-muted-foreground">
            {t("crm.noPortfolio")}
          </div>
        ) : (
          <Select value={appId} onValueChange={setAppId}>
            <SelectTrigger className="h-11 bg-card/40">
              <SelectValue placeholder={t("crm.pickApp")} />
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

      <Button
        onClick={handleGenerate}
        disabled={loading || !appId}
        className="group relative h-11 w-full overflow-hidden bg-gradient-primary font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {loading ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            {t("crm.outreach.generating")}
          </>
        ) : (
          <>
            <Brain className="mr-1.5 h-4 w-4" />
            {draft ? t("crm.outreach.regenerate") : t("crm.outreach.generate")}
          </>
        )}
      </Button>

      {loading && !draft && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}

      {draft && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="space-y-4 rounded-xl border border-border/50 bg-card/40 p-4"
        >
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" />
            {t("crm.outreach.aiDraft")}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("crm.outreach.subject")}
            </Label>
            <Input
              value={draft.subject}
              onChange={(e) => update({ subject: e.target.value })}
              className="h-10 bg-background/40"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider text-muted-foreground">
              {t("crm.outreach.body")}
            </Label>
            <Textarea
              value={draft.body_markdown}
              onChange={(e) => update({ body_markdown: e.target.value })}
              className="min-h-[220px] resize-none border-border/60 bg-background/40 font-mono text-[13px] leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <Button onClick={handleCopy} variant="outline" className="h-10">
              <Copy className="mr-1.5 h-4 w-4" />
              {t("crm.outreach.copy")}
            </Button>
            <Button onClick={handleMailto} variant="outline" className="h-10">
              <Mail className="mr-1.5 h-4 w-4" />
              {t("crm.outreach.openInMail")}
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="contents">
                    <Button disabled className="h-10 bg-gradient-primary font-semibold text-primary-foreground opacity-60">
                      <Send className="mr-1.5 h-4 w-4" />
                      {t("crm.outreach.sendViaResend")}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>{t("crm.outreach.comingSoon")}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>
      )}
    </div>
  );
}
