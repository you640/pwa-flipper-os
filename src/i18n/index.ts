import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en";
import sk from "./locales/sk";

export const SUPPORTED_LANGUAGES = ["en", "sk"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      sk: { translation: sk },
    },
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
      // map any sk-* to "sk", everything else falls back to "en"
      convertDetectedLanguage: (lng: string) =>
        lng?.toLowerCase().startsWith("sk") ? "sk" : "en",
    },
  });

export default i18n;
