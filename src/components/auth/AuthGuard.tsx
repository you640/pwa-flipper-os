import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function AuthGuard({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    let active = true;
    let receivedEvent = false;
    // Set listener FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      receivedEvent = true;
      if (active) { setSession(newSession); setChecking(false); }
    });

    // THEN load existing session
    supabase.auth.getSession().then(({ data }) => {
      if (active && !receivedEvent) { setSession(data.session); setChecking(false); }
    }).catch(() => { if (active && !receivedEvent) { setSession(null); setChecking(false); } });

    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  if (checking) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t("common.workspaceLoading")}</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
