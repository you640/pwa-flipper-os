# Help & Documentation Center

A new `/docs` route with a 4-tab help center: User Manual, FAQ, CEO Manual (admin-only), and About & Contact. Fully localized in EN/SK and matched to the existing glassmorphic dark aesthetic.

## What you'll get

**1. New route + sidebar entry**

- Route `/docs` rendered through `AppLayout`, gated by `AuthGuard` like the other app pages.
- Sidebar link **"Documentation"** with `BookOpen` icon, placed in the bottom footer area of `AppSidebar` next to **Settings**.

**2. Docs page with 4 Shadcn Tabs**
Header: gradient title "Help & Documentation" + subtitle, mirroring other pages (Portfolio/Valuation style).

- **Tab 1 — User Manual (Onboarding)**: 4 steps as numbered glass cards, each with a Lucide icon (Lightbulb, Kanban, Cpu, Zap), title, description, and a short "Tip" line.
  1. Valuation – how to value your first app
  2. Kanban – manage your pipeline
  3. CRM – AI pitches & closing
  4. PWA Install – Add Flipper OS to iPhone/Android
- **Tab 2 — FAQ**: Shadcn `Accordion` (`type="single" collapsible`) with **8 entries**:
  - How is the valuation calculated?
  - Which industry multipliers do you use?
  - Can I use my own email for CRM outreach?
  - Is my data encrypted?
  - How do I export my portfolio?
  - How do I update the PWA?
  - Does Flipper OS work offline?
  - How do I delete my account?
- **Tab 3 — CEO Manual (Private)**: Admin-only.
  - Visible only to users with the `admin` role (via `has_role` check).
  - Non-admin users see a locked card: `ShieldCheck` icon + "Restricted" message.
  - Header has a red `Confidential` Shadcn `Badge`.
  - Sections (each as a glass card with icon): managing `market_intel`, sourcing SK/CZ acquisition agencies, scaling the portfolio, ops checklist.
- **Tab 4 — About & Contact**:
  - "About Flipper OS" card — mission to dominate the micro-SaaS exit market.
  - Contact card with `Mail` icon → `support@flipper-os.com`, plus social links (X / LinkedIn / GitHub) as icon buttons.

**3. Full i18n (EN + SK)**

- New namespaces in `src/i18n/locales/en.ts` and `sk.ts`:
  - `docs.title`, `docs.subtitle`, `docs.tabs.{manual,faq,ceo,about}`
  - `docs.manual.steps[1..4].{title,desc,tip}`
  - `docs.faq.items[1..8].{q,a}`
  - `docs.ceo.{confidential,restricted,sections.{market,leads,scale,ops}.{title,body}}`
  - `docs.about.{mission.title,mission.body,contact.title,contact.email,contact.social}`
- `sk.ts` matches the `Translations` shape so TS stays happy.
- Sidebar key `sidebar.docs` added.

**4. Visuals**

- Glassmorphic cards (`glass` / `card` classes already used elsewhere), gradient header, Framer Motion fade-in on tab change.
- Icons: `Lightbulb`, `ShieldCheck`, `Cpu`, `Zap`, `BookOpen`, `Kanban`, `Mail`, `Globe`.

## Technical details

**Files created**

- `src/pages/Docs.tsx` — page with `<Tabs>` + 4 panels.
- `src/components/docs/ManualTab.tsx`, `FaqTab.tsx`, `CeoTab.tsx`, `AboutTab.tsx` — keeps `Docs.tsx` small.
- `src/hooks/useIsAdmin.ts` — calls `supabase.rpc('has_role', { _user_id, _role: 'admin' })`, returns `{ isAdmin, loading }`.
- `supabase/migrations/<ts>_user_roles.sql` — only if `user_roles` table / `app_role` enum / `has_role()` function don't already exist (will check first; created exactly per the security pattern: enum `app_role`, table `public.user_roles`, RLS, `SECURITY DEFINER` `has_role` function). No admin is auto-assigned — you'll grant yourself admin via a one-line insert that the migration includes guarded by your `auth.uid()` (we'll ask for confirmation before assigning).

**Files edited**

- `src/App.tsx` — add `<Route path="/docs" element={<Docs />} />` above the catch-all.
- `src/components/layout/AppSidebar.tsx` — add Documentation link in the footer block (above Settings), using `BookOpen`. New i18n key `sidebar.docs`.
- `src/i18n/locales/en.ts` + `sk.ts` — add `docs.*` namespace and `sidebar.docs`.

**Admin gating**

```tsx
const { isAdmin, loading } = useIsAdmin();
if (loading) return <Skeleton/>;
if (!isAdmin) return <RestrictedCard/>;
```

Tab trigger stays visible to everyone (so the UI looks consistent), but the panel content is what's gated — no data leakage because nothing sensitive is fetched, just static localized copy.

**No changes** to existing dashboard, kanban, valuation, CRM, or news code.  
  
*"Pravidlo č. 1: Nikdy nepredávaj pod 30-násobok mesačného zisku!"*