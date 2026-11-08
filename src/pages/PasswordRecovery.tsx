import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PasswordRecovery() {
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      receivedEvent = true;
      if (active) { setHasSession(!!session); setChecking(false); }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (active && !receivedEvent) { setHasSession(!!data.session); setChecking(false); }
    }).catch(() => { if (active && !receivedEvent) { setChecking(false); setMessage(t("recovery.failed")); } });
    return () => { active = false; data.subscription.unsubscribe(); };
  }, [t]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setMessage("");
    if (hasSession && (password.length < 12 || password !== confirmation)) {
      setMessage(t("recovery.passwordRule")); return;
    }
    setBusy(true);
    try {
      if (hasSession) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setPassword(""); setConfirmation(""); setMessage(t("recovery.updated"));
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        // Same message regardless of whether the address exists.
        setMessage(t("recovery.sent"));
      }
    } catch { setMessage(t("recovery.failed")); }
    finally { setBusy(false); }
  };
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <section className="w-full max-w-md space-y-4 rounded-xl border border-border p-6">
        <h1 className="text-xl font-semibold">{t("recovery.title")}</h1>
        {checking ? <p role="status">{t("common.pleaseWait")}</p> : <form onSubmit={submit} className="space-y-4">
          {hasSession ? <>
            <Label htmlFor="recovery-password">{t("recovery.newPassword")}</Label>
            <Input id="recovery-password" type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} minLength={12} required />
            <Label htmlFor="recovery-confirm">{t("recovery.confirm")}</Label>
            <Input id="recovery-confirm" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} minLength={12} required />
          </> : <>
            <Label htmlFor="recovery-email">{t("auth.email")}</Label>
            <Input id="recovery-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </>}
          <Button type="submit" disabled={busy}>{busy ? t("common.pleaseWait") : t(hasSession ? "recovery.save" : "recovery.send")}</Button>
        </form>}
        {message && <p role="status">{message}</p>}
        <Link className="block underline" to="/login">{t("auth.signIn")}</Link>
      </section>
    </main>
  );
}
