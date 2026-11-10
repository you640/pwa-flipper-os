> Pred vytváraním stagingu pozri [release-candidate.md](release-candidate.md): Lovable Test/Live split je zrušený, konkrétny backend a náklady zatiaľ nie sú určené. Potrebný je odkaz na editor; spoločná DB nesmie dostať testovacie zápisy.

# Aktuálny dodatok k nasadeniu — 2026-11-06

**Spoločná Lovable DB sa nesmie použiť ako disposable staging.** Najprv identifikovať editor projekt cez jeho odkaz, overiť backend a vytvoriť/určiť oddelené testovacie prostredie. Aktuálny prehľad má prednosť pred historickým postupom nižšie.

1. Použiť npm lockfile, Node >=22.12. Vite 8.3.6, Vitest 5.1.0, Router 7.18.5, Zod 4.6.7. Zopakovať lint, typecheck, test, build, online audit. Overrides a ich kompatibilita sú v dependency-overrides.md.
2. Prečítať skutočnú migration history vrátane historického Drizzle patchu. Supabase je jediná aktívna migračná cesta; nepúšťať drizzle push. Historické zmeny dvoch bootstrap súborov sa na aplikovanej DB nereplayujú.
3. Záloha a staging: aplikovať novú forward migráciu 20261106174426_production_policy_hardening.sql. Overiť NOT VALID FK voči existujúcim dátam a až po odsúhlasenej náprave sirotských záznamov vykonať VALIDATE CONSTRAINT pre audits_user_fk, public_audits_user_fk, public_audits_audit_fk, inquiries_seller_fk, inquiries_portfolio_fk, subscriptions_user_fk a waitlist_user_fk na príslušných tabuľkách.
4. Až po DB deploynúť 3 Edge Functions. Otestovať service-only RPC, user/anon odmietnutie a 12 súbežných rezervácií. Secrets server-only. TRUSTED_CLIENT_IP_HEADER nastaviť iba na hlavičku preukázateľne prepisovanú gateway na jedinú IP. Bez nej anonymous valuation vráti 503. Prihlásené valuation/outreach majú 10/24h, anonymné valuation 1/24h.
5. V auth redirect allowliste pridať konkrétny staging /reset-password. Testovať doručenie/expiry/reuse recovery odkazu s testovacím mailboxom. Žiadne obnovovacie e-maily sa počas lokálneho auditu neposielali.
6. Testovať account-delete so synthetic účtom: revokácia, storage cleanup, FK kaskády a opätovné použitie starého JWT. Cleanup zlyhanie musí zachovať identitu a umožniť opakovanie po opätovnom prihlásení.
7. Platený checkout je mimo aktuálneho produktu: Billing otvára waitlist. Verejné audit/portfolio listing SELECT a anonymné inquiries sú vypnuté až do implementácie úzkeho a rate-limited verejného API.
8. Pravidelný cleanup starých private.ai_audit_quotas záznamov a nákladové alerty nakonfigurovať pred verejným AI release. Overiť monitoring, backup restore, PWA update a logout/offline scenáre.

Lokálny DB test: vytvoriť izolovaný cluster (initdb, trust iba na Unix sockete), spustiť na porte 55439 bez TCP, potom python3 scripts/database/test-policies.py --socket-dir /private/tmp (Linux /tmp). Test nevie prijímať remote DB URL. Používa skutočný PostgreSQL a minimálne náhrady Supabase platformových schém. CI obsahuje samostatný databázový job; vzdialené CI ešte nebežalo.

## Historický všeobecný postup

# Nasadenie a rollback

**Release je zastavený: NOT READY.** Najprv vyriešiť R1–R10 v production-readiness.md podľa rizika a požadovaného rozsahu release. Hosting zatiaľ neurčený; nižšie je neutrálny postup pre statickú SPA a Supabase. Nevykonávať produkčné migrácie naslepo.

## Reprodukovateľné zostavenie

1. Použiť npm a package-lock.json. Bun locky nie sú release autorita tohto auditu. Node >=22.12, odporúčaný staging/CI Node 22; audit reálne bežal na Node 26.13.0. CI treba ešte spustiť na GitHub.
2. `npm ci --ignore-scripts`; `npm run lint`; `npm run typecheck`; `npm test`; `npm run build`. Archivovať commit, lockfile, výsledky a presný dist. Neignorovať nové zlyhania.
3. Skopírovať .env.example na .env.local a vyplniť verejnú testovaciu URL/key. VITE premenné sú verejné a napevno sa zapisujú pri builde; pri zmene prostredia rebuild. Existujúci .env je už sledovaný Gitom: .gitignore ho spätne neodstráni. Neukladať doň serverové kľúče; po rozhodnutí o konfigurácii odstrániť sledovanie samostatnou zmenou, zachovať lokálnu kópiu.
4. Serverové secrets nastaviť len pre Edge runtime: SUPABASE_URL, SUPABASE_ANON_KEY/publishable podľa handlera, SUPABASE_SERVICE_ROLE_KEY, LOVABLE_API_KEY, prípadný GITHUB_TOKEN. Hodnoty nedávať do logov ani VITE_.

## Backend staging pred release

1. Získať prístup ku konkrétnemu projektu, overiť ref proti konfigurácii. Konektor počas auditu cieľový projekt nesprístupnil. Nepoužiť iný dostupný projekt.
2. Zálohovať DB aj storage, zaznamenať aplikované migrácie a otestovať obnovu do izolovanej DB. Overiť dostupnosť PITR a reálny retention, nie predpokladať podľa názvu plánu.
3. Porovnať Supabase a Drizzle históriu, vyriešiť public_audits divergence. Prázdny drizzle/schema.ts nesmie viesť k drizzle push. Neopakovať už aplikované SQL bez prehľadu histórie.
4. V čistom prostredí vyriešiť bootstrap pevných user FK a founder admin identity; replay všetkých migrácií musí prejsť bez produkčných používateľov. Následné zmeny držať v jednej autoritatívnej migračnej histórii. Supabase CLI príkazy najprv overiť cez --help.
5. Nasadiť overené migračné zmeny do stagingu, potom kompatibilné Edge Functions. Pri používateľských funkciách zachovať JWT overenie; anonymný valuation tok potrebuje explicitne navrhnutú gateway konfiguráciu, vlastnú validáciu a atomickú kvótu. Nevypínať globálne JWT len kvôli 401.
6. Vytvoriť disposable test účty A/B a admin cez riadený fixture. Pre každú tabuľku overiť SELECT/INSERT/UPDATE/DELETE vlastných a cudzích ID aj zmenu owner ID; anon nesmie čítať súkromné údaje. Overiť cross-user FK v auditoch a seller väzbu inquiry.
7. Overiť auth registráciu/confirmation/recovery, refresh/expired/revoked JWT, storage upsert a delete-account vrátane zvyškov dát. Služby AI používať len so schváleným test budgetom; 402/429/timeouts najprv cez stubs.

## Statický hosting

- Nasadiť obsah dist cez HTTPS. Produkčne nespúšťať Vite dev ani preview.
- Nastaviť SPA fallback na index.html pre aplikačné URL; assety a backend URL nesmú byť prepisované na HTML. Priamy refresh /portfolio a /login musí fungovať.
- index.html, sw.js a manifest nesmú uviaznuť v dlhodobej immutable cache; hashované assety môžu mať immutable cache. Staré assety držať počas kompatibility so starými service workermi.
- Nastaviť produkčné originy v auth Site URL a redirect allowliste. Otestovať confirmation callback aj service worker navigateFallbackDenylist pre /~oauth.
- Konfigurovať nosniff, Referrer-Policy, obmedzené Permissions-Policy a CSP podľa skutočných originov (Supabase HTTPS/WSS, fonty/obrázky/news). Najprv report-only v stagingu; nevymýšľať univerzálnu CSP, ktorá rozbije app alebo povoľuje všetko. Rámovanie a preview broker posúdiť podľa požadovaného použitia.
- Overiť canonical URL a sitemap: robots.txt aktuálne odkazuje na /sitemap.xml, ktorý v public chýba. SEO doména rubberduck.space je pevná; potvrdiť vlastníctvo/cieľ.

## Smoke test a uvoľnenie

- Landing v SK/EN; login/signup link, validácia formulára, návrat na pôvodnú URL, priame /admin bez roly, 404 a refresh.
- Účet A vytvorí projekt, presunie ho cez Kanban, reload potvrdí stav; B ho nevidí v súkromnom workspace. Verejné údaje ponuky presne zodpovedajú schválenému rozsahu.
- Market/CRM CRUD, filtrovanie a prázdne stavy; AI odpoveď so správnym formátom, chyba a timeout; PDF a clipboard/download v oboch jazykoch.
- Mobil 390×844, tablet 768×1024, desktop 1440×900, klávesnica a čítačka. Overiť inštaláciu PWA na reálnych podporovaných zariadeniach a update starého klienta bez straty dát.
- Logout/offline/cross-user nesmú sprístupniť cudzie dáta. Skontrolovať sieť, konzolu a storage/service worker cache.
- Nastaviť redigované logy a request ID, alerty na 5xx/401/429 a AI náklady, monitoring frontend chýb bez tokenov/PII. Urobiť restore drill a zaznamenať vlastníka incidentu.
- Release schváliť až po doložených dôkazoch a odstránení blockerov. Platené plány a recovery flow musia byť buď implementované a overené, alebo jasne mimo release rozsahu.

## Rollback

Uchovať predchádzajúci dist, Edge verzie, DB snapshot a zoznam migrácií. Frontend rollback nasadiť ako celú konzistentnú verziu; preveriť SW cache a kompatibilitu API. DB uprednostniť opravnú forward migráciu; down migráciu len po otestovaní zálohy a dátových dopadov. Pri strate dát zastaviť zápisy, obnoviť do oddelenej DB, porovnať a až po schválení prepnúť. Neobnovovať produkčnú DB automaticky na základe frontend chyby. Po rollbacku zopakovať auth a CRUD smoke test.
