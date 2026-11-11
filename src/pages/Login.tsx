import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo/SEO";
import { motion } from "framer-motion";
import logo from "@/assets/rubberduck-logo.png";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const requested = location.state?.from;
  const destination = typeof requested?.pathname === "string" && requested.pathname.startsWith("/") && !requested.pathname.startsWith("//") && requested.pathname !== "/login"
    ? requested.pathname + (requested.search || "") + (requested.hash || "") : "/dashboard";
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">(() => new URLSearchParams(location.search).get("signup") === "1" ? "signup" : "signin");

  useEffect(() => {
    let active = true;
    const completeSignIn = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active || error || !data.user) return;
      const saved = sessionStorage.getItem("google-sign-in-destination");
      sessionStorage.removeItem("google-sign-in-destination");
      const target = saved?.startsWith("/") && !saved.startsWith("//") && !saved.includes("\\") && saved.split(/[?#]/)[0] !== "/login" ? saved : destination;
      navigate(target, { replace: true });
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void Promise.resolve().then(completeSignIn).catch(() => {});
    });
    void completeSignIn().catch(() => {});
    return () => { active = false; subscription.unsubscribe(); };
  }, [navigate, destination]);

  const handleGoogleSignIn = async () => {
    if (loading || googleLoading) return;
    setGoogleLoading(true);
    try {
      sessionStorage.setItem("google-sign-in-destination", destination);
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: `${window.location.origin}/login`,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      // The auth listener navigates only after the returned session is validated.
    } catch {
      sessionStorage.removeItem("google-sign-in-destination");
      toast.error(t("auth.googleFailed"));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(t("auth.welcomeBack"));
        navigate(destination, { replace: true });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success(t("auth.accountCreated"));
        navigate(destination, { replace: true });
      }
    } catch (caught: unknown) {
      const err = caught instanceof Error ? caught as Error & { statusCode?: number; status?: number } : new Error("Unknown error");
      toast.error(err?.message ?? t("auth.authFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <SEO title={t("seo.loginTitle")} description={t("seo.loginDesc")} />
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px]" />
      </div>

      <div className="relative flex min-h-screen items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="mb-8 flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="relative mb-4"
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-primary blur-2xl opacity-60 animate-pulse-glow" />
              <img
                src={logo}
                alt="RUBBERDUCK.SPACE"
                className="relative h-20 w-20 rounded-3xl object-cover shadow-glow"
              />
            </motion.div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t("auth.title")}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("auth.subtitle")}
            </p>
          </div>

          <div className="relative rounded-2xl border border-border/60 bg-card/40 p-8 backdrop-blur-2xl shadow-2xl">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/[0.04] to-transparent pointer-events-none" />

            <Tabs value={mode} onValueChange={(v) => setMode(v as "signin" | "signup")} className="relative">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
                <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
              </TabsList>

              <TabsContent value={mode} className="mt-0">
                <Button type="button" variant="google" onClick={handleGoogleSignIn} disabled={loading || googleLoading} className="mb-5 h-11 w-full gap-2.5 px-3 text-sm leading-5 [&_svg]:size-[18px]" aria-busy={googleLoading}>
                  <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"/><path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"/><path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/></svg>
                  {googleLoading ? t("common.pleaseWait") : t("auth.continueWithGoogle")}
                </Button>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("auth.email")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("auth.emailPlaceholder")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("auth.password")}</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      className="bg-background/50"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="relative w-full h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
                  >
                    {loading ? t("common.pleaseWait") : mode === "signin" ? t("auth.signIn") : t("auth.createAccount")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          <Link to="/reset-password" className="mt-4 block text-center text-sm underline">{t("recovery.title")}</Link>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("auth.securedBy")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
