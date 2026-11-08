# FLIPPER

## Overovanie zmien

- Testy spúšťaj v lokálnom prostredí alebo v sandboxe. GitHub-hosted CI/CD je vypnuté kvôli rozpočtu. Bez výslovného pokynu používateľa nezapínaj workflow, nespúšťaj GitHub Actions ani nasadenie.
- Pred odovzdaním relevantných zmien spusti `npm run lint`, `npm run typecheck`, `npm test` a `npm run test:e2e`. Databázové zmeny over cez `scripts/database/test-policies.py` v izolovanom PostgreSQL.
- Browser testy so stubmi eviduj oddelene od živých staging testov. Spoločnú Lovable databázu nepoužívaj na testovacie zápisy.
- Podmienky merge pre draft PR #2 sú zelené GitHub CI a overenie na oddelenom stagingu, pokiaľ ich používateľ výslovne nezmení.
