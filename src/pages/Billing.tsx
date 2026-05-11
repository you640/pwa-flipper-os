import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useProfile } from "@/hooks/useProfile";

export default function Billing() {
  const { isAdmin } = useProfile();
  const { t } = useTranslation();

  const planName = isAdmin ? t("billing.planFounder") : t("billing.planStarter");
  const planDesc = isAdmin ? t("billing.planFounderDesc") : t("billing.planStarterDesc");

  return (
    <AppLayout>
      <SEO title={t("seo.billingTitle")} description={t("seo.billingDesc")} />

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("billing.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("billing.subtitle")}</p>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl shadow-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-glow">
                <Sparkles className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-foreground">{planName}</h2>
                  <Badge variant={isAdmin ? "default" : "secondary"}>{t("common.current")}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{planDesc}</p>
              </div>
            </div>
            {!isAdmin && (
              <Button className="bg-gradient-primary shadow-glow">
                <Zap className="mr-2 h-4 w-4" /> {t("billing.upgrade")}
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-foreground">{t("billing.invoices")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">{t("billing.noInvoices")}</p>
        </div>
      </div>
    </AppLayout>
  );
}
