import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useSidebar } from "@/components/ui/sidebar";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPWA() {
	const { state } = useSidebar();
	const { t } = useTranslation();
	const collapsed = state === "collapsed";
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [installed, setInstalled] = useState(false);

	useEffect(() => {
		const handler = (e: Event) => {
			e.preventDefault();
			setDeferredPrompt(e as BeforeInstallPromptEvent);
		};
		const installedHandler = () => {
			setInstalled(true);
			setDeferredPrompt(null);
			toast.success(t("sidebar.installed"));
		};

		window.addEventListener("beforeinstallprompt", handler);
		window.addEventListener("appinstalled", installedHandler);

		// Detect if already running standalone
		if (window.matchMedia("(display-mode: standalone)").matches) {
			setInstalled(true);
		}

		return () => {
			window.removeEventListener("beforeinstallprompt", handler);
			window.removeEventListener("appinstalled", installedHandler);
		};
	}, [t]);

	const handleInstall = async () => {
		if (!deferredPrompt) {
			toast.info(t("sidebar.installInstruction"));
			return;
		}
		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;
		if (outcome === "accepted") {
			toast.success(t("sidebar.installing"));
		}
		setDeferredPrompt(null);
	};

	if (installed) return null;
	if (!deferredPrompt) return null;

	return (
		<Button
			onClick={handleInstall}
			size={collapsed ? "icon" : "default"}
			className="relative w-full overflow-hidden bg-gradient-primary text-primary-foreground shadow-glow transition-all hover:shadow-[0_0_30px_hsl(var(--primary)/0.6)]"
		>
			<span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2.5s_infinite]" />
			<Download className="h-4 w-4" />
			{!collapsed && <span>{t("sidebar.installApp")}</span>}
		</Button>
	);
}
