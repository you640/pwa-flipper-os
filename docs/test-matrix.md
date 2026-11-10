> Najnovšie overenie a staging blokéry: [release-candidate.md](release-candidate.md). Nové testy HTTP anon_limit/upstream rate_limit: 2 PASS (valuation-errors.test.tsx).

> Aktualizácia 2026-11-06: aktuálne výsledky majú prednosť pred historickou maticou nižšie.

## Aktuálne overenie po bezpečnostných opravách

| Vrstva | Výsledok | Dôkaz |
|---|---|---|
| Online npm audit | PASS, 0 nálezov | evidence/npm-audit.json |
| npm ci offline | PASS | evidence/clean-install.log |
| Lint / typecheck / Vite 8 build | PASS; lint má 7 upozornení | evidence/lint.log, typecheck.log, build.log |
| Vitest 5 | 35 PASS v 7 súboroch | evidence/test.log |
| Recovery request, matching passwords, session error | 5 PASS, bez reálneho e-mailu | src/test/password-recovery.test.tsx |
| Edge quota a deletion sequencing | Izolované handlery PASS | src/test/edge-functions.test.ts |
| Deno vzdialené importy a typy | 3 funkcie PASS | evidence/deno-check.log |
| Skutočná RLS izolácia A/B/admin/anon | PASS v 2 databázových scenároch | evidence/database-policies.log |
| Kvóta concurrency + zákaz RPC pre user/anon | PASS, 1 z 12 rezervácií | rovnaký log |
| FK validácia a account-delete kaskády | PASS v čistej a legacy DB | rovnaký log |
| Browser nový build na porte 4174 | Landing, signup, admin redirect a recovery PASS; error log prázdny | browser smoke 2026-11-06 |
| Lovable spoločná DB, REST/JWT/SMTP/Storage | BLOCKED externé overenie, žiadne mutácie | production-readiness.md |

## Historická matica pred opravami

# Testovacia matica

Dátum: 2026-11-06. Prostredie: lokálny pracovný strom nad `1d8b606`, Node 26.13.0, npm 11.20.0. PASS znamená iba uvedený rozsah, nie celú funkciu.

| Funkcia / riziko | Kontrola a dôkaz | Stav |
|---|---|---|
| Inštalácia | clean-install.log; npm ci offline po zosúladení lockfile | PASS |
| TypeScript app/config | typecheck.log | PASS |
| Lint | lint.log; 0 errors, 7 Fast Refresh warnings | PASS s upozorneniami |
| Unit/component/handler tests | test.log; 23 testov, z toho 1 historický placeholder | PASS |
| Produkčný build + PWA generovanie | build.log | PASS |
| AuthGuard signed-out / signed-in / rejected session / logout race | auth-guard.test.tsx, 4 testy | PASS (mock) |
| Portfolio legacy a neznáme statusy | portfolio-status.test.ts, 6 testov | PASS |
| EN/SK novinky a expand/collapse | industryNews.i18n.test.tsx, 3 testy | PASS (mock feed) |
| Edge GET/OPTIONS pre všetky 3 funkcie | edge-functions.test.ts, 6 testov | PASS (izolovaný handler) |
| Valuation neplatný JSON, outreach bez JWT, delete s neplatnou identitou | edge-functions.test.ts, 3 testy | PASS (izolovaný handler) |
| Landing, login, chránené /portfolio bez relácie | Produkčné preview v in-app browseri; landing SK, redirect na login, prázdny error log pri kontrole | PASS v obmedzenom rozsahu |
| Mobilná landing | viewport override 390×844, vizuálne skontrolované zobrazenie | PASS vizuálny smoke |
| Registrácia, login reálnym účtom, confirmation email, recovery, expiry, globálny logout | Vyžaduje testovací backend a účty | BLOCKED |
| Dashboard / portfolio CRUD a DnD perzistencia / market / CRM | Bez testovacích účtov a izolovanej DB; iba statická kontrola kódu | BLOCKED pre E2E |
| Valuation / outreach úspech, 402/429, timeout a invalid AI payload v deploynutom runtime | Platené služby sa nevolali; 402/429 vetvy len čítané | NOT TESTED runtime |
| Profile, avatar upload/upsert, settings, account deletion | Nutná izolovaná DB/storage a disposable účet | BLOCKED |
| AdminGuard, všetky admin sekcie, priamy API prístup dvoch používateľov | Nutné roly A/B/admin a staging | BLOCKED |
| Migrácie na čistej DB, Supabase vs Drizzle | Staticky zistené konflikty R1/R3; Docker daemon nedostupný | BLOCKED runtime |
| RLS own/cross-user/anon/admin pre SELECT/INSERT/UPDATE/DELETE | Nutná DB; frontend mock nie je náhrada | BLOCKED |
| Billing checkout, webhook, refund a invoice | Backend neimplementovaný v repo | FAIL pre platený release |
| Docs/PDF/download/share exporty so skutočnými dátami | Statická kontrola a build, export sa nevykonal | NOT TESTED |
| PWA manifest/service worker | build generuje artefakty | PASS build; inštalácia a aktualizácia NOT TESTED |
| PWA offline, logout, prepnutie používateľa, auth callback | Nutné kontrolované sessions a stará verzia klienta | NOT TESTED |
| Tablet/desktop a klávesnica/kontrast/čitačka | Rozšírené browser kontroly doplnené nižšie; úplný WCAG audit nevykonaný | NOT TESTED úplný audit |
| Závislosti | npm-audit.json online: 26 nálezov po update | FAIL security gate |
| Tajomstvá | env-classification.json: iba názvy a klasifikácia, anon JWT | PASS pre aktuálny .env; git história/host secrets NOT TESTED |
| Produkčné HTTPS, SPA fallback, security headers, backup restore, alerting | Hosting neurčený | BLOCKED |

Automatizované E2E s reálnou DB neboli vykonané. Pre dokončenie použiť scenáre v deployment-runbook.md a oddelené disposable dáta. Žiadne úspešné živé platby, správy ani AI volania nie sú deklarované.

## Doplnkové browser smoke kontroly

In-app browser nad produkčným preview: mobilný override 390×844 (landing), tablet 768×1024 (login), desktop 1440×900 (landing) — vizuálne zobrazenie PASS. /admin bez relácie zobrazil login. /login?signup=1 po reload novej PWA verzie vybral Registrovať a tlačidlo Vytvoriť účet. Po novom builde prvá navigácia ešte zobrazila starého klienta; reload načítal zmenu. Ide iba o smoke update, nie plný test update lifecycle. Posledná kontrola error logov bola prázdna. Test účtov ani submit formulára sa nevykonal. Viewport override bol resetovaný.
