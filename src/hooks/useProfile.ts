import { useEffect, useState, useCallback } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export function useProfile() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadExtras = useCallback(async (uid: string) => {
    try {
      const [profRes, roleRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle(),
      ]);
      if (profRes.error) {
        console.warn("[useProfile] profile load failed:", profRes.error.message);
        setProfile(null);
      } else {
        setProfile((profRes.data as Profile) ?? null);
      }
      if (roleRes.error) {
        console.warn("[useProfile] role load failed:", roleRes.error.message);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!roleRes.data);
      }
    } catch (e) {
      console.warn("[useProfile] loadExtras threw:", e);
      setProfile(null);
      setIsAdmin(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (user?.id) await loadExtras(user.id);
  }, [user?.id, loadExtras]);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        setTimeout(() => loadExtras(s.user.id), 0);
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) await loadExtras(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, [loadExtras]);

  const displayName =
    profile?.display_name?.trim() ||
    user?.email?.split("@")[0] ||
    "Account";

  const initials = (displayName || "U")
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return { session, user, profile, isAdmin, loading, displayName, initials, refresh };
}
