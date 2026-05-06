# QuickYield Intel

QuickYield is a Next.js SaaS beta for crypto yield research. It scans public DeFiLlama yield data server-side, merges curated beginner-safe routes, stores watchlists and alert rules, and can send email alerts through Resend.

## Product Boundaries

- Informational research and alerting only.
- No custody, wallet connection, deposits, trades, financial advice, or guaranteed returns.
- External links open third-party platforms that users must review independently.

## Stack

- Next.js App Router on Vercel
- Clerk email auth
- Neon Postgres with Drizzle schema
- Resend + React Email for alert emails
- Vercel Cron for hourly scans
- Framer Motion + Lucide icons + custom CSS aesthetic (Cabinet Grotesk + JetBrains Mono on Signal Orange)

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
ALERT_TEST_RECIPIENT=
CRON_SECRET=
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

The app ships with a distinctive dark aesthetic that maps directly to the product's positioning:

- **Landing page** (`/`) — Animated hero with live preview, stats strip (real DeFiLlama numbers), 4-step "How it works", feature bento grid, testimonials, CTA, footer with disclaimers.
- **Dashboard** (`/dashboard`) — Sidebar navigation across Opportunities, Watchlist, Alerts, and Settings. The Opportunities table supports filtering (chain, asset, risk, category, time), the beginner-safe quick toggle, and APY/TVL sorting.

All API routes, types, schema, and email templates are unchanged from the previous version — only the UI layer was rebuilt.
