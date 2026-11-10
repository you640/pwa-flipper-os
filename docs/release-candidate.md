# Release kandidát FLIPPER — 2026-11-06

**Verdikt: READY FOR REVIEW.** Nie je to READY na produkciu ani potvrdenie stagingu. Zmeny sú necommitnuté v pracovnom strome; nič sa nepushovalo, nemergovalo ani nenasadzovalo.

Základ: `1d8b606f9dbcb081314833774d1a9380ba8b5521`.
Fingerprint upravených zdrojov/config/lockfilov: `c8ae47210e926ea463b8c7d10ce8faecb7f040a72d33e3e9d363c8599144d45f`.
Zoznam súborov a SHA-256 je v evidence/release-manifest.json; dokumentácia a .env s hodnotami sú z fingerprintu vylúčené. Pri ďalšej zmene kódu treba fingerprint aj relevantné testy obnoviť.

## Review a opravy v tomto kroku

- Preverený zdrojový diff, migrácie, tests, závislosti a lockfile strom. Npm lock tarbally používajú registry.npmjs.org, npm ls nemá chyby závislostí a pinned Edge importy sú v deno.lock. Deno check --frozen prešiel bez zmeny lockfilu.
- Odstránenie verejných SELECT/RPC v aktuálnom src nemá konzumenta: public_audits a deal_inquiries sú iba v generovaných typoch, get_public_audit_by_slug sa nevolá. for_sale slúži na prepnutie stavu vlastného portfólia. Existenciu externých konzumentov alebo iného nasadeného commitu bez identifikácie projektu nemožno vylúčiť.
- Opravená regresia PasswordRecovery: oneskorené getSession nesmie obnoviť session po SIGNED_OUT. Pridaný regresný test.
- Opravená regresia valuation klienta: anon_limit z HTTP 429 sa číta z FunctionsHttpError Response, nie z nedostupného data. Odlišuje sa od upstream rate_limit. Dva nové testy.
- Retention čakacej listiny je nezmenený: user_id sa pri zmazaní účtu nastavuje na NULL a e-mail zostáva.

## Aktuálne dôkazy

| Kontrola | Stav | Dôkaz |
|---|---|---|
| Testy | PASS: 35 v 7 súboroch | evidence/test.log |
| Typecheck | PASS | evidence/typecheck.log |
| Lint | PASS, 0 errors / 7 warnings | evidence/lint.log |
| Produkčný build/PWA | PASS | evidence/build.log |
| Online npm audit | PASS, 0 nálezov | evidence/npm-audit.json |
| Npm dry-run offline | PASS | evidence/lock-consistency.log |
| Npm strom | PASS | evidence/dependency-tree.json a prázdny dependency-tree-errors.log |
| Deno frozen lock + typy | PASS | evidence/deno-check.log |
| Reálny lokálny PostgreSQL | PASS: čistá história aj legacy Drizzle; RLS, FK, kaskády a 1/12 súbežná kvóta | evidence/database-policies.log |
| Browser smoke | Predchádzajúci Vite 8 build overený; nové zmeny hookov sú regresne testované, živý SMTP/AI tok sa nespúšťal | test-matrix.md |
| GitHub CI | NOT TESTED vzdialene | .github/workflows/ci.yml |

## Backend a staging

Lovable konektor úspešne overil účet a kompletný zoznam 16 projektov v 4 dostupných workspaces, bez ďalších strán výsledkov. Názov, opis ani dostupné projektové údaje neumožnili jednoznačne určiť FLIPPER. Nevolali sa SQL query na odhadnutom projekte a nečítali sa žiadne používateľské dáta.

**BLOCKED: potrebný je iba odkaz na Lovable editor.** Po doručení overiť get_project, get_database_status a potom iba schému/migration metadata. Spoločnú DB nemeníme. Záloha, reset, seed ani účty v nej nie sú autorizované.

Oficiálny [Lovable migration guide](https://docs.lovable.dev/features/environments) uvádza, že Test/Live split je od 23. októbra 2026 zrušený a projekt používa jednu DB. Preview/draft ani samotný Git branch sa preto nepovažujú za dôkaz oddelenia. [Lovable Cloud](https://docs.lovable.dev/features/cloud) je vstavaný backend nad Supabase foundation; nie je to automaticky samostatný projekt používateľa v Supabase dashboarde. [Účtovanie](https://docs.lovable.dev/introduction/credits-and-usage) zahŕňa Cloud aj AI použitie. Nevytvoril sa remix, branch ani platená infraštruktúra.

Po identifikácii projektu pripraviť konkrétny návrh izolácie DB/Auth/Storage/secrets a nákladov. Samostatný projekt môže byť kandidát, ale musí mať overené odlišné endpointy a oddelené služby; ceny/budget sú dovtedy NOT TESTED. Ak je backend externý Supabase, preveriť jeho skutočné možnosti branching a billing. Žiadne bezplatné vytvorenie ani izolácia remixu sa nepredpokladá.

## Zostávajúce blokéry a najbližší krok

1. **Identita backendu:** odkaz na Lovable editor; následne read-only schema/migration comparison.
2. **Staging:** jednoznačne určené a autorizované disposable prostredie s oddelením DB/Auth/Storage/secrets a odsúhlaseným prípadným budgetom. Až potom migrácia a deploy funkcií.
3. **Existujúce dáta:** kontrola sirotských záznamov pred VALIDATE CONSTRAINT. Automatické mazanie nie je povolené.
4. **Integrácie:** REST/JWT izolácia A/B/admin/anon, recovery SMTP, staré JWT po delete-account, Storage, gateway IP a PWA offline/update/cross-user. BLOCKED pre live testy.
5. **AI náklady:** test budget nebol určený, platené AI volania sa nevykonali. Anonymná AI ostáva fail-closed bez dôveryhodnej gateway IP hlavičky.
6. **Produkčný release:** hosting/security headers, restore drill, monitoring a vzdialené CI. Zostáva NOT READY na produkciu.

Návrh názvu a textu PR: pr-proposal.md. Neposielať ho automaticky na GitHub.
