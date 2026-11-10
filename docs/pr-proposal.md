# Návrh názvu PR

fix: harden tenant isolation and AI quotas, update vulnerable dependencies

# Návrh popisu PR

Projekt nešlo reprodukovateľne nainštalovať z pôvodného npm lockfilu a obsahoval zraniteľné verzie nástrojov. Bezpečnostné opravy aktualizujú závislosti, opravujú ochranu relácií a migrujú verejné databázové politiky na explicitné vlastníctvo. Napríklad používateľ B už nemôže vytvoriť audit pripojený k portfóliu používateľa A a z 12 súbežných rezervácií anonymnej AI kvóty uspeje práve jedna.

PR zahŕňa atomické service-only AI kvóty, validáciu AI odpovedí, timeouts, recovery flow, bezpečnejšie mazanie účtu, opravy Kanbanu a regresné testy. Billing otvára čakaciu listinu. Verejné portfolio/audit SELECT a anonymné inquiry zápisy sú zámerne uzavreté; tento repozitár nemá verejnú Deal Room ani report routu.

## Overenie

- 35 Vitest testov, typecheck a produkčný Vite/PWA build: PASS.
- Lint: 0 errors, 7 existujúcich Fast Refresh warnings.
- Online npm audit: 0 nálezov; npm dry-run inštalácia a npm/Deno lock konzistencia overené.
- Deno check --frozen pre všetky 3 funkcie: PASS.
- Skutočný PostgreSQL: replay čistej histórie aj legacy Drizzle stavu, roly A/B/admin/anon, FK validácia, deletion cascades a concurrency kvóty: PASS. Supabase platformové schémy sú lokálne stand-in objekty, nie plný živý Supabase.

## Nasadenie a riziká

Zmeny nie sú nasadené. Najprv porovnať skutočnú schému a históriu na identifikovanom backende, otestovať v autorizovanom oddelenom stagingu, aplikovať novú DB migráciu a až potom Edge Functions. Dve historické migrácie majú podmienku existencie produkčnej identity na podporu čistej inštalácie; už aplikované migrácie nereplayovať. Nové NOT VALID FK vyžadujú kontrolu starých dát pred validáciou. Historické siroty sa automaticky nemažú.

Anonymná AI vracia 503 bez preukázateľne dôveryhodnej gateway IP hlavičky; anonymné nasadenie sa nesmie označiť za funkčné iba podľa lokálnych testov. Waitlist e-maily zostávajú po zmazaní účtu pri user_id=NULL. Hlavné aktualizácie glob/minimatch/parsera a návrat deepmerge na 4.1.1 sú zdokumentované v docs/dependency-overrides.md.

Pred produkciou treba REST/JWT/SMTP/Storage testy, reálne recovery odkazy, gateway nastavenie, PWA offline/update testy, zálohy/restore a monitoring. GitHub CI zatiaľ nebežalo. Pozri docs/release-candidate.md a docs/production-readiness.md.
