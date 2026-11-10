> Historický audit pred ďalšími opravami. Aktuálny stav je v ../production-readiness.md.

# Produkčná pripravenosť — 2026-11-06

**Verdikt: NOT READY.** Lokálny audit nad základom `1d8b606f9dbcb081314833774d1a9380ba8b5521` a necommitnutými zmenami v tomto pracovnom strome. Žiadne nasadenie ani zmeny produkčných dát neboli vykonané. Toto nie je potvrdenie bezpečnosti živého backendu.

## Rozsah a dôkazy

React SPA pre správu portfólia, trhových ponúk, CRM a AI ocenenia. Supabase zabezpečuje identitu, RLS, storage a Edge Functions. Platobná obrazovka zatiaľ nemá checkout handler; outreach vytvára návrh, neposiela e-mail. ComingSoon.tsx nie je samostatná routa. Landing page volá anonymné AI ocenenie.

Dôkazy sú v `docs/evidence/`. Súbory `baseline-*` zachytávajú prvé spustenie kontrol po počiatočných opravách, nie nedotknutý pôvodný commit. Pôvodné `npm ci` zlyhalo na EUSAGE: package-lock nemal viaceré závislosti z package.json. Pôvodný lint: 27 errors a 9 warnings. Prvých 10 testov zahŕňalo šesť nových testov statusov a jeden existujúci triviálny placeholder. Finálne výsledky sú v `lint.log`, `typecheck.log`, `test.log`, `build.log`, `clean-install.log`. Offline install výrok „0 vulnerabilities“ nie je bezpečnostný audit; platí online `npm-audit.json`.

## Implementované opravy

- Zosúladený npm lockfile, npm zvolený pre lokálne overenie a CI. Bun locky zostávajú historické, nepoužívať ich na release. Cielená kompatibilná aktualizácia Vite, Router a PostCSS; nie hromadné audit fix --force.
- Samostatná typová kontrola aplikácie, Vite, Vitest, Tailwind a Drizzle konfigurácie; opravených 27 lint chýb bez vypnutia pravidiel. Existujúce Fast Refresh upozornenia sú priznané.
- AuthGuard fail-closed pri chybe relácie, ochrana pred obnovením zastaranej relácie po udalosti odhlásenia a cleanup listenera. Štyri regresné testy.
- Login rešpektuje pôvodne otvorenú internú cestu a `?signup=1` namiesto návratu na landing. Nie je to implementácia resetu zabudnutého hesla.
- Legacy `For Sale` sa mapuje na `Listed`, neznámy status už nezrúti Kanban. Pri drag operácii sa uchováva pôvodný snapshot a obnovuje pri zrušení. Databázový zápis už nebeží v React state updateri.
- Portfolio a súhrn dashboardu filtrujú vlastníka aj pri existencii verejne čitateľných ponúk. Toto nenahrádza serverové RLS.
- Všetky Edge handlery odmietajú nepodporované metódy. AI handlery vracajú 400 pre neplatné JSON vstupy po príslušnom auth kroku; interné chyby a upstream odpovede sa nevracajú klientovi. Outreach vyžaduje vlastníctvo leadu aj portfólia, validuje formát AI odpovede. Valuation validuje polia, rozsahy a poradie ocenenia.
- AI upstream má timeout, klientské AbortController sú konečne pripojené k invoke. Opravené čítanie HTTP statusu FunctionsHttpError.
- Anonymné ocenenie nepokračuje pri chybe čítania/zápisu pokusov. Súbežnosť limitu ostáva nevyriešená, pozri R2.
- Lazy načítavanie stránok, CI, .env.example, gitignore pre budúce environment súbory. Existujúci tracked .env zostáva zachovaný; kontrola našla konfiguráciu a verejný JWT s rolou anon, nie service_role. Hodnoty sa nevypisovali do dôkazov.

## Zostávajúce nálezy a release blokéry

| ID | Závažnosť | Dôkaz / dopad | Potrebný krok |
|---|---|---|---|
| R1 | high | `supabase/migrations/20260422192718_*.sql:51` vkladá FK na pevné ID používateľa. Následná migrácia backfilluje rovnaké ID. Čistá DB bez daného auth.users záznamu nemôže bezpečne prehrať históriu. | Na izolovanej DB overiť baseline a pripraviť postup bootstrapu bez produkčnej identity; neprepisovať slepo aplikovanú históriu. |
| R2 | high | `valuate-pwa/index.ts`: count a insert nie sú atomické; x-forwarded-for je použiteľné len ak ho gateway spoľahlivo prepíše. Prihlásený tok nemá aplikačnú kvótu. Útočník môže zvyšovať AI náklady. | Atomické rezervovanie kvóty v DB alebo gateway rate limiter; overiť súbežné volania a dôveryhodné IP hlavičky v stagingu pred povolením verejnej AI. |
| R3 | high | Dve odlišné migračné histórie. Supabase vytvára verejnú SELECT policy pre public_audits; Drizzle ju ruší a pridáva RPC, ale jeho schema.ts je prázdny. | Porovnať históriu nasadeného projektu. Určiť jediný riadený migračný postup; nepúšťať drizzle push nad prázdnou schémou. |
| R4 | high | `20260426183051_*.sql:111` povoľuje SELECT všetkých stĺpcov listed portfólia; public_audits SELECT USING(true) umožňuje enumeráciu. Podmienka slug v názve policy nie je kontrolou slug. | Potvrdiť, ktoré polia majú byť verejné; zabezpečiť úzku projekciu/RPC a integračne overiť anon prístup. |
| R5 | high | `portfolio_audits` INSERT kontroluje user_id, nie vlastníctvo portfolio_id; `deal_inquiries` INSERT neviaže seller_user_id na vlastníka ponuky. | Pridať overené serverové väzby a testy dvoch používateľov. Frontend filtre samotné tieto politiky neopravujú. |
| R6 | release gate | Konektor sprístupnil iný projekt než ref v supabase/config.toml. Docker daemon nebeží, Deno runtime nie je dostupný. | Sprístupniť určený staging projekt alebo izolovaný lokálny Supabase. Overiť migrácie, RLS, storage a deploynuté handlery. Nepoužiť iný náhodný projekt. |
| R7 | high/critical advisory | Online npm audit po cielenej aktualizácii: 26 balíkov (2 critical, 8 high, 14 moderate, 2 low). Konkrétne cesty a verzie: evidence/npm-audit.json. | Naplánovať a otestovať hlavné aktualizácie Vitest/Vite a kompatibilných pluginov. Kritický tinypool je dev/test závislosť, vyžaduje útočníkom ovplyvnené worker options/prototype pollution; nie dôkaz vzdialeného RCE v statickom SPA. Vite nálezy sa týkajú dev middleware; preview ani dev server nesmú byť verejný produkčný server. Zod nález potrebuje konkrétne oversized collection validácie, nevydávať ho automaticky za exploit každej schémy. |
| R8 | medium / scope gate | Billing Upgrade tlačidlo nemá handler; nie je checkout/webhook. Login nemá flow pre zabudnuté heslo. | Rozhodnúť, či sú súčasťou release; implementovať a izolovane E2E overiť alebo viditeľne označiť nedostupnosť. |
| R9 | release gate | Produkčný hosting, redirect allowlist, gateway JWT konfigurácia, monitoring, backup/restore a hlavičky nie sú runtime overené. | Vykonať runbook a smoke test v zvolenom stagingu. |
| R10 | medium | delete-account maže auth identitu; revokácia relácií, odstránenie storage objektov a úplnosť FK kaskád neboli overené. | Test disposable účtu vrátane starého JWT, avatarov a odkazov v ostatných tabuľkách. |

## Overenie a hranice

- Čisté `npm ci --ignore-scripts --offline` úspešne nainštalovalo 827 balíkov z lokálnej cache. Skutočný runtime testovaný Node 26.13.0 / npm 11.20.0; CI Node 22 je pripravené, ale na GitHub Actions nebolo spustené.
- Vitest testy sú lokálne. Edge testy spúšťajú transpiled skutočný handler so stubom Supabase/Deno; nepotvrdzujú JWT gateway, Deno importy ani živú DB.
- Prehliadač: in-app browser, produkčné preview na 127.0.0.1:4173. Landing SK, login a redirect neprihláseného portfólia vizuálne overené; pri kontrole bez error logov. Záznamy viewportov a ďalších kontrol sú v test-matrix.md.
- Statické PWA nastavenie nemá runtimeCaching pre Supabase API; manifest a service worker vznikajú buildom. Inštalácia na reálnom zariadení, upgrade starého klienta, offline logout a cross-user cache sú neoverené.
- Nebol vykonaný plný accessibility audit, výkonnostný benchmark ani load test. Nie je tvrdené 100 % test coverage.

Aktuálna dokumentácia overená cez Context7 a oficiálny [Supabase auth návod](https://supabase.com/docs/guides/functions/auth); prečítaný [changelog](https://supabase.com/changelog). Autorizačné pravidlá sa musia overiť aj na skutočnom nasadení, nie iba v React guardoch.

## Finálny lokálny výsledok

PASS: čistá inštalácia, typecheck, 23 testov v 5 súboroch, produkčný build a PWA generovanie. Lint PASS s 0 errors a 7 Fast Refresh warnings. Hlavný JS sa rozdelil na route chunky; celkový precache ostáva približne 4,2 MiB a niektoré chunky stále prekračujú 500 kB. Browser smoke nie je meranie Core Web Vitals. Detail viewportov a pozorovaný reload starého klienta sú v test-matrix.md. NOT READY platí aj po týchto opravách.
