<p align="center">
  <img src="public/brand/litmus-mark.svg" alt="Litmus" width="104">
</p>

<h1 align="center">L I T M U S</h1>

<p align="center"><strong>Test every yield.</strong></p>

<p align="center"><em>Yield research you can audit, not just trust.</em></p>

---

Litmus grades every live onchain yield pool **A–F** under a published methodology, and publishes the result every Monday — **before** anyone knows how those pools turn out. The record only grows; a past week is never edited.

That archive is the point. Most tools show you today's APY. Litmus accumulates a timestamped history of what it said and when, which nobody can backfill after the fact.

**Research only.** No custody, no wallet connection, no deposits, no trades, no financial advice, no guaranteed returns. External links open third-party platforms users must review independently.

## How it works

1. A scheduled job pulls public DeFiLlama yield data and merges it with curated routes.
2. Each pool is scored on four signals — liquidity, APY stability, reward quality, data completeness — and mapped to an A–F grade. Weights and thresholds are published at `/docs` and rendered from the same constants the scorer uses.
3. Every Monday a GitHub Action commits the full snapshot to `data/grades/<date>.json`.
4. The app reads those snapshots for the public track record, the weekly research posts, and the Market Pulse diff.

## Stack

- **Next.js** App Router on Vercel
- **Clerk** email auth — only gates user-specific actions; browsing is public
- **Supabase Postgres** with a Drizzle schema
- **Resend** + React Email for alert and digest email
- **Telegram** bot for alert delivery
- **GitHub Actions** for the hourly scan, the weekly grade snapshot, and the digest fallback
- **Custom CSS design system** — tokens in `styles/tokens.css`, Lucide icons, dark theme built on a blue signal (`#2f88ff`) and brand green (`#00E676`), with an A–F grade ramp
- **Type**: Newsreader (serif) for editorial surfaces, Instrument Sans for UI and data, JetBrains Mono for tickers and figures, Cinzel for the wordmark — all self-hosted via `next/font`

## Local development

```
npm install
npm run dev
```

Without environment variables the app runs in local-demo mode (see `lib/auth.ts`) with an in-memory store, so every route is testable with no keys.

> On Windows PowerShell, chain commands with `;` — `&&` is not a valid separator.

## Environment variables

```
NEXT_PUBLIC_SITE_URL=https://getlitmus.xyz
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=      # must be a real pk_ value (pk_live_ in production)
CLERK_SECRET_KEY=                        # sk_live_ in production
DATABASE_URL=
RESEND_API_KEY=
RESEND_FROM="Litmus <alerts@getlitmus.xyz>"   # must be @ the Resend-verified domain
RESEND_REPLY_TO=                         # optional: inbox you actually read; replies go here
CRON_SECRET=
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
```

`NEXT_PUBLIC_*` variables are inlined at **build** time, so changing one requires a redeploy — setting it in Vercel alone does nothing. Vercel's "Sensitive" flag only prevents reading a value back in the dashboard; it does **not** hide the value from the build, and is safe on any variable.

GitHub Actions secrets: `CRON_SECRET`, `APP_URL` (base URL for the hourly scan), `DIGEST_URL` (weekly digest endpoint).

## Commands

```
npm run dev            npm run lint           npm run test
npm run build          npm run type-check
npm run db:generate    npm run db:push
npm run blog:data      npm run blog:draft     npm run blog:charts
```

## Weekly research ritual

Full guide, including images and charts: [`content/blog/README.md`](content/blog/README.md).

```
npm run blog:data      # week-over-week analysis: grade shifts, movers, by chain, by protocol
npm run blog:draft     # writes content/blog/<date>-weekly-grade-record.md, pre-filled
npm run blog:charts    # writes themed SVG charts to public/blog/charts/
```

Then write the **"Our read"** section in your own words and publish by committing:

```
git add content/blog/ public/blog/
git commit -m "blog: weekly grade record <date>"
git push
```

Posts are plain Markdown in `content/blog/` — frontmatter (`title`, `date`, `excerpt`, `author`, `readMinutes`) then body; the filename becomes the URL slug. Nothing auto-publishes: no push, no post.

## Pages

| Route | What it is |
|---|---|
| `/` | Landing — ledger-first hero built from real snapshots, methodology, live terminal preview |
| `/terminal` | The app. **Public to browse**; sign-in only adds watchlist, alerts and settings. Discover has filters, presets, a yield heatmap in the right rail, and the Market Pulse week-over-week strip. Legacy `/dashboard` 308-redirects here. |
| `/terminal/pools/[id]` | Pool detail — grade breakdown, APY/TVL history, related pools |
| `/proof` | The public track record: every snapshot, grade distribution over time, safe-share trend |
| `/docs` | Methodology — the real weights and A–F thresholds, rendered from the scorer's constants |
| `/blog`, `/blog/[slug]` | Weekly research, written from our own snapshots |
| `/roadmap` | Shipped / building / exploring — plus the boundaries we won't cross |
| `/yields`, `/yields/[asset]`, `/yields/rwa` | SEO landing pages, including tokenized RWA and T-bills |
| `/legal/*` | Terms, privacy, disclaimer |

## API surface

Public (no auth): `GET /api/opportunities` · `GET /api/pools/:id/history` · `GET /api/ledger/:date`

User-scoped (401 without a session): `/api/watchlist` · `/api/watchlist/:id` · `/api/alerts` · `/api/alerts/:id` · `/api/alerts/activity` · `/api/positions` · `/api/positions/:id` · `/api/user/settings` · `/api/notifications/test` · `/api/notifications/telegram/connect` · `/api/analytics/*`

Scheduled (bearer `CRON_SECRET`): `GET /api/cron/scan-yields` · `GET /api/cron/weekly-digest`

> There is no public research API yet — it's on the roadmap under *exploring*, deliberately unbuilt until there's real demand to shape it.

## Brand assets

The mark is three stacked strata — the record accumulating, week over week.

<p align="left">
  <img src="public/brand/litmus-mark.svg" alt="App mark" width="88">
  &nbsp;&nbsp;
  <img src="public/brand/litmus-avatar.svg" alt="Avatar" width="88">
</p>

In `public/brand/`:

| File | Use |
|---|---|
| `litmus-mark.svg` | App mark and favicon — rounded tile, metallic strata |
| `litmus-avatar.svg` | 400×400 profile picture. Full-bleed and centred so the circular crop X, Discord and Telegram apply leaves ~69px of margin |
| `litmus-mark-light.svg` | Light surfaces — flat ink, no tile. The metallic gradient needs a dark ground to read as metal, so this variant goes solid |

Rules that are easy to break by accident:

- Keep `public/favicon.svg` **byte-identical** to `litmus-mark.svg`, and keep the inline copy in `app/opengraph-image.tsx` in sync with it. Three copies, one geometry.
- The mark is centred on its true centre `(256, 169)`, not the source viewBox centre. Re-centring on `(50, 50)` pushes it off-axis and breaks circular crops.
- The wordmark is **Cinzel**, loaded via `next/font` in `app/layout.tsx` and styled by `.qy-logo-text`. Do **not** bake it into an SVG — an SVG that merely *names* a font falls back to Times on any machine without it installed, which is nearly all of them. That is why there is no `litmus-wordmark.svg`.

## Notes

- CSS namespaces are historical: `.ql-*` for marketing surfaces (`styles/marketing.css`), `.qy-*` for the app (`app/globals.css`). They predate the rename and were left alone deliberately — renaming ~5,200 class references is churn with real regression risk and no user-visible benefit.
- Do **not** set `output: 'standalone'` in `next.config.ts`, and do not add `"type": "module"` to `package.json`. Either one makes Vercel's serverless launcher `require()` an ES module, and every dynamic route 500s with `ERR_REQUIRE_ESM`.
