

# RUBBERDUCK AI BRAIN — GitHub-Aware Code Auditor

Evolves the AI Valuation Engine you just approved into a **code-aware** broker. The core scaffolding (edge functions `valuate-pwa` and `draft-outreach`, the `portfolio_audits` table, `useAiValuation`/`useAiOutreach` hooks, `AiReportCard`, `AnalyzingState`, the CRM Outreach tab, EN/SK i18n) is already shipped — this upgrade extends it.

---

## 1) GitHub-aware `valuate-pwa` edge function

- New **required** input: `github_url` (validated via regex `^https?://(www\.)?github\.com/[\w.-]+/[\w.-]+/?$`).
- Server fetches the repo's "DNA" from the **GitHub REST API** (no auth needed for public repos; will use `GITHUB_TOKEN` secret if present to lift the 60/hr rate limit):
  - `/repos/{o}/{r}` — stars, forks, size, pushed_at, default_branch, license, topics, open_issues
  - `/repos/{o}/{r}/languages` — language byte distribution
  - `/git/trees/{branch}?recursive=1` — full file tree, used to detect: tests (`*.test.*`, `__tests__`, Cypress, Playwright), CI (`.github/workflows`, `.gitlab-ci.yml`), README, `tsconfig.json`, package manager (pnpm/yarn/bun/npm/poetry/cargo/go.sum), framework hints (Next, Vite, Nuxt, Remix, Astro, Svelte, Tailwind, Supabase, Prisma, Drizzle)
  - `/commits?since=30d` — `recent_commits_30d`
- This snapshot is sent into Gemini 2.5 Pro with a hardened **"Senior Code Auditor"** system prompt and **tool-calling** to guarantee JSON.
- Scoring rubric encoded in the prompt (excerpt):
  - 90-100 = "Clean as Glass" → multiplier **+25%**
  - 70-89 = "Solid" → +10%
  - 50-69 = "Mixed" → 0
  - 30-49 = "Rubberdebt" → -20%
  - 0-29 = "Toxic" → -40%
- Returns enriched JSON:
  ```ts
  {
    estimated_valuation: { low, mid, high },
    multiple, risk_score,
    code_quality_score: 0-100,
    code_quality_label: "Clean as Glass" | "Solid" | "Mixed" | "Rubberdebt" | "Toxic",
    tech_stack_audit: { summary, excellence[], tech_debt[], detected_stack[] },
    refactor_tips: [{ title, impact, detail }, ×3],
    value_up_tips: [{ title, impact, detail }, ×3],
    summary
  }
  ```
- Graceful fallback: if GitHub returns 404/private/rate-limit, the snapshot carries `fetch_error` and the AI is told to default `code_quality_score` to 50 and explain the limitation in the audit summary — no hard failure.
- Response also carries `repo_snapshot` so the UI can show stars / commits / detected stack chips.

## 2) Valuation page UI — "The Lab"

- **GitHub Repository URL (Public)** input becomes a required field with live regex validation; submit button disabled until valid.
- The "✨ Magic AI Audit" loading state is rebuilt as a 4-step animated sequence in `AnalyzingState.tsx`:
  1. **Fetching Repository Data** — pulsing `Github` icon, scanning shimmer
  2. **Analyzing Project DNA** — `Code` icon with floating snippet glyphs (`<div/>`, `useState()`, `await`) animated horizontally
  3. **Benchmarking vs. Market** — `BarChart3` icon with bars animating up
  4. **Calculating Exit Price** — `Coins` icon with rolling number ticker
  Each step ~1.2s with a connecting glowing trail. All framer-motion.
- Result: `AiReportCard.tsx` is upgraded into a **Technical Audit Report**:
  - Hero: low/mid/high valuation bar (existing)
  - **Code Health Gauge**: SVG semicircle gauge animating from 0 to `code_quality_score`, color-interpolated red → amber → green via HSL on the gauge stroke, large numeric center, label badge below ("Clean as Glass" etc.)
  - **Detected Stack** chips row from `tech_stack_audit.detected_stack`
  - Two-column **Tech Excellence** (green/check icons) vs **Tech Debt** (red/alert icons) breakdown
  - Collapsible **Refactor Tips** (×3) with impact-coded icons — same pattern as value-up tips, separately tabbed/grouped from business `value_up_tips`
  - Risk score + multiple cards (existing)
  - Apply to Portfolio / Save Audit Only (existing)
- Glassmorphic surfaces, neon `shadow-glow`, scale-in transitions retained throughout.

## 3) Technically-informed AI Outreach

- `draft-outreach` edge function pulls the **latest `portfolio_audits.ai_report`** for the selected app (already wired) and now also surfaces `code_quality_score`, `code_quality_label`, top excellence bullets, and detected stack into the GPT-5-mini prompt.
- Hardened pitch instructions:
  - Open with one observation about the agency's niche
  - **Mention the code quality score and one specific tech excellence** ("92% Code Quality, TypeScript + tests + CI")
  - Tie MRR + 1 value-up tip to *their* book of business
  - Single CTA, ≤140 words, no spam
- The CRM Outreach tab UI is unchanged: editable Subject + Body, Copy, Open in Mail, "Send via Resend" disabled with tooltip.

## 4) Database & i18n

- **No schema change** — `portfolio_audits.ai_report` is `jsonb`, the new fields just slot in. The "Apply to Portfolio" flow keeps writing the same row.
- New i18n keys (EN + SK) under existing namespaces:
  - `valuation.githubUrl`, `valuation.githubUrlPh`, `valuation.githubUrlError`
  - `valuation.ai.steps.fetching`, `analyzing`, `benchmarking`, `pricing`
  - `valuation.ai.report.codeQuality`, `codeQualityLabel`, `techExcellence`, `techDebt`, `detectedStack`, `refactorTips`, `valueUpTips`
  - `valuation.ai.report.labels.cleanAsGlass`, `solid`, `mixed`, `rubberdebt`, `toxic`
  - `valuation.ai.errors.repoNotFound`, `repoPrivate`, `repoRateLimit`
  - `crm.outreach.techPitch` (UI hint above generate button)

## 5) Files

**Edited**
- `supabase/functions/valuate-pwa/index.ts` — GitHub fetch + new schema + new prompt
- `supabase/functions/draft-outreach/index.ts` — pull tech fields into prompt
- `src/hooks/useAiValuation.ts` — extend `AiValuationReport` type with `code_quality_score`, `tech_stack_audit`, `refactor_tips`; require `github_url` in input
- `src/pages/Valuation.tsx` — add GitHub field with validation; pass `github_url`
- `src/components/valuation/AnalyzingState.tsx` — 4-step sequence with new icons + snippet glyphs
- `src/components/valuation/AiReportCard.tsx` — add Code Health gauge, stack chips, tech excellence/debt grid, refactor tips section
- `src/i18n/locales/en.ts` + `sk.ts` — new keys

**Created**
- `src/components/valuation/CodeHealthGauge.tsx` — SVG semicircle gauge (animated stroke, HSL color interpolation, numeric center)

## 6) Cost & guardrails

- Single AI round-trip per audit (tool-calling, non-streaming), `max_tokens` raised to 1500 to accommodate the richer payload — still well below burn-heavy thresholds.
- GitHub calls capped at 3 fast endpoints, gracefully degrade on rate-limit.
- Both 429 and 402 from the gateway continue to surface as friendly EN/SK toasts.
- All inputs validated server-side with Zod (incl. the GitHub URL regex) — no extra attack surface.

## 7) Out of scope (explicit)

- No real source-code reading (no clone, no file content fetched). The AI scores from metadata + file-tree heuristics; this keeps it fast, free, and works for any public repo size.
- Private repos still rejected with a friendly message (would need user OAuth — separate upgrade).
- Resend send is still a "coming soon" tooltip.
- No new tables, no migrations.

