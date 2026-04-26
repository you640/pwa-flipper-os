# 🔍 Audit nefunkčných komponentov a funkcií

Po prehľadaní celého kódu — toto je presný zoznam **čo nefunguje, chýba, alebo je len napoly zapojené**. Rozdelené podľa 10 hlavných funkcií (z poslednej dohody „Plný sweep").

---

## ❌ KRITICKÉ — chýbajú úplne (DB existuje, kód nie)

### 1. **Deal Room (`/deals`) — neexistuje**
- DB tabuľka `deal_inquiries` ✅ vytvorená, RLS `Anyone view for_sale portfolio` ✅
- **Chýba**: stránka `src/pages/DealRoom.tsx`, route v `App.tsx`, link v sidebare
- **Dôsledok**: kupujúci sa nemajú kde dostať k apkám „For Sale" → celý lead-magnet funnel končí na slepej koľaji

### 2. **Audit History panel vo Valuation Lab**
- DB tabuľka `portfolio_audits` ✅ existuje a zapisuje sa do nej (`Valuation.tsx:141`)
- **Chýba**: žiadne UI ktoré by načítalo a zobrazilo predošlé audity
- **Dôsledok**: user spraví 5 auditov a nemá kde ich pozrieť späť

### 3. **Public Audit Reports (`/r/:slug`)**
- DB tabuľka `public_audits` ✅ s public RLS
- **Chýba**: edge function ktorá generuje slug + insertne row, stránka `/r/:slug`, „Share public link" tlačidlo
- **Dôsledok**: OG share image generuje len lokálny PNG, neexistuje URL na ktorú by viedol

### 4. **Stripe — 0% implementované**
- DB tabuľka `subscriptions` ✅, ale **0 INSERT policies** (nikto do nej nevie zapísať)
- **Chýba**: edge functions `create-checkout`, `customer-portal`, `stripe-webhook`; secret `STRIPE_SECRET_KEY`; tier gating v `valuate-pwa`
- **Dôsledok**: Pricing tab je čistá maketa — „Upgrade" otvorí len waitlist dialog (email capture), nikto reálne neplatí

### 5. **Resend / Send Outreach — 0% implementované**
- `crm_leads.last_outreach_at` stĺpec ✅ pridaný
- **Existuje len** `draft-outreach` (generuje text cez AI)
- **Chýba**: edge function `send-outreach` ktorá to reálne pošle + RESEND_API_KEY connector
- **Dôsledok**: CRM len vygeneruje text na copy/paste, nič neposiela

---

## ⚠️ NAPOLY ZAPOJENÉ — fungujú s dierami

### 6. **Portfolio Kanban — chýba CRUD**
- Drag-and-drop ✅, status update ✅
- **Chýba**: „Add Project" tlačidlo (v `KanbanColumn` je `+` ikonka **bez handlera**), Edit dialog, Delete
- **Dôsledok**: nové projekty sa dajú pridať len cez Valuation flow → user nemôže ručne pridať existujúcu apku

### 7. **Google OAuth login**
- `Login.tsx` má len email/password
- **Chýba**: `signInWithOAuth({ provider: 'google' })` button + Google provider povolenie
- Pôvodne sľúbené v inštrukciách („Add google authentication unless explicitly asked otherwise")

### 8. **Market Intel — žiadne grafy**
- Tabuľka existuje, dá sa pridať row
- **Chýba**: Recharts vizualizácie (niche distribution, multiple histogram), CSV export
- Sľúbené vo Vlne 2

### 9. **Billing.tsx — placeholder**
- Tvrdo zakódované „planFounder / planStarter" podľa `isAdmin`
- **Chýba**: čítať reálny stav z `subscriptions` tabuľky, „Manage subscription" → customer portal
- Žiadne invoices (len text „No invoices yet")

### 10. **Admin „Success Fee Tracker"**
- `GlobalPulse` ✅ ukazuje Potential Exit Value
- **Chýba**: tracking deal_inquiries (koľko buyer leads), realtime notifikácie pri novej inquiry, výpočet 5% commission ako samostatný KPI panel

---

## 🐛 MENŠIE BUGY / POLISH

### 11. **`ComingSoon.tsx`** — komponent existuje ale nie je použitý nikde (mŕtvy kód)

### 12. **Landing redirect loop risk**
`Landing.tsx:54` — ak je user logged in, redirectne na `/dashboard`, ale `useEffect` beží pri každom auth change → môže spôsobiť bliknutie/loop pri rýchlych session refreshoch

### 13. **`shareImage.ts`** — len lokálny download, žiadny upload do storage → nemôže byť použitý ako skutočný OG image (Twitter/LinkedIn potrebujú verejnú URL)

### 14. **Pricing waitlist email** — uloží sa do DB, ale **neposlie sa žiadny confirmation email** (potreba Resend)

### 15. **PWA manifest + Service Worker** — sľúbené v plnom sweep, **chýba** `public/manifest.json` a SW

### 16. **i18n diery** — niektoré nové stringy v `Landing.tsx` (napr. landing toasts) môžu chýbať v `sk.ts` — treba auditnúť

---

## 📊 STAV PODĽA 10 HLAVNÝCH FUNKCIÍ

| # | Funkcia | Stav | Chýba |
|---|---------|------|-------|
| 1 | Landing + Anon Audit | 🟢 90% | redirect polish, PWA |
| 2 | AI Valuation Lab | 🟡 75% | Audit history panel |
| 3 | Investment Report (PDF + Share) | 🟡 70% | Public report URL, OG upload |
| 4 | Portfolio Kanban | 🟡 60% | Add/Edit/Delete CRUD |
| 5 | Deal Room | 🔴 10% | celá stránka chýba |
| 6 | CRM + AI Outreach | 🟡 50% | Resend send-outreach |
| 7 | Market Intel | 🟡 40% | grafy, CSV export |
| 8 | Pricing + Stripe | 🔴 20% | celá Stripe integrácia |
| 9 | Settings/Profile/Auth | 🟡 70% | Google OAuth, billing portal |
| 10 | Admin God View | 🟢 85% | Deal inquiries widget, realtime |

---

## 🎯 NAVRHOVANÉ PORADIE OPRÁV (3 vlny, ako sme sa dohodli)

**Vlna A — najlacnejšia, najväčší dopad** (čisto frontend, žiadne nové API kľúče):
- #1 Deal Room stránka + route
- #2 Audit History panel
- #6 Portfolio CRUD (Add/Edit/Delete)
- #7 Google OAuth button
- #11–12 ComingSoon cleanup, Landing redirect fix

**Vlna B — externé integrácie** (potrebuje secrets):
- #4 Stripe (`STRIPE_SECRET_KEY`) — Pricing → real checkout
- #5 Resend connector — send-outreach + waitlist confirmation
- #9 Billing reads from `subscriptions`, customer portal

**Vlna C — pokročilé**:
- #3 Public report `/r/:slug` + OG upload do storage
- #8 Market Intel grafy + CSV
- #10 Admin deal_inquiries widget + realtime
- #15 PWA manifest + SW
- #16 i18n final sweep

---

## 🚦 ROZHODNUTIE PRE TEBA

Toto je len **audit / diagnóza** — žiadne zmeny v kóde som ešte nespravil. Po schválení tohto plánu:
- buď spravíme **Vlnu A teraz** (1 message, ~6 súborov, žiadne nové secrety),
- alebo povieš „spusti všetko" a poženieme A→B→C v sérii (B bude vyžadovať od teba `STRIPE_SECRET_KEY` a Resend connector approval).

**Čo si želáš?**
