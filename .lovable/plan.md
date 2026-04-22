

# Rebrand to RUBBERDUCK.SPACE + 3 new Docs features

Four bundled changes: full app rebrand, prefilled "Contact support" action, localized Changelog tab, and "Download as PDF" for User Manual + FAQ — with proper Slovak diacritics support in the PDFs.

## What you'll get

**1. Rebrand: Flipper OS → RUBBERDUCK.SPACE**
- Replace every visible "Flipper OS", "FlippOS", "PWA Flipper" string with **RUBBERDUCK.SPACE** across:
  - `index.html` — `<title>`, `meta description`, `meta author`, `apple-mobile-web-app-title`, OG/Twitter tags.
  - `vite.config.ts` — PWA manifest `name` ("RUBBERDUCK.SPACE"), `short_name` ("Rubberduck"), description.
  - `src/i18n/locales/en.ts` and `sk.ts` — `auth.title`, `sidebar.brand`, `sidebar.installing`, all `seo.*` titles, `docs.subtitle/seoTitle/seoDesc`, manual step 4, FAQ items 6–7, About mission, CEO header.
- All support email refs → **support@rubberduck.space**. Web link → `https://rubberduck.space`.
- Presentation-only change. No DB, auth, or domain config touched.

**2. Contact Support — prefilled email**
- Replace the static `mailto:` anchor in About & Contact with a **"Contact support"** primary Button.
- Click builds a `mailto:` URL with `encodeURIComponent`:
  - **to**: `support@rubberduck.space`
  - **subject** (localized): `[RUBBERDUCK.SPACE] Support — {displayName}`
  - **body** (localized template) prefilled from `useProfile()` + `useLocale()`:
    ```
    Hello RUBBERDUCK.SPACE team,

    — Account ID: {user.id}
    — Email: {user.email}
    — Display name: {profile.display_name}
    — Locale: {i18n.language}
    — Page: /docs

    Describe your issue below:
    ```
- Fallback: when `user` is null, profile lines are omitted but subject/body still prefill.
- Plain email text stays visible below the button so users can copy it manually.

**3. New "Changelog" tab in Docs**
- Add a 5th tab between **FAQ** and **CEO**. `TabsList` becomes `grid-cols-2 sm:grid-cols-5`.
- Label: `t("docs.tabs.changelog")` ("Changelog" / "Zmeny").
- Vertical timeline of glass cards (newest first). Each card shows:
  - `Calendar` icon + locale-formatted date (`useLocale().formatDate`)
  - Version `Badge` (e.g. `v1.3.0`)
  - Title + bulleted highlights, each prefixed with `Sparkles` / `Zap` / `Bug` icon.
- Seed 4 entries: **v1.3.0** Rebrand to RUBBERDUCK.SPACE, **v1.2.0** Docs Center, **v1.1.0** Industry News upgrade, **v1.0.0** Launch. Stored under `docs.changelog.entries.{1..4}.{version,date,title,highlights}` so EN/SK stay in sync via the `Translations` type.

**4. "Download as PDF" for User Manual & FAQ**
- Ghost `Button` with `Download` icon at the top-right of the Manual and FAQ tab panels: `t("docs.downloadPdf")`.
- Client-side PDF using **jsPDF**. Helper `src/lib/exportDocsPdf.ts` exports `exportManualPdf(t, locale)` and `exportFaqPdf(t, locale)`:
  - Header: "RUBBERDUCK.SPACE — User Manual / FAQ", date, footer with page numbers.
  - Manual: 4 numbered steps (title, description, tip).
  - FAQ: 8 Q/A pairs (Q bold, A wrapped via `doc.splitTextToSize`).
  - Filenames: `rubberduck-manual-{lang}.pdf`, `rubberduck-faq-{lang}.pdf`.
- Toast confirms success / failure (`t("docs.downloadSuccess")` / `t("docs.downloadFailed")`).

**Important — Slovak diacritics in jsPDF**
Standard jsPDF fonts (Helvetica/Arial) do not support Central European characters (ľ, š, č, ť, ž, ý, á, í, ô, ä). Generated SK PDFs would render empty boxes.
Fix: bundle a lightweight UTF-8 font (Roboto Regular + Bold, ~80 KB each, base64) under `src/assets/fonts/` and register it in the helper before drawing any text:
```ts
import RobotoRegular from "@/assets/fonts/Roboto-Regular-base64";
doc.addFileToVFS("Roboto-Regular.ttf", RobotoRegular);
doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
doc.setFont("Roboto", "normal");
```
Both EN and SK PDFs will use Roboto so output is consistent and all Slovak accents render correctly. Font loading is lazy — only when a download is triggered, so it doesn't bloat the app bundle.

## Technical details

**Files edited**
- `index.html` — brand strings & meta tags.
- `vite.config.ts` — PWA manifest name/short_name/description.
- `src/i18n/locales/en.ts` + `src/i18n/locales/sk.ts` — rebrand all strings; add `docs.tabs.changelog`, `docs.changelog.{title,subtitle,entries.*}`, `docs.contact.{button,subject,bodyTemplate}`, `docs.downloadPdf`, `docs.downloadSuccess`, `docs.downloadFailed`. SK stays type-safe via the `Translations` shape from EN.
- `src/pages/Docs.tsx` — add Changelog tab, Download buttons + handlers, replace mailto anchor with prefilled Contact Support button, widen `TabsList` to 5 cols on `sm+`.

**Files created**
- `src/lib/exportDocsPdf.ts` — `exportManualPdf` / `exportFaqPdf` with lazy font loader.
- `src/assets/fonts/Roboto-Regular-base64.ts` + `Roboto-Bold-base64.ts` — base64-encoded TTFs (Apache 2.0 licensed) re-exported as `default` strings.

**Dependencies**
- Add `jspdf` (~50 KB gz, no peer deps). No `jspdf-autotable` needed — manual layout.

**Out of scope**
- No backend, RLS, schema, or auth-config changes.
- No DNS / mailbox setup — `support@rubberduck.space` is just a string until MX is configured.
- Logo / favicon assets unchanged (still `/icons/icon-192.png`); image rebrand is a follow-up.

