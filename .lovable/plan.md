

# Wire Overview page to Supabase

Replace mock data and the bare-minimum portfolio query on the Overview (Index) page with real, fully-typed Supabase queries against `portfolio`, `market_intel`, and `crm_leads`, with proper loading skeletons, empty states, and error toasts. Also hook the greeting to the signed-in user.

## What you'll get

**1. New data hook: `src/hooks/useOverviewData.ts`**
- Single hook that fires three queries in parallel via `Promise.all`:
  - `portfolio` → `select("asking_price, mrr, expenses, status, name, created_at")`
  - `market_intel` → `select("name, niche, source, mrr, price, created_at").order("created_at", { ascending: false }).limit(20)`
  - `crm_leads` → `select("agency_name, status, contact_email, notes, created_at").order("created_at", { ascending: false }).limit(20)`
- Returns `{ portfolio, market, leads, loading, error, refetch }`. Each list is `null` until first load, `[]` when empty.
- Logs and surfaces errors via `useToast` (one toast per failed source, localized via `t("overview.loadError", { source })`).
- Re-runs on auth state change so the page repopulates after login (subscribes to `supabase.auth.onAuthStateChange`).

**2. Overview page (`src/pages/Index.tsx`) wired to live data**
- Replaces the inline `useEffect` with `useOverviewData()`.
- Greeting uses `useProfile().displayName` instead of hardcoded "Alex".
- Metric cards now derived from real rows:
  - **Total Portfolio Value** — sum of `asking_price` for non-Sold portfolio rows.
  - **Combined MRR** — sum of `mrr` for non-Sold portfolio rows.
  - **Active Apps** — count of non-Sold portfolio rows.
  - **Total Exits** — sum of `asking_price` for `status = "Sold"` portfolio rows.
- New small **Market Pulse** strip under the metric cards (3 mini-stats from `market_intel`):
  - Avg market price, avg market MRR, deals tracked. Shown only when `market.length > 0`; otherwise an empty-state line "No market intel yet — add comparables in Market".
- Replaces the `IndustryNews` slot with a two-column row on `xl`: keeps `IndustryNews` left, adds a real `<ActivityFeed />` on the right.

**3. Real `ActivityFeed.tsx` driven by `crm_leads` + recent `portfolio` changes**
- Component now accepts `{ leads, portfolio, loading }` props (no more hardcoded array).
- Builds a unified, time-sorted activity list (newest 8):
  - For each lead: actor = `agency_name`, message = localized `t("overview.activity.lead", { status })` with `notes` snippet, status badge = mapped from `lead_status` enum (`Lead`, `Contacted`, `Qualified`, `Won`, `Lost`).
  - For each portfolio row: actor = "Portfolio", message = `${name} — ${status}`, status mapped to `valuation`/`listed`/`sold`.
- `time` rendered with `Intl.RelativeTimeFormat` via `useLocale().intlLocale` ("12m ago", "Pred 3 h").
- States:
  - Loading → 5 skeleton rows.
  - Empty → glass empty card with `Inbox` icon + `t("overview.activity.empty")` and a "Add a lead" link to `/crm`.
- Initials derived from first letters of `agency_name`/`name`; gradient `hue` picked deterministically from a small palette by hashing the id.

**4. Loading & error UX**
- All four `MetricCard`s already accept `loading` — keep using it; values fall back to `0` while loading so the count-up animation runs once data arrives.
- `ProjectionChart` keeps receiving `combinedMRR`; when `loading` it renders with 0 (existing behavior is fine — chart curve is generated).
- Errors: red inline banner above the metric grid `t("overview.errorBanner")` with a "Retry" button calling `refetch()`. Banner only shows if `error` is set after first attempt.

**5. i18n additions** (`src/i18n/locales/en.ts` + `sk.ts`)
- `overview.loadError`, `overview.errorBanner`, `overview.retry`
- `overview.marketPulse.title`, `.avgPrice`, `.avgMrr`, `.deals`, `.empty`
- `overview.activity.title`, `.live`, `.empty`, `.emptyCta`, `.lead.{Lead,Contacted,Qualified,Won,Lost}`, `.portfolio.{Building,Listed,Negotiating,Sold}`
- `overview.relativeTime.{justNow}` (used as fallback)

## Technical details

**Files created**
- `src/hooks/useOverviewData.ts`

**Files edited**
- `src/pages/Index.tsx` — swap inline query for hook, render `<ActivityFeed leads={...} portfolio={...} loading={...} />`, add Market Pulse + error banner, use `displayName`.
- `src/components/dashboard/ActivityFeed.tsx` — convert to props-driven, add loading/empty states, integrate `Intl.RelativeTimeFormat`.
- `src/i18n/locales/en.ts`, `src/i18n/locales/sk.ts` — new keys above.

**Type safety**
- Reuse the generated row types from `@/integrations/supabase/types` via `Database["public"]["Tables"][T]["Row"]` — no hand-typed interfaces that can drift from the schema.

**RLS**
- All three tables already have `auth.uid() = user_id` SELECT policies, so authenticated users see only their own rows. No schema or policy changes required.

**Out of scope**
- No DB migrations.
- No new tables, no realtime subscriptions (can be a follow-up — current pattern is fetch-on-mount + auth change).
- `ProjectionChart` keeps its synthetic forecast curve; turning it into a real time series belongs to a separate task.

