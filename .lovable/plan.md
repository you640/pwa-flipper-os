

# Functional Profile Button & Settings

Make the topbar profile button (currently static "Alex Kovács / Founder") fully functional — load the real signed-in user, show their initials/avatar, and wire up working Profile, Billing, and Settings pages.

## What you'll get

**1. Real user identity in the Topbar**
- Replace hardcoded "Alex Kovács / Founder" with the actual signed-in user.
- Display name = `profiles.display_name` (fallback to email prefix).
- Role chip = "Admin" if user has admin role, else "Member".
- Avatar shows uploaded image (from Storage) or auto-generated initials.
- Live updates via `onAuthStateChange` — no stale data after login/logout.

**2. Profile page (`/profile`)**
- Glassmorphic card matching the dashboard aesthetic.
- Editable: display name, avatar (upload to a new `avatars` storage bucket), bio.
- Read-only: email, account created date, role badge.
- Save button persists to a new `profiles` table.

**3. Settings page (`/settings`)**
- **Account**: change email, change password (via `supabase.auth.updateUser`).
- **Appearance**: theme toggle (dark/light/system) persisted to localStorage.
- **Notifications**: toggles for email alerts (stored in profiles table).
- **Danger zone**: sign out everywhere, delete account (calls an edge function).

**4. Billing page (`/billing`)**
- Placeholder with "Coming soon" state, current plan card ("Founder — Unlimited" for admin), and a CTA. Keeps the dropdown link functional.

**5. Wired dropdown menu**
- Profile → `/profile`
- Billing → `/billing`
- Settings → `/settings`
- Sign out → already works.
- Sidebar "Settings" cog → `/settings` too.

## Technical Details

**Database (new migration)**
- Create `public.profiles` table:
  - `id uuid PK references auth.users(id) on delete cascade`
  - `display_name text`, `avatar_url text`, `bio text`
  - `email_notifications boolean default true`
  - `created_at`, `updated_at`
- Enable RLS:
  - Users can SELECT/UPDATE their own row.
  - Admins can SELECT all (uses existing `has_role`).
- Trigger `handle_new_user()` on `auth.users` insert → auto-create profile row with `display_name = split_part(email, '@', 1)`.
- Backfill profiles for existing users.
- Create `avatars` storage bucket (public read), with RLS so users can only upload/update files under `{user_id}/...`.

**Edge function**
- `delete-account` — uses service role to delete the calling user from `auth.users` (cascade removes profile, roles, portfolio, etc.).

**Frontend**
- New hook `src/hooks/useProfile.ts` — fetches session + profile + admin role, exposes `{ user, profile, isAdmin, refresh }`. Subscribes to `onAuthStateChange`.
- Update `src/components/layout/Topbar.tsx` to consume the hook, render real name/initials/avatar, and link dropdown items to the new routes.
- Update sidebar Settings button to `<NavLink to="/settings">`.
- New pages: `src/pages/Profile.tsx`, `src/pages/Settings.tsx`, `src/pages/Billing.tsx` (each with `<SEO />`, `<AppLayout>`, glass cards consistent with the existing design system).
- Register the three routes inside the `<AuthGuard>` block in `src/App.tsx`.

**Files**
- Created: migration SQL, edge function `delete-account/index.ts`, `src/hooks/useProfile.ts`, `src/pages/Profile.tsx`, `src/pages/Settings.tsx`, `src/pages/Billing.tsx`
- Edited: `src/App.tsx`, `src/components/layout/Topbar.tsx`, `src/components/layout/AppSidebar.tsx`

