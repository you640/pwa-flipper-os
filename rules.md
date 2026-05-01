# 📐 RULES.md — Pravidlá editovania zdrojového kódu

> **Projekt:** RUBBERDUCK.SPACE — PWA Command Center
> **Stack:** Vite 5 + React 18 + TypeScript 5.8 + Tailwind 3 + Lovable Cloud (Supabase)
> **Tri prostredia:** Lovable.dev (primárne) · Lokálny dev server · Vercel.com (mirror)

Tento dokument popisuje **ako bezpečne upravovať kód mimo Lovable** tak, aby projekt naďalej fungoval v Lovable, lokálne aj na Vercel.

---

## 🎯 1. Tri prostredia — ako sa správajú

| Prostredie | URL | Auto-sync | Edge Functions | Env vars |
|------------|-----|-----------|----------------|----------|
| **Lovable.dev** | `id-preview--*.lovable.app` + `pwa-studio-hub.lovable.app` + `rubberduck.space` | ✅ Auto cez GitHub | ✅ Auto-deploy | ✅ Auto |
| **Lokálny dev** | `http://localhost:8080` | ⬇️ `git pull` | ❌ Nedeployuje (volá Lovable Cloud) | ⚠️ Manuálne `.env` |
| **Vercel** | `<projekt>.vercel.app` | ✅ Auto cez GitHub | ❌ Nedeployuje (volá Lovable Cloud) | ⚠️ Manuálne v dashboarde |

**Kľúčové:** Edge functions a databáza žijú **vždy** na Lovable Cloud (Supabase ref `ywdaptjvlztsrxyilgxf`). Lokálny dev a Vercel iba servujú frontend, ktorý sa pripája na ten istý backend.

---

## ⛔ 2. ZAKÁZANÉ úpravy (rozbije Lovable sync)

Tieto súbory **NIKDY needituj manuálne** — Lovable ich automaticky regeneruje a tvoje zmeny stratíš:

```
src/integrations/supabase/client.ts   ← auto-generated (Supabase klient)
src/integrations/supabase/types.ts    ← auto-generated (TypeScript typy z DB schema)
src/integrations/lovable/index.ts     ← auto-generated (OAuth wrapper)
.env                                  ← auto-generated (Vite env vars)
supabase/.temp/*                      ← Lovable interné cache
```

**Polo-zakázané** (edituj len cez Lovable UI alebo migrácie):
```
supabase/config.toml      ← project_id MUSÍ ostať "ywdaptjvlztsrxyilgxf"
supabase/migrations/*     ← nikdy needituj existujúcu migráciu, vždy pridaj novú
```

---

## ✅ 3. BEZPEČNÉ úpravy (fungujú vo všetkých 3 prostrediach)

| Adresár / súbor | Čo |
|---|---|
| `src/components/` | UI komponenty (vrátane shadcn/ui v `ui/`) |
| `src/pages/` | Routy (PascalCase.tsx) |
| `src/hooks/` | Custom hooks (`useXxx.ts`) |
| `src/lib/` | Utility funkcie |
| `src/i18n/locales/{sk,en}.ts` | Preklady — vždy pridaj kľúč do **OBOCH** súborov |
| `src/index.css` | Tailwind tokeny (HSL!) |
| `tailwind.config.ts` | Tailwind konfigurácia |
| `src/App.tsx` | Routy — pridaj **PRED** catch-all `<Route path="*" />` |
| `src/main.tsx` | Bootstrap |
| `index.html` | SEO meta tagy |
| `public/` | Statické assety, PWA ikony |
| `supabase/functions/<name>/index.ts` | Edge functions (auto-deploy cez Lovable) |
| `supabase/migrations/<timestamp>_<name>.sql` | Nové DB migrácie |

---

## 💻 4. Workflow: Lokálny dev server

```bash
# 1. Klon (po pripojení GitHub v Lovable)
git clone git@github.com:<user>/<repo>.git
cd <repo>
bun install        # alebo: npm install

# 2. Vytvor .env (skopíruj hodnoty z Lovable Cloud → Project Settings)
cat > .env <<'EOF'
VITE_SUPABASE_URL="https://ywdaptjvlztsrxyilgxf.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="<anon key z Lovable Cloud>"
VITE_SUPABASE_PROJECT_ID="ywdaptjvlztsrxyilgxf"
EOF

# 3. Spusti
bun run dev        # http://localhost:8080

# Užitočné
bun run test       # Vitest
bun run lint       # ESLint
bun run build      # produkčný build do dist/
```

**Pozor:** `.env` je v `.gitignore` (správne) — nikdy ho necommituj. Ak ti Lovable prepíše `.env`, znova si ho vytvor lokálne.

---

## ☁️ 5. Workflow: Vercel deploy

`vercel.json` je už pripravený (SPA rewrite + immutable cache pre `/assets/*`).

**Setup:**
1. Vercel Dashboard → Import Project → vyber GitHub repo
2. Framework: **Vite** (auto-detect)
3. Build command: `npm run build` · Output: `dist`
4. **Environment Variables** → pridaj všetky 3 produkčné:
   - `VITE_SUPABASE_URL` = `https://ywdaptjvlztsrxyilgxf.supabase.co`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = `<anon key>`
   - `VITE_SUPABASE_PROJECT_ID` = `ywdaptjvlztsrxyilgxf`
5. Deploy

**Po každom commite na main → Vercel auto-redeploy.**

⚠️ **Edge functions sa NEDEPLOYUJÚ z Vercelu.** Bežia stále na Lovable Cloud — Vercel frontend ich len volá cez `supabase.functions.invoke()`.

---

## 🔄 6. Git workflow medzi Lovable ↔ lokálnym ↔ Vercel

```
┌─────────────┐    push     ┌──────────┐    pull    ┌─────────────┐
│  Lovable.dev│ ──────────▶ │  GitHub  │ ─────────▶ │  Lokálny    │
│             │ ◀────────── │  (main)  │ ◀───────── │  / Vercel   │
└─────────────┘    auto     └──────────┘    push    └─────────────┘
                              │ webhook
                              ▼
                         Vercel build
```

**Pravidlá:**
- **Pred lokálnou prácou**: `git pull` (Lovable mohol robiť auto-edits)
- **Pred lokálnym pushom**: `git pull --rebase` aby si nestratil Lovable zmeny
- **Konflikt v `types.ts` / `client.ts` / `.env`**: vždy ber Lovable verziu (`git checkout --theirs <file>`) — pri ďalšom Lovable runne sa vyrieši
- **Nikdy** nerebase-uj migrácie — ich timestamp poradie je sväté

---

## 📝 7. Konvencie pre nové features

### Komponenty
```
src/components/<doména>/PascalCase.tsx
```
Príklad: `src/components/portfolio/ProjectFormDialog.tsx`

### Stránky + routy
1. `src/pages/Mojavna.tsx`
2. V `src/App.tsx`:
   ```tsx
   const Mojavna = lazy(() => import("./pages/Mojavna.tsx"));
   // ...
   <Route path="/mojavna" element={<Mojavna />} />   // PRED <Route path="*" />
   ```
3. Public route → mimo `<AuthGuard>`. Auth-gated → vnútri.

### i18n
```ts
// src/i18n/locales/sk.ts
mojavna: { title: "Moja vňava" }

// src/i18n/locales/en.ts  ← VŽDY ZÁROVEŇ
mojavna: { title: "My space" }
```
Použitie: `const { t } = useTranslation(); t("mojavna.title")`

### Supabase queries
```ts
// VŽDY tento import:
import { supabase } from "@/integrations/supabase/client";

// Edge function call:
const { data, error } = await supabase.functions.invoke("nazov", {
  body: { foo: "bar" },
});

// ❌ NIKDY: fetch("https://...supabase.co/functions/v1/nazov")
```

### Design system (Tailwind)
- Iba **semantic tokens**: `bg-background`, `text-foreground`, `border-border`, `bg-primary`...
- ❌ Nikdy `bg-white`, `text-black`, `bg-[#fff]`
- Nové farby pridaj do `src/index.css` (HSL!) + `tailwind.config.ts`

---

## 🔒 8. RLS, autentifikácia, bezpečnosť

- **Roly**: tabuľka `user_roles` + `public.has_role(uid, role)` security-definer funkcia (už nakonfigurované)
- **Nikdy** nečítaj `auth.users` z aplikačného kódu — používaj `profiles` tabuľku
- **Každá nová tabuľka**: enable RLS + napíš policies v migrácii (inak sa do nej nedá nič zapísať)
- **Secrets** (Stripe, Resend, atď.): cez Lovable Cloud UI → Edge Functions → Secrets, nikdy hardcoded
- **Public/anon prístup**: explicitne v RLS policy (`Roles: {anon, authenticated}`)

---

## 📱 9. PWA quirks

- Service Worker sa **vypína** v Lovable preview iframe (`src/main.tsx` riadky 7–24) — toto je správne, nemeň to
- **Lokálny dev**: SW je v `devOptions.enabled: false` (vite-plugin-pwa) — vypnutý
- **Vercel produkcia**: SW sa registruje normálne
- **Debug SW**: DevTools → Application → Service Workers → **Unregister** + Clear storage
- **PWA manifest**: `vite.config.ts` (sekcia `VitePWA(...)`) — ikony v `public/icons/`

---

## ⚡ 10. Edge Functions

```
supabase/functions/
  ├── create-checkout/index.ts      ← Stripe checkout
  ├── customer-portal/index.ts      ← Stripe billing portal
  ├── stripe-webhook/index.ts       ← Stripe webhooks (verify_jwt = false)
  ├── delete-account/index.ts       ← GDPR account deletion
  ├── draft-outreach/index.ts       ← AI outreach generator
  └── valuate-pwa/index.ts          ← AI portfolio valuation
```

**Pravidlá:**
- Iba `index.ts` priamo v adresári funkcie — žiadne podadresáre
- **CORS headers povinné** v každej response (vzor v `customer-portal/index.ts`)
- `Deno.env.get("KEY")` na čítanie secrets
- Po commite + pushi (alebo Lovable runne) sa **auto-deployujú**
- ❌ Nepoužívaj lokálny `supabase functions deploy` — môže rozbiť Lovable verify_jwt nastavenia
- AI volania: cez Lovable AI Gateway (`LOVABLE_API_KEY` + endpoint `https://ai.gateway.lovable.dev/v1/`)

---

## 🗄️ 11. DB Migrácie

```bash
# Nová migrácia (cez Lovable):
# 1. V Lovable chate povedz čo chceš (Lovable použije migration tool)
# 2. Lovable vytvorí supabase/migrations/<timestamp>_<name>.sql
# 3. Po schválení sa migrácia spustí + types.ts sa regeneruje
```

**Lokálne**: ak naozaj musíš pridať migráciu manuálne, drž timestamp formát `YYYYMMDDHHMMSS_<random>.sql` a poradie. **Lepšie: nechaj to Lovable.**

---

## 🐛 12. Troubleshooting matica

| Problém | Príčina | Fix |
|---|---|---|
| Lokálne 404 na `/dashboard` po refreshi | SPA fallback chýba | Vite dev má auto; na Vercel skontroluj `vercel.json` |
| Vercel 500 / blank stránka | Chýbajú `VITE_*` env vars | Pridaj v Vercel → Settings → Env vars |
| `supabase` undefined / 401 | Starý / chýbajúci `.env` | Skopíruj nový anon key z Lovable Cloud |
| Types nesúhlasia po DB zmene | `types.ts` sa regeneruje len v Lovable | `git pull` po Lovable migrácii |
| OAuth redirect fail | Beží v Lovable preview iframe | Otvor preview v plnom okne (klik na ↗️) |
| SW cachuje staré JS | Dev SW | DevTools → Application → Unregister |
| Edge function 401 | Chýba auth header | `supabase.functions.invoke()` ho pridá automaticky |
| Edge function CORS error | Chýba OPTIONS handler | Pridaj `if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders })` |
| Konflikt v `types.ts` pri merge | Lovable + lokálne edity | `git checkout --theirs src/integrations/supabase/types.ts` |
| Build fail "Cannot find module" | Lovable pridal dep, lokálne `node_modules` zastaraný | `bun install` znova |

---

## 🚦 13. Checklist pred každým pushom z lokálu

- [ ] `git pull --rebase` (vziať Lovable zmeny)
- [ ] Needitoval som žiadny súbor zo sekcie ⛔ 2
- [ ] i18n kľúče pridané do **oboch** `sk.ts` aj `en.ts`
- [ ] Nové routy sú **pred** catch-all `*`
- [ ] Nové tabuľky majú RLS + policies
- [ ] `bun run build` lokálne prešiel bez chýb
- [ ] Žiadne hardcoded secrets v kóde
- [ ] Tailwind používa semantic tokens (žiadne `bg-white`, `text-black`)

---

## 🔗 14. Užitočné odkazy

- **Lovable docs**: https://docs.lovable.dev
- **Lovable Cloud (Supabase) project**: ref `ywdaptjvlztsrxyilgxf`
- **Lovable preview**: `https://id-preview--8267bba5-b400-44e3-8b45-406ab44197a8.lovable.app`
- **Published**: `https://pwa-studio-hub.lovable.app`
- **Custom domain**: `https://rubberduck.space`
- **GitHub sync setup**: Lovable → Connectors → GitHub
- **Vite docs**: https://vitejs.dev
- **shadcn/ui**: https://ui.shadcn.com

---

## 📌 TL;DR — 5 najdôležitejších pravidiel

1. **Nikdy needituj** `src/integrations/supabase/{client,types}.ts`, `src/integrations/lovable/index.ts`, `.env` — Lovable ich prepíše.
2. **Pred lokálnou prácou vždy `git pull`**, pred pushom `git pull --rebase`.
3. **Lokálny `.env`** si vytvor manuálne s 3 `VITE_SUPABASE_*` premennými z Lovable Cloud. Na Vercel ich pridaj v dashboarde.
4. **Edge functions a DB** žijú vždy na Lovable Cloud — Vercel a lokál ich len volajú.
5. **i18n**: každý nový kľúč pridaj naraz do `sk.ts` aj `en.ts`. **Routy**: pred catch-all `*`. **Tabuľky**: vždy s RLS.
