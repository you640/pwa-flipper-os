# RUBBERDUCK.SPACE — Final Polish: 10 Funkcií na 99.99%

**Stratégia:** Funkčnosť → Polish. Pre každú z 10 funkcií najprv dotiahnem chýbajúce wiring, potom opravím bugy, na konci jeden i18n + responsive sweep.

---

## 🎯 Funkcia 1 — Landing Page & Anonymný Audit
**Stav:** ✅ Funguje, treba doladiť konverziu a SEO.
- Pridať **JSON-LD `SoftwareApplication`** schema do `Landing.tsx` (Helmet) — boost pre Google rich snippets na keywords "SaaS valuation", "GitHub code audit".
- Pridať **trust strip** pod hero (Powered by Gemini 2.5 Pro · No signup required · 100% private).
- Pridať `prefers-reduced-motion` guard do `AnalyzingState.tsx` — používatelia s motion-sensitivity dostanú statickú verziu.
- Opraviť `<TeaserResult>` na 320px viewport (aktuálne sa rozbíja layout chips).

## 🎯 Funkcia 2 — AI Valuation Lab (`/valuation`)
**Stav:** ✅ Funguje, ale chýba history a re-run guard.
- **Audit History panel** na pravej strane (last 5 audits z `portfolio_audits` cez `useQuery`) — klik načíta starý report do `AiReportCard`.
- **Re-run protection:** ak používateľ kliká „Magic AI Audit" 2× za 10s, debounce + warning toast (šetrí kredity).
- Validácia GitHub URL aj na **paste event** (auto-trim, strip `.git` suffix).
- Pridať „Clear form" tlačidlo.

## 🎯 Funkcia 3 — Investment Report (PDF + Share OG)
**Stav:** ⚠️ PDF funguje (Roboto), Share image je iba client canvas → nie je hostovateľný link.
- **Nová edge funkcia `og-share`** (Deno + `https://deno.land/x/og_image`) → vracia PNG 1200×630 podľa query params (`?app=...&val=...&score=...`). Endpoint `/functions/v1/og-share` sa pridá ako `<meta property="og:image">` do reportu, takže LinkedIn/Twitter/X scraper ho stiahne.
- Dlhodobé share linky: nová tabuľka `public_audits` (id, audit_id FK, slug unique, created_at) + RLS „anyone read by slug" → public URL `/r/{slug}` zobrazí read-only TeaserResult bez blur. Migrácia + nová route `Report.tsx`.
- PDF: pridať QR kód (cez `qrcode` lib) na cover page → odkazuje na public report URL.
- Opraviť: `exportInvestorPdf` občas crashuje keď `tech_stack_audit.detected_stack` je `undefined` → null-guards.

## 🎯 Funkcia 4 — Portfolio Kanban
**Stav:** ⚠️ Drag funguje, chýba CRUD.
- **„Add App" dialog** (Plus tlačidlo v hlavičke) → form: name, mrr, expenses, asking_price, status. Insert do `portfolio` s `user_id = auth.uid()`.
- **„Edit App" dialog** (klik na kartu) → rovnaký form, update.
- **Delete** s AlertDialog confirmáciou.
- **Optimistic update rollback hardening:** `handleDragEnd` už drží predošlý stav, doplním **try/catch + toast + rollback aj na network error** (nielen Supabase error). Test scenár: vypnúť wifi → drag → musí sa vrátiť karta.
- Empty state CTA „Audit your first repo" → linkuje na `/valuation`.

## 🎯 Funkcia 5 — Deal Room (Public For-Sale Marketplace)
**Stav:** ❌ Chýba úplne (iba `for_sale` flag existuje).
- **Nová route `/deals`** — verejná (no auth), zobrazuje grid kariet pre každý `portfolio` row kde `for_sale = true`. Karta: app name, MRR, asking price, code score (z latest audit), „Contact Seller" tlačidlo.
- **RLS migrácia:** pridať policy `Anyone view for_sale portfolio` (USING `for_sale = true`) — read-only public.
- **Contact Seller flow:** modal → email + správa → insert do novej tabuľky `deal_inquiries` (RLS: anon insert, admin select, owner select via `portfolio.user_id`). Notifikuje vlastníka cez Resend (viď Funkcia 6).
- Filtre: niche, price range, MRR range, code score min.
- Link v Topbare „Deal Room" pre prihlásených, v Landing footer pre anonymných.

## 🎯 Funkcia 6 — CRM + AI Outreach (s Resend)
**Stav:** ⚠️ Outreach drafts fungujú, „Send via Resend" je disabled tooltip.
- **Pripojiť Resend connector** cez `standard_connectors--connect`. Používateľ musí raz klikom potvrdiť connect.
- **Nová edge funkcia `send-outreach`:** dostane `lead_id`, načíta draft + lead email, pošle cez Resend gateway (`from: outreach@rubberduck.space` po overení domény, fallback `onboarding@resend.dev` pre testing).
- Aktualizovať `OutreachTab.tsx`: tlačidlo „Send via Email" enable, po úspechu update lead status na `Contacted`, zapísať `last_outreach_at` (nový stĺpec na `crm_leads`).
- Bulk outreach: checkbox v CRM tabuľke + „Send to selected" akcia (max 10 naraz, throttle 1s).
- Inquiry notifikácie z Deal Roomu (Funkcia 5) tiež pôjdu cez `send-outreach` (interný call).

## 🎯 Funkcia 7 — Market Intel (`/market`)
**Stav:** ⚠️ Funguje, chýba analytika a real data feed.
- **Niche distribution chart** (Recharts pie/donut) — agregát z `market_intel.niche`.
- **Avg multiple by niche** stĺpcový graf (cena ÷ MRR pre rows kde MRR > 0).
- **Sortable & filterable table** (už čiastočne je) — pridať CSV export tlačidlo (`papaparse`).
- **„Compare to my portfolio" toggle** — overlay user's portfolio rows na chartoch, vidí kde stojí vs. trh.

## 🎯 Funkcia 8 — Pricing + Stripe Pro Tier
**Stav:** ⚠️ Waitlist funguje, Stripe nie je wired.
- **Spustiť `payments--recommend_payment_provider`** → očakávam Stripe (digital SaaS).
- **`payments--enable_stripe_payments`** → Lovable spraví seamless setup.
- Vytvoriť produkt **„RUBBERDUCK Pro" $29/mo** cez `batch_create_product` (subscription, recurring monthly).
- **Nová tabuľka `subscriptions`** (user_id, stripe_subscription_id, tier, status, current_period_end) + RLS.
- **Edge funkcia `stripe-webhook`** na `checkout.session.completed`, `subscription.updated`, `subscription.deleted` → upsert subscriptions.
- **Quota enforcement vo `valuate-pwa`:** auth users s `tier=free` majú 1 audit/mesiac, `tier=pro` unlimited. Counter z `portfolio_audits` count where `created_at > date_trunc('month', now())`.
- **PricingTab.tsx:** „Upgrade to Pro" už neopendne waitlist ale priamo Stripe Checkout (cez novú `create-checkout` edge funkciu). Waitlist ostane iba pre „Exit (5%)" tier.
- **„Pro" badge** v Topbare profile dropdown ak je active.

## 🎯 Funkcia 9 — Settings / Profile / Auth
**Stav:** ✅ Funguje, treba dotiahnuť polish a Google OAuth.
- **Google OAuth tlačidlo** v `Login.tsx` — Supabase má provider built-in, len treba `signInWithOAuth({ provider: 'google' })`.
- **Profile.tsx:** zobraziť aktuálny **subscription status** (Free/Pro) + „Manage billing" tlačidlo → Stripe customer portal (cez novú `customer-portal` edge funkciu).
- **Avatar upload progress indicator** + retry on failure (zo `avatar_upload_errors` tabuľky vidno že fail rate je problém).
- **Email confirmation banner** ak `auth.user.email_confirmed_at` je null → reminder + „Resend" tlačidlo.

## 🎯 Funkcia 10 — Admin God View (`/admin-panel`)
**Stav:** ⚠️ Funguje, chýba success-fee tracking a real-time.
- **Success Fee Tracker karta:** nová sekcia v GlobalPulse — „Sold Apps" karta (count + total exit value zo `status = 'Sold'`), „Pending Commissions" (5% z forSale potential).
- **Deal Inquiries panel:** nová admin sekcia — tabuľka všetkých `deal_inquiries` (z Funkcie 5) s linkom na lead.
- **Pricing Waitlist export** — CSV download tlačidlo (záujem podľa tier).
- **Subscription overview:** aktívni Pro užívatelia, MRR z subskripcií, churn (sub.deleted minulý mesiac).
- **Real-time refresh** každých 30s (alebo Supabase realtime channel na `portfolio` + `pricing_waitlist`).

---

## 🧹 Cross-cutting Polish (po dokončení 1-10)

1. **i18n ghost hunt #2** — `rg "[^t]\\(['\"][A-Z]"` cez celý `src/`, opraviť všetky nájdené hardcoded stringy. Doplniť SK preklady pre všetky nové features (deals, subscriptions, admin extras).
2. **Mobile 320px sweep** — Landing hero, Valuation form (githubUrl input pretieka), Kanban (horizontal scroll), AdminPanel tabs (overflow), CodeHealthGauge centering.
3. **PWA polish** — overiť `manifest.json` (icons 192/512, theme color, background color), service worker registráciu (`registerSW.ts`), offline fallback page.
4. **RLS audit** — spustím `supabase--linter` po všetkých migráciách. Verify že `deal_inquiries`, `subscriptions`, `public_audits` majú správne policies.
5. **Loading states & error boundaries** — `<ErrorBoundary>` wrapper okolo každej route v `App.tsx`, Skeleton loaders všade kde chýbajú.
6. **TypeScript strict pass** — `tsc --noEmit` musí byť čisté.

---

## 📋 Realizačný plán (poradie pre minimalizáciu rework)

1. **DB migrácie naraz** (jeden balík): `public_audits`, `deal_inquiries`, `subscriptions`, `last_outreach_at` na `crm_leads`, RLS na `portfolio` pre `for_sale` public read.
2. **Stripe enable + product setup** (Funkcia 8 backend) → odomyká quota enforcement.
3. **Edge funkcie** v jednom batchi: `og-share`, `send-outreach`, `stripe-webhook`, `create-checkout`, `customer-portal`. Deploy + smoke test cez `curl_edge_functions`.
4. **Resend connector connect** (vyžaduje user click — pripravím prompt).
5. **Frontend features:** Funkcie 1-10 vyššie, postupne. Po každej `tsc --noEmit`.
6. **Polish sweep** (i18n, mobile, PWA, RLS lint).
7. **Final QA:** každú z 10 funkcií manuálne otestujem cez `curl_edge_functions` + `read_query` + `read_console_logs`.

---

## ⚠️ Riziká & Mitigations

- **Stripe enablement** vyžaduje Pro plán Lovable. Ak ho nemáš, túto časť odložím a spravím iba waitlist polish.
- **Resend connector** vyžaduje tvoje schválenie (jeden klik). Pripomeniem ti.
- **Custom doména pre `from: outreach@rubberduck.space`** — overenie DNS môže trvať. Začnem s `onboarding@resend.dev`, dokumentujem upgrade path.
- **Credits:** je to tučný balík (10 funkcií × hĺbka). Ak začnem dochádzať, dám ti choice point „pokračovať / pause".

---

## 🎯 Definícia hotového „99.99%"

✅ Všetkých 10 funkcií má kompletný happy-path end-to-end (no dead buttons, no „coming soon" okrem zámerne odložených).  
✅ Žiadne hardcoded EN/SK stringy v UI.  
✅ Všetky tabuľky majú RLS, `supabase--linter` clean.  
✅ Mobile 320px-1920px bez overlapov.  
✅ PWA installable, offline fallback funguje.  
✅ Stripe Pro upgrade end-to-end testovaný v sandbox móde.  
✅ Resend reálne odošle email (test do tvojho inboxu).  
✅ `tsc --noEmit` clean.  
✅ Krátky CHANGELOG na konci čo sa zmenilo.