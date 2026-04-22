import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ComingSoon from "./pages/ComingSoon.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Valuation from "./pages/Valuation.tsx";
import Market from "./pages/Market.tsx";
import CRM from "./pages/CRM.tsx";
import Login from "./pages/Login.tsx";
import Profile from "./pages/Profile.tsx";
import Settings from "./pages/Settings.tsx";
import Billing from "./pages/Billing.tsx";
import { AuthGuard } from "./components/auth/AuthGuard.tsx";

const queryClient = new QueryClient();

const App = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = i18n.language?.startsWith("sk") ? "sk" : "en";
    const handler = (lng: string) => {
      document.documentElement.lang = lng?.startsWith("sk") ? "sk" : "en";
    };
    i18n.on("languageChanged", handler);
    return () => i18n.off("languageChanged", handler);
  }, [i18n]);

  // Sync language from user profile once signed in (one-shot on session)
  useEffect(() => {
    const sync = async (uid: string) => {
      const { data } = await supabase.from("profiles").select("locale").eq("id", uid).maybeSingle();
      const profileLng = (data as { locale?: string } | null)?.locale;
      if (profileLng && profileLng !== i18n.language) {
        void i18n.changeLanguage(profileLng);
      }
    };
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) void sync(data.session.user.id);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s?.user) setTimeout(() => void sync(s.user.id), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, [i18n]);

  return (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <AuthGuard>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/valuation" element={<Valuation />} />
                    <Route path="/market" element={<Market />} />
                    <Route path="/crm" element={<CRM />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/billing" element={<Billing />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AuthGuard>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
};

export default App;
