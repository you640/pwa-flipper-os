// biome-ignore assist/source/organizeImports: custom import order for shadcn components
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AdminGuard } from "./components/admin/AdminGuard.tsx";
import { AuthGuard } from "./components/auth/AuthGuard.tsx";
import Landing from "./pages/Landing.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy-loaded pages
const Admin = lazy(() => import("./pages/Admin.tsx"));
const Billing = lazy(() => import("./pages/Billing.tsx"));
const CRM = lazy(() => import("./pages/CRM.tsx"));
const DealRoom = lazy(() => import("./pages/DealRoom.tsx"));
const Docs = lazy(() => import("./pages/Docs.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const Market = lazy(() => import("./pages/Market.tsx"));
const Portfolio = lazy(() => import("./pages/Portfolio.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Valuation = lazy(() => import("./pages/Valuation.tsx"));

// Simple loading fallback
const PageLoader = () => (
	<div className="flex h-screen w-full items-center justify-center bg-background">
		<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
	</div>
);

const queryClient = new QueryClient();

const App = () => {
	const { i18n } = useTranslation();

	useEffect(() => {
		document.documentElement.lang = i18n.language?.startsWith("sk")
			? "sk"
			: "en";
		const handler = (lng: string) => {
			document.documentElement.lang = lng?.startsWith("sk") ? "sk" : "en";
		};
		i18n.on("languageChanged", handler);
		return () => i18n.off("languageChanged", handler);
	}, [i18n]);

	useEffect(() => {
		const sync = async (uid: string) => {
			const { data } = await supabase
				.from("profiles")
				.select("locale")
				.eq("id", uid)
				.maybeSingle();
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
						<Suspense fallback={<PageLoader />}>
							<Routes>
								{/* PUBLIC routes (no auth required) */}
								<Route path="/" element={<Landing />} />
								<Route path="/deals" element={<DealRoom />} />
								<Route path="/login" element={<Login />} />

								{/* AUTH-GATED routes */}
								<Route
									path="/*"
									element={
										<AuthGuard>
											<Routes>
												<Route path="/dashboard" element={<Index />} />
												<Route path="/portfolio" element={<Portfolio />} />
												<Route path="/valuation" element={<Valuation />} />
												<Route path="/market" element={<Market />} />
												<Route path="/crm" element={<CRM />} />
												<Route path="/profile" element={<Profile />} />
												<Route path="/settings" element={<Settings />} />
												<Route path="/billing" element={<Billing />} />
												<Route path="/docs" element={<Docs />} />
												<Route
													path="/admin-panel"
													element={
														<AdminGuard>
															<Admin />
														</AdminGuard>
													}
												/>
												<Route
													path="/admin"
													element={
														<AdminGuard>
															<Admin />
														</AdminGuard>
													}
												/>
												{/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
												<Route path="*" element={<NotFound />} />
											</Routes>
										</AuthGuard>
									}
								/>
							</Routes>
						</Suspense>
					</BrowserRouter>
				</TooltipProvider>
			</QueryClientProvider>
		</HelmetProvider>
	);
};

export default App;
