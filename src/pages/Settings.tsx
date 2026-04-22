import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AppLayout } from "@/components/layout/AppLayout";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { useLocale } from "@/hooks/useLocale";

type Theme = "dark" | "light" | "system";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", isDark);
}

export default function Settings() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { language, setLanguage } = useLocale();
  const { user, profile, refresh } = useProfile();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("theme") as Theme) || "dark");
  const [emailNotif, setEmailNotif] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => setEmail(user?.email ?? ""), [user?.email]);
  useEffect(() => setEmailNotif(profile?.email_notifications ?? true), [profile?.email_notifications]);
  useEffect(() => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  }, [theme]);

  const updateEmail = async () => {
    if (!email || email === user?.email) return;
    setBusy("email");
    const { error } = await supabase.auth.updateUser({ email });
    setBusy(null);
    if (error) return toast.error(error.message);
    toast.success(t("settings.confirmEmailSent"));
  };

  const updatePassword = async () => {
    if (password.length < 6) return toast.error(t("settings.pwTooShort"));
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success(t("settings.pwUpdated"));
  };

  const saveNotifs = async (val: boolean) => {
    setEmailNotif(val);
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ email_notifications: val })
      .eq("id", user.id);
    if (error) {
      console.error(error);
      toast.error(t("settings.notifSaveFailed"));
    } else {
      refresh();
    }
  };

  const signOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast.success(t("settings.signOutAllDone"));
    navigate("/login", { replace: true });
  };

  const deleteAccount = async () => {
    setBusy("delete");
    const { error } = await supabase.functions.invoke("delete-account");
    setBusy(null);
    if (error) return toast.error(t("settings.deleteFailed"));
    await supabase.auth.signOut();
    toast.success(t("settings.deleted"));
    navigate("/login", { replace: true });
  };

  return (
    <AppLayout>
      <SEO title={t("seo.settingsTitle")} description={t("seo.settingsDesc")} />

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("settings.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">{t("settings.tabs.account")}</TabsTrigger>
            <TabsTrigger value="appearance">{t("settings.tabs.appearance")}</TabsTrigger>
            <TabsTrigger value="notifications">{t("settings.tabs.notifications")}</TabsTrigger>
            <TabsTrigger value="danger">{t("settings.tabs.danger")}</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="em">{t("settings.emailLabel")}</Label>
                <div className="flex gap-2">
                  <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Button onClick={updateEmail} disabled={busy === "email" || email === user?.email}>
                    {busy === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("common.update")}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">{t("settings.newPassword")}</Label>
                <div className="flex gap-2">
                  <Input
                    id="pw"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Button onClick={updatePassword} disabled={busy === "password" || password.length < 6}>
                    {busy === "password" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("settings.change")}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl space-y-3">
              <Label>{t("settings.theme")}</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["dark", "light", "system"] as Theme[]).map((tName) => (
                  <Button
                    key={tName}
                    variant={theme === tName ? "default" : "outline"}
                    onClick={() => setTheme(tName)}
                  >
                    {t(`settings.themes.${tName}` as const)}
                  </Button>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl space-y-3">
              <Label>{t("settings.languageTitle")}</Label>
              <p className="text-xs text-muted-foreground">{t("settings.languageHint")}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={language === "en" ? "default" : "outline"}
                  onClick={() => setLanguage("en")}
                >
                  🇬🇧 {t("common.languageEN")}
                </Button>
                <Button
                  variant={language === "sk" ? "default" : "outline"}
                  onClick={() => setLanguage("sk")}
                >
                  🇸🇰 {t("common.languageSK")}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.emailNotifs")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.emailNotifsHint")}</p>
                </div>
                <Switch checked={emailNotif} onCheckedChange={saveNotifs} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">{t("settings.signOutAll")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.signOutAllHint")}</p>
                </div>
                <Button variant="outline" onClick={signOutEverywhere}>
                  <LogOut className="mr-2 h-4 w-4" /> {t("settings.signOutAllBtn")}
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-destructive">{t("settings.deleteAccount")}</p>
                  <p className="text-xs text-muted-foreground">{t("settings.deleteAccountHint")}</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> {t("common.delete")}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t("settings.deleteDialogTitle")}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t("settings.deleteDialogDesc")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} disabled={busy === "delete"}>
                        {busy === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t("settings.deleteConfirm")}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
