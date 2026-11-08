# Bezpečnostné verzie tranzitívnych závislostí

2026-11-06: online npm audit po aktualizácii hlási 0 nálezov. Tento stav nie je zárukou absencie neznámych chýb.

- Vite 8.3.6, Vitest 5.1.0, React Router 7.18.5 a Zod 4.6.7 nahrádzajú zraniteľné hlavné vetvy. Zod v Edge importoch aj v testoch je zhodný; Supabase SDK je pripnuté na 2.119.0.
- Nepoužívané drizzle-kit/drizzle-orm/postgres a vývojový lovable-tagger boli odstránené. Supabase migrations je jediná aktívna história. Pôvodné Drizzle SQL zostáva na porovnanie a regresný test, bez spustiteľnej konfigurácie; archivovaná konfigurácia je v docs/legacy.
- `glob:14.0.4`, `minimatch:11.0.5`: explicitné overrides, pretože rodičovské Workbox/ESLint balíky používajú zraniteľné staršie rozsahy. Sú to hlavné aktualizácie; potvrdené lokálnym lint/test/build a generovaním PWA. Pri ďalšom update znova testovať globovanie assetov.
- `postcss-selector-parser:7.1.7`: oprava parsera selektorov, overená Tailwind produkčným buildom.
- `deepmerge:4.1.1`: zámerný návrat na staršiu vetvu mimo advisory GHSA rozsahu >=4.2.0 <=4.3.1. Registry pri kontrole nemal novšiu opravenú verziu (latest 4.3.1). Toto nie je potlačenie audit hlásenia. API použité build nástrojmi bolo overené úspešným PWA buildom. Nahradiť opravenou novšou vetvou, keď bude vydaná a otestovaná.

Nepoužívať `npm audit fix --force` ani ignorovanie advisory. Aktualizovať lockfile spolu s package.json, potom čistá inštalácia, lint, typy, testy, build a online npm audit. Offline npm výrok o zraniteľnostiach nie je platný audit.
