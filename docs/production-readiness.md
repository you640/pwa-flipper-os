> Aktuálny release review: **READY FOR REVIEW**, produkcia stále NOT READY. Pozri [release-candidate.md](release-candidate.md).

# Produkčná pripravenosť — aktualizácia 2026-11-06

**Verdikt: NOT READY na produkciu; lokálne bezpečnostné opravy sú pripravené na staging.** Základ `1d8b606f9dbcb081314833774d1a9380ba8b5521` plus necommitnutý pracovný strom. Spoločná databáza Lovable editora nebola zmenená. Používateľ potvrdil, že databáza je spoločná s Lovable; nepovažujeme ju za disposable staging.

## Výsledky

| Kontrola | Výsledok / dôkaz |
|---|---|
| Online npm audit | PASS, 0 zraniteľností; evidence/npm-audit.json |
| Čistá inštalácia uzamknutých balíkov | PASS, evidence/clean-install.log |
| TypeScript app + konfigurácie | PASS, evidence/typecheck.log |
| Lint | PASS, 0 errors / 7 Fast Refresh warnings; evidence/lint.log |
| Vitest 5 | PASS, 35 testov v 7 súboroch; evidence/test.log (zahŕňa jeden pôvodný triviálny test) |
| Vite 8 produkčný build a PWA generovanie | PASS, evidence/build.log |
| Skutočná Deno kontrola 3 Edge Functions | PASS, evidence/deno-check.log |
| PostgreSQL 18.6: čistá migračná história | PASS, evidence/database-policies.log |
| PostgreSQL 18.6: pôvodná Drizzle zmena + nová migrácia | PASS, rovnaký log |
| Súbežná kvóta | PASS: z 12 súbežných rezervácií pri limite 1 práve jedna uspela; overené v oboch DB scenároch |
| Browser po aktualizácii | PASS smoke na novom origine 127.0.0.1:4174: landing, signup query, admin redirect, recovery stránka; error log prázdny |

PostgreSQL testy používajú skutočné roly anon/authenticated/service_role, skutočné RLS a constrainty. Platformové auth.uid(), auth.users a storage sú minimálne lokálne stand-in objekty. Neoverujú GoTrue, PostgREST, gateway, SMTP, storage server ani konfiguráciu Lovable. CI konfigurácia je pripravená, ale vzdialené Actions sa nespúšťali.

## Vyriešené lokálne nálezy

- **R1:** Historický bootstrap už nepadá bez pevnej produkčnej auth identity. Dve pôvodné migrácie majú minimálnu podmienku existencie identity; nemeňte záznamy už aplikovanej histórie ani ich nespúšťajte znovu v živom projekte. Existujúcich adminov táto oprava nemení. Čistý replay prešiel bez produkčného účtu.
- **R2:** Oddelený count/insert bol nahradený atomickou service-only RPC `reserve_ai_audit`. Oba AI endpointy majú kvótu 10/24h na používateľa, anonymný valuation 1/24h na overenú IP. Chyba úložiska znamená odmietnutie. Anonymné volania vracajú 503, kým nie je výslovne nastavená gateway-owned `TRUSTED_CLIENT_IP_HEADER`. Neodhadovať dôveryhodnosť x-forwarded-for.
- **R3:** Supabase je jediná aktívna migračná autorita. Odstránené nepoužívané Drizzle závislosti, spustiteľná konfigurácia archivovaná. Historické SQL zostáva na porovnanie a test oboch východiskových stavov.
- **R4:** Odstránené plošné verejné SELECT politiky pre portfóliá a audit publikácie aj nepoužívaná verejná audit RPC. V repozitári nie je verejná Deal Room ani report routa, preto fail-closed režim neznefunkčňuje existujúcu verejnú obrazovku. Budúci verejný produkt potrebuje úzku schválenú projekciu, nie SELECT všetkých stĺpcov.
- **R5:** Audit INSERT vyžaduje vlastníctvo portfolio_id; publikácia vyžaduje vlastníctvo audit_id. Inquiry kontroluje skutočného predajcu uvedenej ponuky, seller UPDATE nemôže zmeniť väzbu na cudzie portfolio. Anonymný inquiry zápis je zakázaný, kým nebude bezpečný verejný endpoint. has_role overuje iba aktuálneho používateľa a anon/PUBLIC nemajú EXECUTE.
- **R7:** Zraniteľné hlavné vetvy nahradené a tranzitívne nálezy odstránené cielenými overrides. Podrobnosti a dôvod staršej vetvy deepmerge sú v dependency-overrides.md. Audit hlásenia sa nevypínali ani neignorovali.
- **R8:** Billing tlačidlo otvára skutočnú existujúcu čakaciu listinu a nesľubuje funkčný checkout. Pridaná /reset-password obrazovka v SK/EN s generickou odpoveďou, potvrdením hesla a minimom 12 znakov. Štyri izolované testy. Platobný provider nie je implementovaný a nie je povolené tvrdiť, že projekt podporuje platené predplatné.
- **R10 lokálna časť:** delete-account revokuje relácie, stránkuje a odstraňuje avatary len pod overeným user prefixom a až potom maže identitu. Pri chybe cleanupu sa identita nemaže. FK kaskády odstraňujú audity, publikácie, inquiries a subscriptions; väzba čakacej listiny sa odpojí nastavením user_id na NULL; e-mail zostáva uložený a nejde o úplnú anonymizáciu. Historické siroty sa automaticky nemažú. AI funkcie overujú používateľa cez getUser, aby neakceptovali už zmazanú identitu len na základe starého JWT.
- Zachované a overené predchádzajúce opravy AuthGuard race/fail-closed, Kanban legacy statusu a drag rollbacku, vlastníckych filtrov, abortov, AI výstupných schém, ochrany chybových odpovedí a lazy rout.

## Nová migrácia a zavádzanie

`supabase/migrations/20261106174426_production_policy_hardening.sql` je forward migrácia. Pred nasadením overiť skutočne aplikovanú Supabase/Drizzle históriu a diff schémy. Nie je nasadená. Nové FK sú NOT VALID, aby nasadenie potichu nemazalo existujúce siroty. V čistých lokálnych testoch sa všetky VALIDATE CONSTRAINT úspešne vykonali. Na spoločnej DB treba pred validáciou overiť existujúce dáta a odsúhlasiť prípadnú nápravu.

Nasadiť najprv DB migráciu, potom Edge Functions. Opačné poradie bezpečne odmietne AI požiadavky, pretože RPC ešte nebude existovať. Kvóta uchováva per-key počítadlá; pred verejným release stanoviť retention/cleanup, monitoring nákladov a gateway ochranu proti distribuovanému zneužitiu. Zápisy kvóty sú povolené výhradne service_role.

## Zostávajúce externé release gates

1. Určiť konkrétny Lovable projekt a jeho backend. Vyhľadanie názvov rubberduck/flipper cez dostupný Lovable konektor nenašlo zhodu; treba odkaz na editor. Priamy Supabase konektor cieľový ref nesprístupnil.
2. Použiť oddelený staging/branch alebo výslovne určený disposable projekt. Existujúca Lovable DB je spoločná; bez ďalšieho rozhodnutia žiadne testovacie migrácie či mazanie.
3. Overiť migration history, granty/exposed schemas, RLS cez REST s účtami A/B/admin, FK validáciu a staré JWT po zmazaní účtu. Lokálny PostgreSQL 18 nie je dôkaz parity s cieľovým Supabase Postgres runtime.
4. Overiť skutočný SMTP recovery/confirmation flow a redirect allowlist vrátane /reset-password. Nie sú odoslané žiadne reálne obnovovacie e-maily.
5. Overiť deploynuté Deno funkcie, gateway JWT režim, trusted IP hlavičku, secrets a AI provider s vopred určeným test budgetom. Bez správnej gateway konfigurácie anonymná AI zámerne nefunguje.
6. Hosting HTTPS/SPA fallback/security headers, monitoring, zálohy/restore drill a plný PWA update/offline/cross-user test na podporovaných zariadeniach ostávajú neoverené. Audit neposkytuje úplné WCAG, load-test ani penetračné overenie.

Heslá ani service_role kľúče neposielať do chatu. Potrebný je odkaz na Lovable editor, prípadne staging ref, prístup cez konektor a určenie testovacieho rozsahu. Lokálne secrets patria do chráneného serverového prostredia, nie VITE_.

Automatická kontrola odmietla návrh rozšíriť kaskádové mazanie aj na čakaciu listinu bez výslovného odsúhlasenia retention rozsahu. Návrh sa nevykonal; zostáva SET NULL. Pred tvrdením o úplnom odstránení osobných údajov treba určiť retention e-mailov čakacej listiny.

## Následný review

Opravený stale-session race v PasswordRecovery a spracovanie anon_limit pri skutočnej HTTP 429 odpovedi. Opakované kontroly: 35 testov, lint bez chýb, typecheck/build/Deno frozen-lock/PostgreSQL PASS, online npm audit 0. Staging blokuje chýbajúci editor URL a autorizované oddelené prostredie. Spoločná Lovable DB ostala nedotknutá.
