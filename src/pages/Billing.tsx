import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

export default function Billing() {
  const { isAdmin } = useProfile();

  const planName = isAdmin ? "Founder — Unlimited" : "Starter";
  const planDesc = isAdmin
    ? "Unlimited credits, priority support, full admin access."
    : "Free tier. Upgrade for higher limits and premium features.";

  return (
    <AppLayout>
      <SEO title="Billing | Flipper OS" description="Manage your subscription, plan and invoices." />

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Billing</h1>
          <p className="text-sm text-muted-foreground">Plan, invoices and usage.</p>
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
                  <Badge variant={isAdmin ? "default" : "secondary"}>Current</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{planDesc}</p>
              </div>
            </div>
            {!isAdmin && (
              <Button className="bg-gradient-primary shadow-glow">
                <Zap className="mr-2 h-4 w-4" /> Upgrade
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-semibold text-foreground">Invoices</h3>
          <p className="mt-2 text-sm text-muted-foreground">No invoices yet. They will appear here once billing is enabled.</p>
        </div>
      </div>
    </AppLayout>
  );
}
