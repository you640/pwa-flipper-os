

# Industry News upgrade

Refresh the Dashboard's Industry News section with more articles, a denser responsive grid, robust image fallbacks, uniform card heights, full i18n, and a compact "Show More" UX so the dashboard stays short by default.

## What you'll get

**1. More articles, smarter fetch**
- Endpoint switched to `https://dev.to/api/articles?tag=pwa&per_page=24`.
- Up to 24 articles loaded; gracefully handles fewer results.

**2. Responsive 4-column grid with staggered animation**
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Cards animate in with a Framer Motion stagger (parent `staggerChildren`, child fade + lift), capped so later cards still feel snappy.

**3. Premium image fallback (no broken icons)**
- A new `<NewsCover>` subcomponent owns image state (`loading | loaded | error`).
- If `cover_image` is missing OR `onError` fires, it renders a branded gradient (using existing `bg-gradient-primary` / purple→cyan tokens) with a centered `Globe` icon (subtle, 30% opacity) plus a faint radial sheen.
- Skeleton shown while the image is still loading so we never flash a half-loaded picture.

**4. Uniform card heights**
- Titles forced to `line-clamp-2` with a fixed `min-h` so 1-line and 2-line titles produce identical card heights.
- Cover area fixed height (`h-36`), meta row pinned to the bottom via `flex flex-col` + `mt-auto`.

**5. Full i18n**
- All visible strings go through `t()`:
  - `dashboard.newsTitle` → "Industry News" / "Novinky z odvetvia"
  - `dashboard.newsSource` → "via dev.to" / "cez dev.to"
  - `dashboard.readArticle` → "Read Article" / "Čítať článok"
  - `dashboard.newsError` (existing)
  - New: `dashboard.newsShowMore` ("Show more") / `dashboard.newsShowLess` ("Show less")
  - New: `dashboard.newsLiveBadge` ("live" / "naživo") rendered as a small badge next to the source
- EN and SK locale files updated; existing keys kept as-is, just retuned to drop the trailing "· live" since it becomes a separate badge.

**6. Compact-by-default UX**
- Show the first **8** articles (2 rows on desktop) by default.
- A centered ghost button toggles between "Show more (24)" and "Show less", animating the extra rows in/out via Framer Motion's `AnimatePresence` with a height + fade transition.
- No extra scroll container — the page stays compact, and expansion is opt-in.

## Technical approach

**File edited:** `src/components/dashboard/IndustryNews.tsx` — rewritten to:
- Fetch 24 articles, store full list, derive `visible = expanded ? all : all.slice(0, 8)`.
- Replace the inline `<img>` block with `<NewsCover article={a} />` (defined in the same file) handling `error` state and rendering the gradient + `Globe` fallback.
- Wrap the grid in a `motion.div` with `variants` for staggered children; each card uses a child variant (`opacity 0 → 1`, `y 12 → 0`, 0.35s ease-out, stagger 0.04s).
- Add `<AnimatePresence>` around the overflow rows so collapsing animates smoothly.
- Add `Show more / Show less` button (shadcn `Button variant="ghost"`) below the grid, hidden when `articles.length <= 8`.

**Files edited:** `src/i18n/locales/en.ts`, `src/i18n/locales/sk.ts` — add `newsShowMore`, `newsShowLess`, `newsLiveBadge`; trim `newsSource` to just "via dev.to" / "cez dev.to".

**No other files** need to change — `Index.tsx` already renders `<IndustryNews />` and doesn't need updates.

