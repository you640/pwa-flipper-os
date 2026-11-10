# FLIPPER — backlog pred zlúčením PR #2

| Priorita | Úloha | Podmienka dokončenia |
|---|---|---|
| P0 | Obnoviť GitHub Actions | Na aktuálnom commite PR prejdú joby `verify` a `database-policies`. Beh [42451779512](https://github.com/you640/pwa-flipper-os/actions/runs/42451779512) skončil ako `BuildFailed / startup_failure` s nulou jobov. Ak sa to zopakuje, správca overí povolenia Actions, povolené akcie, prístup k runnerom a účtovanie. Ak sú nastavenia správne, odovzdá GitHub podpore identifikátory behov a check suite `115001114418`. |
| P0 | Potvrdiť identitu backendu a izolovaný staging | Overiť väzbu Lovable projektu na GitHub a identitu spoločného backendu. Určiť autorizovaný staging s odlišným endpointom a vlastnými DB, Auth, Storage a serverovými kľúčmi. |
| P0 | Overiť migrácie a schému | Prehrať migrácie na čistej staging DB, porovnať históriu a schému, validovať FK po kontrole existujúcich dát. Nasadiť Edge Functions až po DB migrácii. |
| P0 | Dokončiť živé E2E | Syntetické účty A/B/admin/anon. Overiť registráciu, SMTP recovery a expiráciu odkazu, REST/RLS, CRUD a Kanban perzistenciu, Storage, zmazanie účtu a starý JWT. AI a e-mail najprv cez stub alebo sandbox. |
| P0 | Overiť kvóty a PWA | V stagingu doložiť atomickú kvótu, zákaz priameho RPC a dôveryhodnú IP hlavičku pred aktiváciou anon AI. Overiť PWA update, offline režim a izoláciu dát po zmene účtu. |
| P0 | Rozhodnúť o merge | Pripojiť výsledky lint, typechecku, produkčného buildu, unit, regresných, E2E a databázových testov integrity zo sandboxu a dôkazy z oddeleného stagingu pre rovnaký commit. Až potom označiť draft za pripravený na review a zlúčiť. GitHub Actions zostáva vypnuté. |
| P1 | Pripraviť prevádzku | Overiť produkčný hosting, hlavičky, monitoring, zálohy a postup obnovy pred nasadením. |

Lokálne browser testy sa spúšťajú cez `npx playwright install chromium` a `npm run test:e2e`. Testy bežia nad produkčným buildom so stubovanou Supabase sieťou a pokrývajú admin presmerovanie, registráciu z odkazu, neplatné prihlásenie a recovery callback. Tieto scenáre dopĺňajú unit/regres testy a PostgreSQL testy integrity, ktoré pokrývajú RLS, FK, kaskády, kvótu a zachovanie e-mailu čakacej listiny pri odpojení účtu. Živé staging scenáre majú samostatné akceptačné kritériá.
