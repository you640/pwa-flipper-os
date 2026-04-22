

# Slovak Localization + EN/SK Switcher

Translate the entire app to Slovak as the default and add an EN/SK language switcher. Language is auto-detected from the user's browser/region on first visit, then remembered and synced to their profile when signed in.

## What you'll get

**1. Auto language detection**
- First-time visitors with browser locale `sk-*` see the app in Slovak; everyone else gets English.
- Detected language is saved to `localStorage` so subsequent visits are instant.
- Signed-in users get their language persisted to their profile and synced across devices.

**2. EN / SK switcher in the Topbar**
- Compact toggle (🇬🇧 EN / 🇸🇰 SK) next to the notification bell.
- Also exposed in `Settings → Appearance` as a labeled "Language / Jazyk" selector.
- Switching is instant — no reload — and updates `<html lang="…">` for SEO and screen readers.

**3. Full Slovak translation coverage**
Every user-facing string across the app:
- Sidebar (Overview → Prehľad, Portfolio Kanban → Portfólio Kanban, Valuation Engine → Oceňovací nástroj, Market Intel → Trhové dáta, Buyer CRM → CRM kupujúcich, Settings → Nastavenia)
- Topbar (search placeholder, Profile/Billing/Settings/Sign out menu, role labels)
- Auth / Login (sign in, sign up, Google, validation messages, toasts)
- Dashboard / Index (metric cards, activity feed, industry news, projection chart)
- Portfolio Kanban (column names, card actions, empty states)
- Valuation Engine (form labels, results, tooltips)
- Market Intel (filters, table headers, chart legends)
- CRM (pipeline stages, lead form, pitch generator)
- Profile, Settings, Billing pages (tabs, labels, danger zone, all toasts)
- Common UI: confirm dialogs, error toasts, "Loading…", empty states, NotFound, ComingSoon
- SEO `<title>` / `<description>` per page (localized)

**4. Number, date & currency formatting**
- Dates rendered via `Intl.DateTimeFormat` with the active locale (`sk-SK` / `en-US`).
- Currency stays EUR but formatted per locale (e.g. `1 250,00 €` in SK vs `€1,250.00` in EN).

## Technical approach

**Library:** `react-i18next` + `i18next` + `i18next-browser-languagedetector`. Industry standard, tiny bundle, supports interpolation and plurals. No backend needed — translations bundled.

**Structure (consolidated to avoid token limits):**
```text
src/i18n/
  index.ts                  // i18n init + detector config
  locales/
    en.ts                   // single export with all namespaces (common, auth, dashboard, portfolio, valuation, market, crm, profile, settings, billing, seo)
    sk.ts                   // mirror of en.ts in Slovak
src/components/LanguageSwitcher.tsx
src/hooks/useLocale.ts       // wraps useTranslation + Intl formatters (date, currency, number)
```

Using `.ts` modules (not JSON) lets us use TS typing for keys and keeps both locales in two files total, well within a single generation pass.

**Detection order** (configured in `i18next-browser-languagedetector`):
1. `localStorage` key `lang`
2. User profile column `profiles.locale` once session loads
3. `navigator.language` → `sk*` maps to `sk`, everything else to `en`

**Database:** migration adds `locale text default 'en'` to `public.profiles`; existing rows backfilled to `en`. The switcher updates this column for signed-in users so the choice follows them across devices.

**App wiring:**
- `src/main.tsx` imports `./i18n` before `<App />` renders.
- `App.tsx` syncs `<html lang>` whenever the language changes.
- `Topbar.tsx` renders `<LanguageSwitcher />` next to the bell.
- `Settings.tsx` Appearance tab gets a Language section.
- `SEO.tsx` reads localized title/description from the `seo` namespace.
- All hardcoded strings across pages/components replaced with `t('namespace.key')`.

**Files**
- Created: `src/i18n/index.ts`, `src/i18n/locales/en.ts`, `src/i18n/locales/sk.ts`, `src/components/LanguageSwitcher.tsx`, `src/hooks/useLocale.ts`, migration adding `profiles.locale`.
- Edited: `src/main.tsx`, `src/App.tsx`, `src/components/seo/SEO.tsx`, `src/components/layout/Topbar.tsx`, `src/components/layout/AppSidebar.tsx`, `src/components/layout/InstallPWA.tsx`, all pages in `src/pages/`, dashboard widgets in `src/components/dashboard/`, kanban components in `src/components/kanban/`, `src/components/auth/AuthGuard.tsx`, `index.html` (default `<html lang="sk">`).

