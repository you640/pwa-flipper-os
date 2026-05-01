# Plán: Diagnostika + `rules.md`

## Časť 1 — Diagnostika projektu (čo mám overené)

**Stack:**
- Vite 5 + React 18 + TypeScript 5.8, Tailwind 3, shadcn/ui, React Router 6
- React Query, i18next (sk/en), Framer Motion, Recharts, jsPDF
- @dnd-kit (Kanban), @lovable.dev/cloud-auth-js (OAuth wrapper)
- vite-plugin-pwa (autoUpdate, navigateFallbackDenylist `/~oauth`)
- Vitest + Testing Library

**Backend (Lovable Cloud / Supabase ref `ywdaptjvlztsrxyilgxf`):**
- 15 migrácií, 6 edge functions: `create-checkout`, `customer-portal`, `stripe-webhook`, `delete-account`, `draft-outreach`, `valuate-pwa`
- Auto-generated: `src/integrations/supabase/client.ts`, `src/integrations/supabase/types.ts`, `src/integrations/lovable/index.ts`, `.env`
- `supabase/config.toml` minimal (len `project_id`)

**Routing/Hosting:**
- BrowserRouter, public routes `/`, `/deals`, `/login`; ostatné cez `AuthGuard`
- `vercel.json` má SPA rewrite `/(.*) → /index.html` + immutable cache pre `/assets/*`
- Lovable hosting má SPA fallback automaticky
- `main.tsx` odregistruje SW v Lovable preview iframe (anti-conflict)

**Identifikované riziká pri editovaní mimo Lovable:**
1. `.env` je auto-generated → lokálne ho prepíše Lovable pri sync, na Vercel chýba úplne
2. `src/integrations/supabase/{client,types}.ts` a `src/integrations/lovable/index.ts` sa regenerujú — manuálne edity sa stratia
3. `supabase/config.toml` musí ostať s rovnakým `project_id`
4. Edge functions deploys robí Lovable; lokálne `supabase functions deploy` môže rozbiť verify_jwt nastavenia
5. Vercel build potrebuje `VITE_SUPABASE_*` env vars manuálne nastavené (nie sú v repo)
6. PWA SW v dev/preview môže cachovať staré buildy → treba `Application → Unregister` pri debugovaní
7. `index.html` OG image ukazuje na `gpt-engineer-file-uploads` (Lovable CDN) — funguje, ale je viazaný na Lovable infra
8. Migrácie majú Lovable timestamp prefix (`20260...`) — pri lokálnom `supabase db push` treba držať poradie

---

## Časť 2 — Vytvoriť `rules.md` v root projektu

Dokument bude obsahovať tieto sekcie (slovensky, prakticky, s príkladmi):

### 1. Tri prostredia a ako sa správajú
- **Lovable.dev (primárne)** — auto-sync, auto-deploy edge functions, auto-generated súbory
- **Lokálny dev server** — `bun install && bun run dev`, potrebné `.env` skopírované z Lovable Cloud
- **Vercel (production mirror)** — `vercel.json` už nastavený, treba pridať env vars v dashboarde

### 2. ZAKÁZANÉ úpravy (rozbije Lovable sync)
Tieto súbory NIKDY needituj manuálne — Lovable ich prepíše:
- `src/integrations/supabase/client.ts`
- `src/integrations/supabase/types.ts`
- `src/integrations/lovable/index.ts`
- `.env` (root)
- `supabase/config.toml` — `project_id` musí ostať `ywdaptjvlztsrxyilgxf`
- `supabase/.temp/*`

### 3. BEZPEČNÉ úpravy (fungujú všade)
- Všetko v `src/components/`, `src/pages/`, `src/hooks/`, `src/lib/`, `src/i18n/`
- Tailwind tokens v `src/index.css` + `tailwind.config.ts`
- Edge functions v `supabase/functions/<name>/index.ts` (pri pushi cez Lovable sa deploynú)
- Nové migrácie v `supabase/migrations/` — POZOR na timestamp poradie

### 4. Workflow: lokálny dev
```bash
# 1. Klon (Lovable má GitHub sync)
git clone <repo>
cd <repo>
bun install   # alebo npm install

# 2. Vytvor .env (skopíruj z Lovable Cloud → Settings)
cat > .env <<EOF
VITE_SUPABASE_URL="https://ywdaptjvlztsrxyilgxf.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key z Lovable>"
VITE_SUPABASE_PROJECT_ID="ywdaptjvlztsrxyilgxf"
EOF

# 3. Spusti
bun run dev   # http://localhost:8080
```

### 5. Workflow: Vercel deploy
- `vercel.json` je už pripravený (SPA rewrite + asset caching)
- V Vercel dashboarde → Project Settings → Environment Variables pridaj:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_PUBLISHABLE_KEY`
  - `VITE_SUPABASE_PROJECT_ID`
- Build command: `npm run build`, output: `dist`
- **Edge functions sa NEDEPLOYUJÚ z Vercelu** — bežia stále na Lovable Cloud (Supabase)

### 6. Git workflow medzi Lovable a lokálnym
- Lovable má 2-way GitHub sync — push z lokálu = update v Lovable
- **Pred lokálnym pushom**: pull najprv (Lovable mohol spraviť auto-edits)
- **Po Lovable edite**: pull pred ďalšou prácou
- Konflikt v `types.ts` → vždy preferuj Lovable verziu (vyrieši sa pri ďalšom Lovable runnte)

### 7. Konvencie pre nové features (aby Lovable neprepísal)
- **Komponenty**: `src/components/<doména>/PascalCase.tsx`
- **Stránky**: `src/pages/PascalCase.tsx` + route v `src/App.tsx` PRED catch-all `*`
- **Hooks**: `src/hooks/useXxx.ts`
- **i18n**: PRIDAJ kľúč do OBOCH `src/i18n/locales/sk.ts` aj `en.ts` súčasne
- **Supabase queries**: vždy `import { supabase } from "@/integrations/supabase/client"`
- **Edge function call**: `supabase.functions.invoke('name', { body })` — nikdy fetch s pevnou URL

### 8. RLS a bezpečnosť
- Roly v `user_roles` tabuľke + `has_role()` security-definer fn (už je tak)
- Nikdy `auth.users` v aplikačnom kóde — používaj `profiles`
- Nové tabuľky: VŽDY enable RLS + policies v migrácii

### 9. PWA quirks
- SW je vypnutý v Lovable preview iframe (`main.tsx`)
- Pri lokálnom debugu SW: DevTools → Application → Service Workers → Unregister
- Build na Vercel zapne plný PWA mode

### 10. Edge functions — kde editovať
- Iba `supabase/functions/<name>/index.ts` — žiadne podadresáre
- CORS headers povinné (vzor v `customer-portal/index.ts`)
- Secrets cez Lovable Cloud UI (nie hardcoded), čítané `Deno.env.get(...)`
- Po Lovable push sa auto-deployujú; lokálny `supabase functions deploy` NEPOUŽÍVAJ

### 11. Testovanie
```bash
bun run test          # vitest run
bun run lint          # eslint
```
Build kontrola: nespúšťaj `tsc --noEmit` ručne v Lovable — Lovable to robí automaticky. Lokálne OK.

### 12. Troubleshooting matica
| Problém | Príčina | Fix |
|---|---|---|
| Lokálne 404 na refresh | chýba SPA fallback | Vite dev má auto; check `vercel.json` na proď |
| Vercel 500 / blank | chýbajú VITE_* env vars | Pridaj v Vercel dashboarde |
| `supabase` undefined | starý `.env` | Skopíruj nový z Lovable Cloud |
| Types nesúhlasia | po DB migrácii sa types regenerujú v Lovable | Pull z gitu |
| OAuth redirect fail | Lovable preview iframe | Test v plnom okne, nie iframe |
| SW cachuje staré | dev SW | Unregister v DevTools |

---

## Realizácia

Vytvorím **jeden súbor**: `rules.md` v root projektu s celým obsahom hore (rozšíreným s kódovými blokmi a konkrétnymi cestami). Žiadne iné súbory sa nemenia.

Po vytvorení `rules.md` ti dám aj krátky súhrn v chate s 5 najdôležitejšími pravidlami.
