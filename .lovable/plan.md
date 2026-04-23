

# Fix Tooltip crash + ship Superadmin Command Center

Two things bundled: a one-line root-cause fix for the `TooltipProvider` crash, then the full **RUBBERDUCK Superadmin Command Center** at `/admin-panel` as originally planned.

## What you'll get

**1. Crash fix — root cause**
The error `Cannot read properties of null (reading 'useRef')` inside `TooltipProvider` is the classic **duplicate React** symptom (two React copies loaded → hooks return null). It is *not* a missing provider — `App.tsx` already wraps the tree in `<TooltipProvider>`. The trigger is a stale Vite dep cache after adding new components/icons.

Fix: clear Vite's pre-bundled deps cache and let it re-optimize against the single React in `node_modules`. Concretely:
- Delete `node_modules/.vite`.
- Add `optimizeDeps.force: true` (one-shot) in `vite.config.ts`, or alternatively dedupe explicitly with `resolve.dedupe: ["react", "react-dom"]` (kept permanently — safer).
- Add a defensive `<TooltipProvider>` inside `AdminLayout` too, so the admin surface is self-contained even if mounted standalone.

**2. Route + access control**
- New route `/admin-panel` registered in `App.tsx`, inside the existing `AuthGuard`.
- New `AdminGuard` wraps `Admin.tsx`:
  - Uses `useProfile()`; while `loading` shows a spinner.
  - If `!isAdmin` → `toast.error(t("admin.unauthorized"))` (sonner) + `<Navigate to="/" replace />`.
- Admin status is derived from the `user_roles` table (existing `has_role` + RLS). Only users with `role = 'admin'` pass — so `larsenevans@proton.me` must have a row in `user_roles` with role `admin`. If that row doesn't exist yet, I'll add a migration that grants `admin` to whichever `auth.users.id` matches that email (idempotent `INSERT ... ON CONFLICT DO NOTHING`).

**3. Layout: `AdminLayout` + `AdminSidebar`**
- `src/components/admin/AdminLayout.tsx`: same `SidebarProvider` shell as `AppLayout`, mounts `<AdminSidebar />` and a slim admin topbar (Superadmin badge, admin name, **Back to App** button). Wrapped in its own `<TooltipProvider>`.
- `src/components/admin/AdminSidebar.tsx` sections (each scrolls to an in-page anchor):
  - **Global Pulse** (`Activity`)
  - **User Management** (`Users`)
  - **SEO Hub** (`Search`)
  - **Database Explorer** (`Database`)
  - **System Logs** (`Terminal`)
- Same RUBBERDUCK glassmorphic dark tokens; collapsible-to-icon behavior matches the main sidebar.

**4. Top tab strip: Analytics / Users / SEO Tools**
Shadcn `Tabs` at the top of `Admin.tsx`:
- **Analytics** → Global Pulse + Global Growth chart + System Logs.
- **Users** → User Management table + Database Explorer.
- **SEO Tools** → SEO Hub.

**5. Global Pulse**
Four `MetricCard`s reusing the dashboard component:
- Total users (count of `profiles`)
- Combined MRR (sum of all `portfolio.mrr`)
- Total portfolio value (sum of all `portfolio.asking_price`)
- System health pill ("Operational") + last-refresh timestamp.

**Global Growth** (recharts `AreaChart`): signups per day for last 30 days, derived by bucketing `profiles.created_at`. Same gradient styling as `ProjectionChart`.

**6. User Management**
Shadcn `Table` columns: Avatar + display_name, role (joined from `user_roles`), joined date, actions.
- **Edit Role** → `Dialog` with `Select` (`admin` / `moderator` / `user`). On confirm: delete existing rows for that user_id then insert the new role (covered by existing admin RLS).
- **Impersonate** → tooltip "Coming soon — requires backend session swap" + `toast.info`. (True impersonation needs a service-role edge function; called out as out of scope.)
- Client-side search by display_name.

**7. SEO Hub (plugin slot)**
Big glass card titled **"SEO Analysis Dashboard"** with a dashed-border **Drop Zone** at the top:
- `<div id="seo-plugin-slot" data-seo-plugin-slot />` so future scripts can mount via `window.RubberduckSEO`.
- Placeholder copy: "Drop your SEO plugin here."

Three placeholder cards in a 1/3 grid: **Keyword Tracking** (`Hash`), **Backlink Pulse** (`Link2`), **Meta Auditor** (`FileSearch`) — each with empty-state and disabled "Run audit" button.

**8. Database Explorer (read-only)**
Shadcn `Accordion` with two cards:
- **portfolio** — paginated (20/page): `name`, truncated `user_id`, `mrr`, `asking_price`, `status`, `created_at`. CSV export.
- **crm_leads** — paginated: `agency_name`, `contact_email`, `status`, truncated `user_id`, `created_at`. CSV export.

Both fetch with `select("*")` — admin RLS already permits it.

**9. System Logs**
Two stacked lists:
- Recent sign-ups — last 10 `profiles` by `created_at desc`.
- Avatar upload errors — last 10 from `avatar_upload_errors`.

Locale-aware relative time (reuses helper from `ActivityFeed`).

**10. i18n: full `admin.*` namespace** in `en.ts` + `sk.ts`
`admin.title`, `admin.subtitle`, `admin.unauthorized`, `admin.backToApp`, `admin.lastRefresh`, `admin.tabs.{analytics,users,seoTools}`, `admin.sidebar.{globalPulse,users,seoHub,database,logs}`, `admin.pulse.*`, `admin.users.*` (incl. `roles.{admin,moderator,user}`), `admin.seo.*`, `admin.db.*`, `admin.logs.*`. Plus `sidebar.adminPanel`.

**11. Conditional admin link in main `AppSidebar`**
Footer entry **"Admin Panel"** with `Shield` icon, rendered only when `useProfile().isAdmin` is true. Non-admins never see it.

## Technical details

**Files created**
- `src/pages/Admin.tsx` (orchestrator — tabs + sections)
- `src/hooks/useAdminData.ts` (parallel queries: `profiles`, all `portfolio`, all `crm_leads`, `user_roles`, `avatar_upload_errors`; builds `growthSeries`)
- `src/components/admin/AdminGuard.tsx`
- `src/components/admin/AdminLayout.tsx` (wraps in its own `<TooltipProvider>`)
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/sections/GlobalPulse.tsx`
- `src/components/admin/sections/GlobalGrowthChart.tsx` (recharts)
- `src/components/admin/sections/UserManagement.tsx`
- `src/components/admin/sections/SeoHub.tsx`
- `src/components/admin/sections/DatabaseExplorer.tsx`
- `src/components/admin/sections/SystemLogs.tsx`

**Files edited**
- `vite.config.ts` — add `resolve: { dedupe: ["react", "react-dom"] }` (permanent fix for duplicate-React class of crash) + one-shot `optimizeDeps.force` on next dev run.
- `src/App.tsx` — register `<Route path="/admin-panel" element={<AdminGuard><Admin /></AdminGuard>} />`.
- `src/components/layout/AppSidebar.tsx` — conditional admin link in footer.
- `src/i18n/locales/en.ts`, `src/i18n/locales/sk.ts` — `admin.*` + `sidebar.adminPanel`.

**Migration (one)**
Idempotent SQL to grant admin to `larsenevans@proton.me` if a matching `auth.users` row exists:

```sql
insert into public.user_roles (user_id, role)
select u.id, 'admin'::app_role
from auth.users u
where u.email = 'larsenevans@proton.me'
on conflict (user_id, role) do nothing;
```

No schema or RLS changes — existing admin policies cover all reads/writes used here.

**Cache cleanup**
The build step will delete `node_modules/.vite` so the next dev start re-bundles cleanly against the deduped React.

**Out of scope**
- True user impersonation (needs a service-role edge function).
- Realtime subscriptions on the explorer (manual Refresh only).
- Actual SEO plugin code — just the slot + placeholder cards.

