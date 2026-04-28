# 🦆 RUBBERDUCK.SPACE | PWA Flipper OS

**The Ultimate Intelligence Suite for micro-SaaS Founders & Brokers.**

RUBBERDUCK.SPACE is a specialized Progressive Web App (PWA) designed to audit, value, and manage micro-SaaS portfolios. It bridges the gap between code quality and market valuation, providing founders with actionable insights to maximize their exit price.

---

## 🚀 Core Features

### 1. 🧠 AI-Powered Valuation Engine
*   **Deep Code Audit**: Connect a GitHub repository for a recursive technical analysis.
*   **Multiplier Logic**: Automatically calculates industry-standard multipliers (30x-48x) adjusted by code health (TypeScript, Tests, CI/CD, Commit Velocity).
*   **Investor-Ready Reports**: Generates professional PDF decks with executive summaries and technical health scores.

### 2. 📊 Portfolio Kanban & CRM
*   **Deal Flow Management**: Track your PWAs through stages: *Building*, *Listed*, *Negotiating*, and *Sold*.
*   **Buyer CRM**: Manage potential acquirers and log outreach attempts.
*   **Market Intel**: Integrated tracker for Acquire.com and Flippa listings to stay ahead of market trends.

### 3. 🌐 Elite PWA Experience
*   **Offline First**: Built with `vite-plugin-pwa` for a native-like mobile experience.
*   **Glassmorphic UI**: High-end aesthetics using Tailwind CSS, Framer Motion, and Shadcn UI.
*   **Multi-language Support**: Full Slovak (SK) and English (EN) localization.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS |
| **Backend** | Supabase (PostgreSQL, Edge Functions, Auth) |
| **AI** | Gemini 2.5 Pro via Lovable AI Gateway |
| **Deployment** | Lovable.dev (Hosting), Supabase Edge (Cloud Logic) |
| **Tooling** | Biome (Linting/Formatting), Vitest (Testing) |

---

## 🚦 Getting Started

### Prerequisites
*   Node.js (v20+)
*   Supabase CLI
*   Docker (for local Edge Function testing)

### Installation
```bash
# 1. Clone the repository
git clone https://github.com/you640/pwa-flipper-os.git

# 2. Install dependencies
npm install

# 3. Environment Setup
# Copy .env.example to .env and fill in your Supabase credentials
cp .env.example .env

# 4. Start Development Server
npm run dev
```

### Edge Functions Deployment
To deploy the valuation engine:
```bash
supabase secrets set GITHUB_TOKEN=your_token LOVABLE_API_KEY=your_key
supabase functions deploy valuate-pwa --no-verify-jwt
```

---

## 📈 Optimization & Performance
*   **Code Splitting**: Implemented `React.lazy` for route-based chunking to ensure fast initial load.
*   **Security**: Strict Type-safety with TypeScript 5.8 and automated linting via Biome.
*   **SEO**: Dynamic metadata management for maximum search visibility.

---

## 🤝 Contribution
1.  Ensure all changes pass `npx biome check .`
2.  Maintain 100% type coverage (avoid `any`).
3.  Sync all `i18n` keys between `en.ts` and `sk.ts`.

---

**Built with ❤️ for the Indie Hacker Community.**
[rubberduck.space](https://rubberduck.space)
