import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export function PricingWaitlistDialog({
  open,
  onOpenChange,
  tier,
  defaultEmail,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tier: "pro" | "exit";
  defaultEmail?: string;
}) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(defaultEmail ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && defaultEmail) setEmail(defaultEmail);
  }, [open, defaultEmail]);

  const tierName = t(`pricing.tiers.${tier}.name`);

  const submit = async () => {
    const trimmed = email.trim();
    if (trimmed.length < 4 || !trimmed.includes("@")) {
      toast.error(t("pricing.waitlist.error"));
      return;
    }
    setBusy(true);
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase.from("pricing_waitlist").insert({
      email: trimmed,
      tier,
      user_id: userData.user?.id ?? null,
    });
    setBusy(false);
    if (error) {
      toast.error(t("pricing.waitlist.error"), { description: error.message });
      return;
    }
    toast.success(t("pricing.waitlist.success"));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("pricing.waitlist.title", { tier: tierName })}</DialogTitle>
          <DialogDescription>
            {t("pricing.waitlist.desc", { tier: tierName })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="wl-email">{t("pricing.waitlist.emailLabel")}</Label>
          <Input
            id="wl-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("pricing.waitlist.emailPh")}
          />
        </div>
        <DialogFooter>
          <Button onClick={submit} disabled={busy} className="bg-gradient-primary text-primary-foreground">
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {busy ? t("pricing.waitlist.submitting") : t("pricing.waitlist.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
