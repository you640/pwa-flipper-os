import { useProfile } from "@/hooks/useProfile";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";

export function AdminGuard({ children }: { children: ReactNode }) {
	const { isAdmin, loading } = useProfile();
	const { t } = useTranslation();

	useEffect(() => {
		if (!loading && !isAdmin) {
			toast.error(t("admin.unauthorized"));
		}
	}, [loading, isAdmin, t]);

	if (loading) {
		return (
			<div className="flex min-h-screen w-full items-center justify-center bg-background">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}
	if (!isAdmin) {
		return <Navigate to="/dashboard" replace />;
	}
	return <>{children}</>;
}
