# QuickYield — Product Requirements Document

## Original Problem Statement
> https://github.com/EchoPrism44/quickyield-scanner, I want to change the UI of this project

User wants a complete UI overhaul of QuickYield, a DeFi yield research/alerting SaaS. Original repo is Next.js + Clerk + Neon + Drizzle + Resend on Vercel. The user has already deployed the original; this rebuild is a UI-first re-implementation in the React + FastAPI + MongoDB stack.

## Product Positioning
QuickYield is informational research and alerting for DeFi yields. It scans 2,000+ pools (DeFiLlama-powered), tags beginner-safe routes (Aave, Compound, Morpho, Lido, Curve, Convex with stablecoins on high-TVL pools), and emails users when threshold rules are crossed. **Never custodies funds, never connects wallets, never executes trades.**

## User Personas
- **Crypto-curious**: Has idle USDC/ETH, wants safe, well-known routes with one-click visibility.
- **DeFi power user**: Tired of checking dashboards manually, wants threshold-based alerts.

## Architecture
- **Frontend**: React 19 + React Router 7 + Framer Motion + Phosphor Icons + Sonner (toasts) + Tailwind
- **Backend**: FastAPI + Motor (MongoDB) + httpx (DeFiLlama), JWT bearer auth (PyJWT + bcrypt)
- **Data source**: DeFiLlama public yield API (`https://yields.llama.fi/pools`), cached 10 min in-memory
- **Storage**: MongoDB collections: `users`, `watchlist`, `alerts`, `settings`, `login_attempts`

## Implemented (May 5, 2026)
- Distinctive dark UI ("Bloomberg ↔ Linear" aesthetic): Signal Orange (#FF4500) accent on Deep Obsidian (#050505), Cabinet Grotesk + JetBrains Mono fonts.
- Marketing landing page: animated hero with live-data dashboard preview, stats strip (real DeFiLlama stats), 4-step "How it works" with hover interactions, feature bento grid, testimonials, CTA, footer with disclaimers.
- Auth modal (login / register) with localStorage JWT persistence.
- Authenticated app shell (`/app/*`) with sidebar nav + Framer Motion `AnimatePresence` page transitions.
- Opportunities (`/app/opportunities`): filter by chain/asset/risk/beginner-safe, sort by APY/TVL, add-to-watchlist, external source link, risk badges, outlier capping (APY > 1000% excluded).
- Watchlist (`/app/watchlist`): live current-APY tracking, inline alert creation panel.
- Alerts (`/app/alerts`): threshold rules (below/above), toggle enabled, delete.
- Settings (`/app/settings`): notifications master toggle, digest frequency (instant/daily/weekly), disclaimers.
- Brute force protection (5 failed attempts → 15 min lockout per ip:email).

## Test Status
- Backend: 12/12 pytest passing (auth, opportunities, meta, watchlist CRUD, alerts CRUD, settings).
- Frontend: 100% — landing, modal, register/login, nav guard, dashboard transitions, sort/filter, watchlist + alerts + settings flows verified.

## Mocked / Deferred (P1 backlog)
- **Email alerts via Resend**: alert rules persist, but **NO emails are sent and NO cron job runs**. Requires Resend API key + Vercel cron (or APScheduler in FastAPI) to wire up.
- Password reset flow.
- Pricing page / paid tier (UI ref'd but not implemented).
- Chain logo icons (currently using initial-letter placeholder squares).

## Next Action Items
- Wire up Resend + a periodic scanner (every hour) that compares current APY vs alert thresholds and sends an email.
- Add a `/pricing` page for the future paid tier.
- Optionally enrich beginner-safe count by relaxing TVL threshold from $100M → $50M.
