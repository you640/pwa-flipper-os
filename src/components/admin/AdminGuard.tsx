import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useProfile } from "@/hooks/useProfile";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useProfile();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAdmin) {
    toast.error(t("admin.unauthorized"));
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
}
