import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
    toast.success("Confirmation email sent to the new address");
  };

  const updatePassword = async () => {
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    setBusy("password");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(null);
    if (error) return toast.error(error.message);
    setPassword("");
    toast.success("Password updated");
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
      toast.error("Could not save preference");
    } else {
      refresh();
    }
  };

  const signOutEverywhere = async () => {
    await supabase.auth.signOut({ scope: "global" });
    toast.success("Signed out from all devices");
    navigate("/login", { replace: true });
  };

  const deleteAccount = async () => {
    setBusy("delete");
    const { error } = await supabase.functions.invoke("delete-account");
    setBusy(null);
    if (error) return toast.error("Could not delete account");
    await supabase.auth.signOut();
    toast.success("Account deleted");
    navigate("/login", { replace: true });
  };

  return (
    <AppLayout>
      <SEO title="Settings | Flipper OS" description="Manage account, security, appearance and notification preferences." />

      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Tune your account, appearance, and notifications.</p>
        </div>

        <Tabs defaultValue="account" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="notifications">Alerts</TabsTrigger>
            <TabsTrigger value="danger">Danger</TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="em">Email address</Label>
                <div className="flex gap-2">
                  <Input id="em" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <Button onClick={updateEmail} disabled={busy === "email" || email === user?.email}>
                    {busy === "email" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw">New password</Label>
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
                    Change
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl space-y-3">
              <Label>Theme</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["dark", "light", "system"] as Theme[]).map((t) => (
                  <Button
                    key={t}
                    variant={theme === t ? "default" : "outline"}
                    onClick={() => setTheme(t)}
                    className="capitalize"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="mt-6">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Email notifications</p>
                  <p className="text-xs text-muted-foreground">Deal alerts, weekly portfolio summary, lead updates.</p>
                </div>
                <Switch checked={emailNotif} onCheckedChange={saveNotifs} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Sign out everywhere</p>
                  <p className="text-xs text-muted-foreground">Ends all active sessions across devices.</p>
                </div>
                <Button variant="outline" onClick={signOutEverywhere}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out all
                </Button>
              </div>
            </div>
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-destructive">Delete account</p>
                  <p className="text-xs text-muted-foreground">Permanently removes your account and all data.</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This is permanent. Your portfolio, leads, market intel and profile will be erased.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} disabled={busy === "delete"}>
                        {busy === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Yes, delete
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
