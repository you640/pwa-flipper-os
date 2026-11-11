# FLIPPER

- Use the managed Lovable OAuth helper for Google sign-in with a public same-origin callback; validate the session before restoring the intended page to keep preview and standalone sign-in consistent.

## Overovanie zmien

- Testy spúšťaj v lokálnom prostredí alebo v sandboxe. GitHub-hosted CI/CD je vypnuté kvôli rozpočtu. Bez výslovného pokynu používateľa nezapínaj workflow, nespúšťaj GitHub Actions ani nasadenie.
- Pred odovzdaním relevantných zmien spusti `npm run lint`, `npm run typecheck`, `npm test` a `npm run test:e2e`. Databázové zmeny over cez `scripts/database/test-policies.py` v izolovanom PostgreSQL.
- Browser testy so stubmi eviduj oddelene od živých staging testov. Spoločnú Lovable databázu nepoužívaj na testovacie zápisy.
- PR #2 zlúč až po úspešných testoch v sandboxe a overení rovnakého commitu na autorizovanom oddelenom stagingu. GitHub Actions nechaj vypnuté.
