import {
	Bell,
	CreditCard,
	LogOut,
	Search,
	Settings as SettingsIcon,
	User as UserIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export function Topbar() {
	const navigate = useNavigate();
	const { t } = useTranslation();
	const { user, profile, isAdmin, displayName, initials } = useProfile();

	const handleSignOut = async () => {
		await supabase.auth.signOut();
		toast.success(t("topbar.signedOut"));
		navigate("/login", { replace: true });
	};

	const roleLabel = isAdmin ? t("common.admin") : t("common.member");

	return (
		<header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl md:px-6">
			<SidebarTrigger className="text-muted-foreground hover:text-foreground" />

			<div className="relative hidden flex-1 max-w-md md:block">
				<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder={t("topbar.searchPlaceholder")}
					className="h-10 w-full rounded-lg border border-border/60 bg-card/50 pl-9 pr-16 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/50 focus:bg-card"
				/>
				<kbd className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
					⌘K
				</kbd>
			</div>

			<div className="ml-auto flex items-center gap-2">
				<LanguageSwitcher />

				<Button
					variant="ghost"
					size="icon"
					className="relative text-muted-foreground hover:text-foreground"
				>
					<Bell className="h-4.5 w-4.5" />
					<span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary shadow-glow animate-pulse-glow" />
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							type="button"
							className="flex items-center gap-2.5 rounded-lg p-1 pr-3 transition-colors hover:bg-card/60"
						>
							<Avatar className="h-8 w-8 border border-border/60">
								<AvatarImage
									src={profile?.avatar_url ?? ""}
									alt={displayName}
								/>
								<AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">
									{initials}
								</AvatarFallback>
							</Avatar>
							<div className="hidden text-left leading-tight md:block">
								<div className="text-sm font-medium text-foreground truncate max-w-[140px]">
									{displayName}
								</div>
								<div className="text-[11px] text-muted-foreground">
									{roleLabel}
								</div>
							</div>
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-60">
						<DropdownMenuLabel>
							<div className="flex flex-col">
								<span className="text-sm font-medium text-foreground truncate">
									{displayName}
								</span>
								<span className="text-[11px] font-normal text-muted-foreground truncate">
									{user?.email}
								</span>
							</div>
						</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => navigate("/profile")}>
							<UserIcon className="mr-2 h-4 w-4" /> {t("topbar.profile")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => navigate("/billing")}>
							<CreditCard className="mr-2 h-4 w-4" /> {t("topbar.billing")}
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => navigate("/settings")}>
							<SettingsIcon className="mr-2 h-4 w-4" /> {t("topbar.settings")}
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem
							onClick={handleSignOut}
							className="text-destructive focus:text-destructive"
						>
							<LogOut className="mr-2 h-4 w-4" />
							{t("topbar.signOut")}
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
