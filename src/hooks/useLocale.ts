import type { SupportedLanguage } from "@/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

export function useLocale() {
	const { i18n, t } = useTranslation();

	const language = (
		i18n.language?.startsWith("sk") ? "sk" : "en"
	) as SupportedLanguage;
	const intlLocale = language === "sk" ? "sk-SK" : "en-US";

	const setLanguage = useCallback(
		async (lng: SupportedLanguage) => {
			await i18n.changeLanguage(lng);
			try {
				localStorage.setItem("lang", lng);
			} catch {
				/* ignore */
			}
			document.documentElement.lang = lng;
			// Persist for signed-in user
			try {
				const { data } = await supabase.auth.getUser();
				if (data.user) {
					const { error } = await supabase
						.from("profiles")
						.update({ locale: lng })
						.eq("id", data.user.id);

					if (error) {
						console.warn("Failed to sync locale to profile:", error);
						toast.error(t("settings.localeUpdateFailed") ?? "Failed to save language preference");
					}
				}
			} catch (err) {
				console.warn("Failed to sync locale:", err);
			}
		},
		[i18n, t],
	);

	const formatCurrency = useCallback(
		(n: number, currency = "EUR") =>
			new Intl.NumberFormat(intlLocale, {
				style: "currency",
				currency,
				maximumFractionDigits: 0,
			}).format(n),
		[intlLocale],
	);

	const formatNumber = useCallback(
		(n: number) => new Intl.NumberFormat(intlLocale).format(n),
		[intlLocale],
	);

	const formatDate = useCallback(
		(d: Date | string | number, opts?: Intl.DateTimeFormatOptions) =>
			new Intl.DateTimeFormat(intlLocale, opts).format(new Date(d)),
		[intlLocale],
	);

	return {
		t,
		i18n,
		language,
		intlLocale,
		setLanguage,
		formatCurrency,
		formatNumber,
		formatDate,
	};
}
