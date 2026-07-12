# QuickYield Intel

QuickYield is a Next.js SaaS beta for crypto yield research. It scans public DeFiLlama yield data server-side, merges curated beginner-safe routes, stores watchlists and alert rules, and can send email alerts through Resend.

## Product Boundaries

- Informational research and alerting only.
- No custody, wallet connection, deposits, trades, financial advice, or guaranteed returns.
- External links open third-party platforms that users must review independently.

## Stack

- Next.js App Router on Vercel
- Clerk email auth
- Supabase Postgres with Drizzle schema
- Resend + React Email for alert emails
- GitHub Actions for hourly scans
- Telegram bot alerts for trader notifications
- Custom CSS design system with design tokens (`styles/tokens.css`) + Lucide icons — Inter / Inter Tight / JetBrains Mono on a Signal Orange dark theme

## Local Development

```
npm install
npm run dev
```

Without environment variables, the app uses a local beta identity and in-memory storage so the UI and APIs remain testable.

## Environment Variables

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
DATABASE_URL=
RESEND_API_KEY=
RESEND_FROM="QuickYield <alerts@yourdomain.com>"
CRON_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
```

## Commands

```
npm run lint
npm run test
npm run build
npm run db:generate
npm run db:push
```

## API Surface

- `GET /api/opportunities`
- `GET /api/watchlist`
- `POST /api/watchlist`
- `DELETE /api/watchlist/:id`
- `GET /api/alerts`
- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `DELETE /api/alerts/:id`
- `GET /api/user/settings`
- `PATCH /api/user/settings`
- `GET /api/cron/scan-yields`

## UI Overview

A premium dark, ledger-first aesthetic that maps directly to the product's positioning ("Yield research you can audit, not just trust"). Landing styles live in `styles/marketing.css` (`.ql-*` namespace); the app/dashboard styles use the `.qy-*` system in `app/globals.css`. Marketing animation runs on `motion` (framer-motion v12) client islands.

- **Landing page** (`/`) — Ledger-first hero: the public grade ledger rendered as an animated commit rail (real weekly snapshots from `data/grades/`), ticker tape, real-number stats, the problem framing, the methodology section (real model weights + A–F thresholds), a 4-step "How it works", alerts + live terminal preview, a transparency band, disclaimer, CTA, and shared footer.
- **Terminal** (`/terminal`) — The authed app. Sidebar navigation across Discover, Alerts, and Settings. The Discover table supports filtering (chain, asset, risk, category, time), presets, a yield heatmap, and APY/TVL/safety sorting. (Legacy `/dashboard` URLs 308-redirect here.)
- **Legal** (`/legal/terms`, `/legal/privacy`, `/legal/disclaimer`) — Research-only / no-custody / not-financial-advice pages.

Without environment variables the app runs in local-demo mode (see `lib/auth.ts`), so every route is testable with `npm run dev` and no keys.
