

# AI Brain & Outreach Engine

Two production-ready AI features bundled into one upgrade: an **AI Valuation Engine** that replaces the rule-based multiplier on `/valuation`, and an **AI Outreach Engine** in the CRM lead sheet that turns each lead into a personalized cold email — both powered by Lovable AI Gateway (no API key needed).

---

## 1) AI Valuation Engine

**Edge function: `valuate-pwa`** (`verify_jwt = true` via in-code JWT validation, CORS enabled)
- Input: `{ name, url?, mrr, expenses, tech_stack?, niche, notes? }` validated with Zod.
- Calls Lovable AI Gateway with `google/gemini-2.5-pro` using **tool-calling** (`tool_choice` forced) to guarantee structured JSON:
  ```json
  {
    "estimated_valuation": { "low": 12000, "mid": 18000, "high": 25000 },
    "multiple": 3.2,
    "risk_score": 4,
    "value_up_tips": [
      { "title": "...", "impact": "high|medium|low", "detail": "..." },
      ...
    ],
    "summary": "2-3 sentence executive summary"
  }
  ```
- Returns 429/402 errors verbatim with friendly toast text on the client.
- System prompt: hardcoded on backend, instructs Gemini to act as a senior micro-SaaS broker, weight niche multipliers, factor MRR/expenses/burn, and produce realistic EU-market valuations in USD.

**DB migration: `portfolio_audits`**
```sql
create table public.portfolio_audits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  portfolio_id uuid references public.portfolio(id) on delete cascade,
  inputs jsonb not null,
  ai_report jsonb not null,
  model text not null default 'google/gemini-2.5-pro',
  created_at timestamptz not null default now()
);
alter table public.portfolio_audits enable row level security;
-- user policies (select/insert/delete own) + admin select-all, mirroring portfolio.
```

**UI rebuild — `src/pages/Valuation.tsx`**
- Keep the form (Name, MRR, Expenses, Niche) and add **App URL** + **Tech Stack** inputs.
- Replace static "Save to Portfolio" CTA with a primary **`✨ Magic AI Audit`** button (gradient + shadow-glow + animated shimmer).
- During run: glowing "Analyzing your PWA…" pulse on the right card with a 4-step progress indicator (Parsing → Benchmarking → Pricing → Strategy) animated via framer-motion.
- On success: **AI Valuation Report** card animates in (`scale-in` + stagger) with:
  - Hero: mid valuation with low–high range bar
  - Multiple badge + Risk score gauge (color-coded green/amber/red)
  - 3 **Value-up tips** as collapsible cards with `Sparkles` / `TrendingUp` / `Zap` icons
  - Executive summary
- Two CTAs: **Apply to Portfolio** (insert/update `portfolio` with `asking_price = mid`, `status = 'For Sale'`) + saves the audit row referencing the new `portfolio_id`. **Save Audit Only** (just inserts into `portfolio_audits`).
- Past audits drawer (last 5) toggled by a small button in the header.

---

## 2) AI Outreach Engine (CRM)

**Edge function: `draft-outreach`** (verify_jwt in-code)
- Input: `{ lead_id, portfolio_id }` validated with Zod.
- Server-side: fetches the lead + portfolio + latest `portfolio_audits.ai_report` for that portfolio (RLS scoped to caller).
- Calls Lovable AI Gateway `openai/gpt-5-mini` (cheaper, great writer) with tool-calling returning:
  ```json
  { "subject": "...", "body_markdown": "...", "tone": "consultative" }
  ```
- Prompt rules: opens with one specific observation about the agency's niche, weaves in MRR + 1–2 value-up tips as "why this is a fit for *their* book of business", clear CTA, max 140 words, signs off with the user's `display_name`.

**UI — `src/pages/CRM.tsx` Lead Sheet**
- Add `Tabs` to the existing `Sheet`: **Details** (current content) / **AI Outreach** (new).
- AI Outreach tab:
  - **Select** dropdown listing the user's portfolio apps (shows name + MRR).
  - **`Generate Pitch`** button → loading skeleton over a glassy email preview.
  - Editable **Subject** input + Markdown-rendered **Body** (with `Edit` toggle to a `Textarea`).
  - Footer actions:
    - **Copy** (clipboard)
    - **Open in Mail** (`mailto:` with subject + body, URL-encoded — works today)
    - **Send via Resend** disabled with tooltip "Coming soon — connect Resend in Settings" (slot ready for the connector flow later)
  - Persist draft to component state per lead during the session; no DB writes for drafts in this iteration.

---

## 3) i18n — full coverage

**`src/i18n/locales/en.ts`** + **`sk.ts`** add:
- `valuation.ai.*`: `auditButton`, `analyzing`, `steps.{parsing,benchmarking,pricing,strategy}`, `report.{title,range,multiple,risk,tips,summary}`, `applyToPortfolio`, `saveAuditOnly`, `pastAudits`, `errors.{rateLimit,credits,generic}`.
- `crm.outreach.*`: `tab`, `selectApp`, `generate`, `regenerate`, `subject`, `body`, `copy`, `openInMail`, `sendViaResend`, `comingSoon`, `errors.{noApp,rateLimit,credits,generic}`.

---

## 4) Files

**Created**
- `supabase/functions/valuate-pwa/index.ts`
- `supabase/functions/draft-outreach/index.ts`
- `src/hooks/useAiValuation.ts` (calls function, manages state, returns `{ run, loading, report, error }`)
- `src/hooks/useAiOutreach.ts` (same pattern)
- `src/components/valuation/AiReportCard.tsx`
- `src/components/valuation/AnalyzingState.tsx`
- `src/components/crm/OutreachTab.tsx`
- `supabase/migrations/<ts>_portfolio_audits.sql`

**Edited**
- `src/pages/Valuation.tsx` — wires form → `useAiValuation` → report card; keeps fallback rule-based estimate visible until first AI run.
- `src/pages/CRM.tsx` — adds `Tabs` inside the existing lead `Sheet` and mounts `OutreachTab`.
- `src/i18n/locales/en.ts`, `src/i18n/locales/sk.ts`.
- `supabase/config.toml` — register both functions.

---

## 5) Security & cost guardrails

- Both edge functions validate Supabase JWT in code (caller's `auth.uid()` is used to scope DB reads via the user's access token, so RLS still applies — admin override not used).
- Zod input validation; reject payloads >4KB.
- Hard cap: `max_tokens` ~700 on valuation, ~400 on outreach.
- All AI calls non-streaming + tool-calling → single round-trip → **lowest credit burn** for the same UX (no streaming overhead, deterministic JSON).
- Surface `429` (`valuation.ai.errors.rateLimit`) and `402` (`...credits`) as sonner toasts in EN/SK.

---

## 6) Out of scope (explicit)

- Real Resend integration (button is disabled with a "Coming soon" tooltip; connector wiring is a follow-up).
- AI URL crawling / screenshotting — `url` is passed to the model as text only.
- Streaming token-by-token rendering — replaced with the 4-step animated "Analyzing" sequence to keep credit usage flat.
- Audit history pagination beyond last 5.

