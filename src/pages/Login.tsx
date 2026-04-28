import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import logo from "@/assets/rubberduck-logo.png";
import { SEO } from "@/components/seo/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export default function Login() {
	const navigate = useNavigate();
	const location = useLocation();
	const { t } = useTranslation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [mode, setMode] = useState<"signin" | "signup">("signin");

	// Determine redirect destination: preserve intended route or default to dashboard
	const redirectTo = (location.state as { from?: { pathname?: string } })?.from?.pathname ?? "/dashboard";

	useEffect(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (data.session) navigate(redirectTo, { replace: true });
		});
	}, [navigate, redirectTo]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		try {
			if (mode === "signin") {
				const { error } = await supabase.auth.signInWithPassword({
					email,
					password,
				});
				if (error) throw error;
				toast.success(t("auth.welcomeBack"));
				navigate(redirectTo, { replace: true });
			} else {
				const { error } = await supabase.auth.signUp({
					email,
					password,
					options: { emailRedirectTo: `${window.location.origin}${redirectTo}` },
				});
				if (error) throw error;
				toast.success(t("auth.accountCreated"));
				navigate(redirectTo, { replace: true });
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : t("auth.authFailed"));
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

						<Tabs
							value={mode}
							onValueChange={(v) => setMode(v as "signin" | "signup")}
							className="relative"
						>
							<TabsList className="grid w-full grid-cols-2 mb-6">
								<TabsTrigger value="signin">{t("auth.signIn")}</TabsTrigger>
								<TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
							</TabsList>

							<TabsContent value={mode} className="mt-0">
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
											autoComplete={
												mode === "signin" ? "current-password" : "new-password"
											}
											className="bg-background/50"
										/>
									</div>
									<Button
										type="submit"
										disabled={loading}
										className="relative w-full h-11 bg-gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
									>
										{loading
											? t("common.pleaseWait")
											: mode === "signin"
												? t("auth.signIn")
												: t("auth.createAccount")}
									</Button>
								</form>

								<div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
									<span className="h-px flex-1 bg-border/60" />
									{t("auth.or") ?? "or"}
									<span className="h-px flex-1 bg-border/60" />
								</div>

								<Button
									type="button"
									variant="outline"
									disabled={googleLoading}
									onClick={async () => {
										setGoogleLoading(true);
										const result = await lovable.auth.signInWithOAuth(
											"google",
											{
												redirect_uri: window.location.origin,
											},
										);
										if (result.error) {
											toast.error(
												(result.error as Error)?.message ??
												t("auth.authFailed"),
											);
											setGoogleLoading(false);
											return;
										}
										if (result.redirected) return;
										navigate(redirectTo, { replace: true });
									}}
									className="w-full h-11"
								>
									<svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden>
										<title>Google</title>
										<path
											fill="#EA4335"
											d="M12 10.2v3.9h5.5c-.24 1.5-1.74 4.4-5.5 4.4-3.31 0-6-2.74-6-6.1S8.69 6.3 12 6.3c1.88 0 3.14.8 3.86 1.5l2.64-2.55C16.94 3.74 14.7 2.8 12 2.8 6.96 2.8 2.9 6.86 2.9 11.9S6.96 21 12 21c6.93 0 9.16-4.86 9.16-7.74 0-.52-.05-.92-.13-1.32H12z"
										/>
									</svg>
									{googleLoading
										? t("common.pleaseWait")
										: (t("auth.continueGoogle") ?? "Continue with Google")}
								</Button>
							</TabsContent>
						</Tabs>
					</div>

					<p className="mt-6 text-center text-xs text-muted-foreground">
						{t("auth.securedBy")}
					</p>
				</motion.div>
			</div>
		</div>
	);
}
