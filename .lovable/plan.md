
# PWA Flipper OS — Command Center

A premium, dark-mode command center for managing, valuing, and selling micro-SaaS / PWA projects. This first build delivers the full app shell + a polished Overview dashboard with mock data. Backend (Supabase / Lovable Cloud) and remaining pages will be wired in subsequent steps.

## Design system
- **Mode:** Dark by default (Vercel / Linear vibe)
- **Surface:** Deep near-black background, layered glassmorphism cards (semi-transparent, backdrop blur, subtle 1px border)
- **Accent:** Electric violet → cyan gradient for highlights, glows, and chart fills
- **Typography:** Clean sans (Inter), tight tracking on headings, muted secondary text
- **Effects:** Soft glowing borders on metric cards, hover lift, smooth transitions
- All colors as HSL tokens in `index.css` + `tailwind.config.ts` (no hardcoded colors in components)
- **Include Framer Motion. Add a subtle fade-in and slide-up animation (`initial={{ opacity: 0, y: 10 }}`) when the Dashboard components mount, to make it feel truly premium.**

## App shell

**Sidebar (permanent, collapsible to icon-only on mobile)**
- Logo / brand mark "PWA Flipper OS"
- Nav items with Lucide icons:
  - Overview — `LayoutDashboard` → `/`
  - Portfolio Kanban — `Kanban` → `/portfolio`
  - Valuation Engine — `Calculator` → `/valuation`
  - Market Intel — `Radar` → `/market`
  - Buyer CRM — `Users` → `/crm`
- Active route highlighted with gradient bar + glow
- Footer: settings icon + version tag

**Topbar**
- `SidebarTrigger` (always visible)
- Global search input (⌘K styled, mock for now)
- Notifications bell with dot indicator
- User avatar with dropdown (profile placeholder)

**Layout**
- `SidebarProvider` wrapping a full-width flex layout
- Routes registered in `App.tsx`; non-built pages render a styled "Coming soon" placeholder so navigation works end-to-end

## Overview page

**4 glowing metric cards** (responsive grid, gradient border glow, large number, trend delta with up/down arrow + sparkline-style accent)
1. Total Portfolio Value — `$248,500` ▲ 12.4%
2. Combined MRR — `$8,420` ▲ 5.1%
3. Active Buyers — `17` ▲ 3
4. Apps Sold — `6` ▲ 1 this month

**Portfolio Value Projection chart**
- Large Recharts `AreaChart`, 12 months of mock data
- Gradient fill (violet → cyan, fading to transparent)
- Glow under the line, custom dark tooltip, muted gridlines
- Header with title, subtitle, and timeframe toggle (1M / 6M / 12M / All — visual only)

**Recent Activity feed (right column on desktop, stacks on mobile)**
- Shadcn `Card` with scrollable list of ~6 entries
- Each row: Avatar + actor + action, relative timestamp, status badge
- Mix of events: new lead, valuation updated, app listed, offer received, app sold
- **Make the mock data hyper-realistic (e.g., specific agency names, real-sounding PWA project names, realistic MRR numbers).** Examples:
  - "Northbeam Digital requested demo of **InvoiceFlow PWA** ($1,240 MRR)" — 12m ago
  - "Offer received: **$18,500** for **BookingBuddy** from Rivertown Studios" — 1h ago
  - "**MenuMate PWA** listed on Acquire.com at **$24,900**" — 3h ago
  - "Valuation updated: **TaskPilot** → **$31,200** (4.2× MRR)" — 6h ago
  - "**ClinicQueue PWA** sold to Helix Marketing for **$22,000**" — yesterday
  - "New lead: **Brightpath Agency** interested in **FormForge**" — 2d ago

**Responsiveness**
- Desktop: 3-col grid (chart spans 2, activity spans 1)
- Tablet: chart full width, activity below
- Mobile: single column, sidebar collapses to icon strip with always-visible trigger

## Out of scope for this step (queued for next prompts)
- Connecting Lovable Cloud / Supabase (portfolio, market_intel, crm_leads tables + RLS)
- Building Portfolio Kanban, Valuation Engine, Market Intel table, Buyer CRM pages
- Auth & user-scoped data
