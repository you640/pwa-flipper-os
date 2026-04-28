# PWA Flipper OS

PWA Flipper OS is a React and Supabase application for valuing, operating, and presenting small software assets. It combines a public marketing and intake surface with authenticated portfolio, CRM, billing, admin, and documentation areas.

## Overview

The application is built as a Vite-powered PWA with Supabase Auth, Postgres, and Edge Functions. The core product areas are:

- valuation workflows backed by a GitHub repo audit and AI-generated report
- portfolio and deal tracking
- CRM outreach draft generation
- subscription billing through Stripe-backed edge functions
- multilingual docs and export flows for investor-facing material

## Stack

- frontend: React 18, TypeScript, Vite 5, React Router, TanStack Query
- styling: Tailwind CSS, Radix UI primitives, shadcn/ui components
- backend: Supabase Auth, Postgres, Edge Functions
- ai integrations: Lovable AI gateway, optional GitHub API token for richer repo analysis
- testing and quality: ESLint, Vitest, Testing Library
- pwa: `vite-plugin-pwa` with `registerType: "autoUpdate"`

## Workspace Commands

This repository already contains Bun lockfiles, so Bun is the preferred package manager.

```bash
bun install
bun run dev
bun run lint
bun run test
bun run build
```

Equivalent `npm run ...` scripts also work because the scripts are defined in [package.json](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/package.json).

## Frontend Architecture

The app shell lives in [src/App.tsx](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/App.tsx). Public first-touch routes are eager-loaded, while secondary and authenticated routes are split into lazy chunks.

- eager routes: landing, login, not-found fallback
- lazy routes: dashboard, portfolio, valuation, market, CRM, profile, settings, billing, docs, admin, and deal room

The root entry point in [src/main.tsx](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/main.tsx) applies theme state early and disables service worker registrations inside Lovable preview hosts or iframe previews to avoid stale preview behavior.

Supabase is initialized in [src/integrations/supabase/client.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/integrations/supabase/client.ts) from frontend env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Important hooks:

- [src/hooks/useProfile.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/hooks/useProfile.ts): session, profile, and admin-role loading
- [src/hooks/useSubscription.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/hooks/useSubscription.ts): subscription state and Pro entitlement
- [src/hooks/useLocale.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/hooks/useLocale.ts): language switching, formatting helpers, and profile locale persistence

## Localization

The app supports English and Slovak. i18n is configured in [src/i18n/index.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/i18n/index.ts) with localStorage-based language detection and normalization of `sk-*` variants to `sk`.

Language state is synchronized in two places:

- `localStorage` for anonymous and returning browser sessions
- Supabase `profiles.locale` for signed-in users

## PWA Behavior

PWA support is configured in [vite.config.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/vite.config.ts).

- service worker registration uses `autoUpdate`
- manifest metadata is generated during build
- OAuth-style routes are excluded from navigation fallback via `navigateFallbackDenylist`

## Export and Sharing Utilities

The repo contains client-side export helpers for product and investor materials:

- [src/lib/exportDocsPdf.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/lib/exportDocsPdf.ts): localized manual and FAQ PDF export
- [src/lib/exportInvestorPdf.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/lib/exportInvestorPdf.ts): investor-oriented valuation deck export
- [src/lib/shareImage.ts](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/src/lib/shareImage.ts): generated valuation share image and download helper

The PDF exporters fetch Roboto font files at runtime so Slovak diacritics render correctly in generated PDFs.

## Supabase Edge Functions

Current edge functions in [supabase/functions](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/supabase/functions) include:

- `valuate-pwa`: audits a GitHub repository, computes valuation inputs, and calls the Lovable AI gateway
- `draft-outreach`: generates AI outreach email drafts using CRM lead data and portfolio audit context
- `create-checkout`: creates Stripe checkout sessions for subscription upgrades
- `customer-portal`: creates Stripe billing portal sessions
- `stripe-webhook`: verifies Stripe webhook signatures and syncs subscription state
- `delete-account`: deletes the authenticated Supabase user

These functions rely on Supabase runtime variables and project secrets.

### Required Runtime Variables

Supabase runtime variables expected by the functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` or `SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Required Project Secrets

User-managed secrets required for full production behavior:

- `LOVABLE_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRO_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`
- optional `GITHUB_TOKEN`

## Environment and Project Targeting

Frontend and CLI targeting are currently aligned:

- [.env](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/.env) points the frontend to Supabase project `ywdaptjvlztsrxyilgxf`
- [supabase/config.toml](/Users/erikbabcan/Projects/02_Products/pwa-flipper-os/supabase/config.toml) points the CLI to the same project `ywdaptjvlztsrxyilgxf`

That removes one class of deployment confusion. Secrets and function deploys now need to target only that project.

## Deployment Status

Do not treat edge-function deployment as complete at the moment.

Production deployment requires both of these conditions to be true:

1. the target project contains all required secrets and runtime variables
2. the required edge functions are deployed successfully to that same project

If you are deploying edge functions, first verify the target project ref, then set the missing secrets in that same project, then deploy the functions.

## Validation Workflow

Use the repository scripts for validation:

```bash
bun run lint
bun run test
bun run build
```

At the time of this documentation update, build succeeds and route-level code splitting is active, but Vite still warns about some large chunks after minification. That warning is an optimization note, not a build failure.

## Troubleshooting

- If `vite build` warns that `caniuse-lite` or browsers data is old, that is dependency metadata drift, not a fatal error.
- If edge deploy or `supabase secrets set` fails, verify project access and make sure you are targeting the same project ref used by the frontend.
- If billing flows fail at runtime, confirm Stripe secrets exist in the same Supabase project where the functions are deployed.
- If valuation quality drops or GitHub lookups fail, add or verify `GITHUB_TOKEN` to reduce API rate-limit issues.

## Notes

- This repo does not currently rely on `.env.example` for setup.
- This repo uses ESLint as the primary lint command through the package scripts.
- Local edge-function deployment documentation should follow actual Supabase project targeting; avoid assuming Docker-only local workflows unless they are explicitly added to the repo.
