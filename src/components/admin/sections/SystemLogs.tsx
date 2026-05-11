import { useTranslation } from "react-i18next";
import { UserPlus, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/hooks/useLocale";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type UploadErr = Database["public"]["Tables"]["avatar_upload_errors"]["Row"];

function relTime(intlLocale: string, date: string) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto" });
  if (diff < 60) return rtf.format(-Math.round(diff), "second");
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), "minute");
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), "hour");
  return rtf.format(-Math.round(diff / 86400), "day");
}

export function SystemLogs({
  users,
  uploadErrors,
}: {
  users: Profile[];
  uploadErrors: UploadErr[];
}) {
  const { t } = useTranslation();
  const { intlLocale } = useLocale();
  const recent = users.slice(0, 10);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="glass p-5 shadow-elegant">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserPlus className="h-4 w-4 text-primary" />
          {t("admin.logs.recentSignups")}
        </h3>
        <div className="mt-4 space-y-2">
          {recent.length === 0 ? (
            <div className="text-xs text-muted-foreground">{t("admin.logs.empty")}</div>
          ) : (
            recent.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-md border border-border/40 bg-card/30 px-3 py-2 text-sm"
              >
                <span className="font-medium text-foreground">
                  {u.display_name ?? u.id.slice(0, 8)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {relTime(intlLocale, u.created_at)}
                </span>
              </div>
            ))
          )}
        </div>
      </Card>
      <Card className="glass p-5 shadow-elegant">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <AlertTriangle className="h-4 w-4 text-warning" />
          {t("admin.logs.uploadErrors")}
        </h3>
        <div className="mt-4 space-y-2">
          {uploadErrors.length === 0 ? (
            <div className="text-xs text-muted-foreground">{t("admin.logs.empty")}</div>
          ) : (
            uploadErrors.map((e) => (
              <div
                key={e.id}
                className="rounded-md border border-border/40 bg-card/30 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{e.reason}</span>
                  <span className="text-xs text-muted-foreground">
                    {relTime(intlLocale, e.created_at)}
                  </span>
                </div>
                {e.error_message && (
                  <div className="mt-0.5 text-xs text-muted-foreground truncate">
                    {e.error_message}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
