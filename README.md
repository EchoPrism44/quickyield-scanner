# QuickYield — UI Overhaul (React + FastAPI + MongoDB)

A complete UI rebuild of [QuickYield](https://github.com/EchoPrism44/quickyield-scanner), reimagined as a top-tier SaaS dashboard for DeFi yield research and alerting.

> **Branch context**: This branch (`ui-overhaul`) contains a stack-divergent rebuild from `main` (Next.js + Clerk + Neon + Drizzle). It is **not** a drop-in replacement — it is an alternative implementation. Keep both branches alive until you decide which to ship.

---

## What it does

QuickYield scans **2,000+ DeFi yield pools** every hour (DeFiLlama-powered), surfaces **beginner-safe routes** (Aave, Compound, Morpho, Lido, Curve), and emails users when their threshold rules are crossed. **Never custodies funds, never connects wallets, never executes trades.**

### Key features
- 🎨 Distinctive dark aesthetic — Signal Orange (#FF4500) on Deep Obsidian, Cabinet Grotesk + JetBrains Mono.
- 📊 Live opportunities table — filter by chain/asset/risk, sort by APY/TVL, beginner-safe tags.
- 👁 Watchlist with live current-APY tracking.
- 🔔 Threshold alerts (notify if APY drops below X or rises above Y).
- ⚙️ Settings: notification toggle, digest frequency.
- ✨ Framer Motion page transitions and animated landing page.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, React Router 7, Tailwind CSS, Framer Motion, Phosphor Icons, Sonner |
| Backend | FastAPI, Motor (async MongoDB), httpx, PyJWT, bcrypt |
| Database | MongoDB |
| Data source | [DeFiLlama Yields API](https://yields.llama.fi/pools) (public, no key) |

---

## Local Development

### Prerequisites
- Node 18+ and Yarn
- Python 3.11+
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Clone & install
```bash
git clone -b ui-overhaul https://github.com/EchoPrism44/quickyield-scanner.git
cd quickyield-scanner

# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
yarn install
```

### 2. Environment variables

Copy the templates:
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Fill in the values. For `JWT_SECRET`, generate one with:
```bash
openssl rand -hex 32
```

### 3. Run
```bash
# Backend (port 8001)
cd backend
uvicorn server:app --reload --host 0.0.0.0 --port 8001

# Frontend (port 3000) — in a new terminal
cd frontend
yarn start
```

Visit [http://localhost:3000](http://localhost:3000). Log in with the seeded test creds you set in `.env`.

---

## 🚀 Deploy to Cloudflare Pages + Railway (recommended)

The recommended production setup:

```
┌──────────────────────────┐
│ Cloudflare Pages         │  React frontend (free, edge-cached globally)
│ quickyield-app.pages.dev │
└────────────┬─────────────┘
             │  HTTPS
             ▼
┌──────────────────────────┐
│ Railway · Web Service    │  FastAPI backend (~$5/mo usage-based, no cold starts)
│ quickyield-api...up...   │
└────────────┬─────────────┘
             │  Internal network
             ▼
┌──────────────────────────┐
│ Railway · MongoDB Plugin │  Database (~$5/mo, one-click)
└──────────────────────────┘
```

**Why this combo**
- Cloudflare Pages: free, global edge CDN, instant deploys, free SSL.
- Railway: native MongoDB plugin (no separate Atlas account), no cold starts, simpler than Render for stateful apps.
- Total cost: ~$5-10/mo for a low-traffic SaaS.

---

### Step 1 — Backend + MongoDB on Railway

1. Sign up at [railway.app](https://railway.app) (GitHub login).
2. **New Project** → **Deploy from GitHub repo** → select `EchoPrism44/quickyield-scanner` → branch `ui-overhaul`.
3. Railway will auto-create a service. Configure:
   - **Settings** → **Service** → **Source** → **Root directory**: `backend`
   - **Settings** → **Deploy** → **Custom Start Command**: `uvicorn server:app --host 0.0.0.0 --port $PORT`
4. **Add MongoDB**: In the project canvas, click **+ Create** → **Database** → **Add MongoDB**. Railway provisions it and exposes a `MONGO_URL` variable to the project.
5. Go back to your backend service → **Variables** → add:

   | Variable | Value |
   |----------|-------|
   | `MONGO_URL` | `${{ MongoDB.MONGO_URL }}` *(reference — auto-injects)* |
   | `DB_NAME` | `quickyield` |
   | `JWT_SECRET` | `<run: openssl rand -hex 32>` |
   | `ADMIN_EMAIL` | `admin@quickyield.io` |
   | `ADMIN_PASSWORD` | *(a strong password)* |
   | `TEST_USER_EMAIL` | `demo@quickyield.io` |
   | `TEST_USER_PASSWORD` | *(a strong password)* |
   | `CORS_ORIGINS` | `*` |
   | `FRONTEND_URL` | *(fill in after Step 2)* |

6. **Settings** → **Networking** → **Generate Domain**. You'll get something like `https://quickyield-api-production.up.railway.app`.
7. Verify: `curl https://quickyield-api-production.up.railway.app/api/` should return `{"service":"quickyield","status":"ok"}`.

### Step 2 — Frontend on Cloudflare Pages

1. Sign up / log in at [pages.cloudflare.com](https://pages.cloudflare.com).
2. **Create a project** → **Connect to Git** → authorize Cloudflare → select `EchoPrism44/quickyield-scanner` → branch `ui-overhaul`.
3. Build settings:

   | Setting | Value |
   |---------|-------|
   | **Framework preset** | Create React App |
   | **Root directory (advanced)** | `frontend` |
   | **Build command** | `yarn install && yarn build` |
   | **Build output directory** | `build` |

4. **Environment variables (Production)**:

   | Variable | Value |
   |----------|-------|
   | `REACT_APP_BACKEND_URL` | *Railway backend URL from Step 1.6* |
   | `NODE_VERSION` | `20` |

5. **Save and Deploy**. First build takes ~2-3 min. You get `https://quickyield-app.pages.dev` (or whatever name you picked).

### Step 3 — Loop back

1. Go to your **Railway backend** → **Variables** → set `FRONTEND_URL` to your Cloudflare Pages URL (e.g. `https://quickyield-app.pages.dev`).
2. Railway auto-redeploys.

### Step 4 — Test
1. Visit your Cloudflare Pages URL.
2. Click **Get started** → register a new account → you should land on `/app/opportunities` with live DeFiLlama data.
3. Or log in with the seeded test user credentials.

### (Optional) Custom domains
- **Cloudflare Pages**: Project → **Custom domains** → add `app.quickyield.io`. Cloudflare auto-issues SSL.
- **Railway**: Service → **Settings** → **Networking** → **Custom Domain** → add `api.quickyield.io`. Add the CNAME at your DNS provider (free if your domain is on Cloudflare DNS).

---

## Alternative: Deploy to Render

If you'd rather use Render (single-vendor, MongoDB Atlas separately):

<details>
<summary>Click to expand Render instructions</summary>

You will deploy 3 components: MongoDB Atlas (free), Render Web Service (backend), Render Static Site (frontend).

**1. MongoDB Atlas free tier**
- Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas) → create M0 cluster.
- Database Access → create user. Network Access → allow `0.0.0.0/0`. Connect → Drivers → copy connection string.

**2. Backend (Render Web Service)**
- New → Web Service → connect GitHub → branch `ui-overhaul`.
- Root: `backend`, Runtime: Python 3, Build: `pip install -r requirements.txt`, Start: `uvicorn server:app --host 0.0.0.0 --port $PORT`.
- Set the same env vars as Railway (Step 1.5 above), with `MONGO_URL` pointing to your Atlas string.

**3. Frontend (Render Static Site)**
- New → Static Site → branch `ui-overhaul`. Root: `frontend`, Build: `yarn install && yarn build`, Publish: `build`.
- Add **rewrite rule**: `/*` → `/index.html` (Rewrite) — required for React Router.
- Env: `REACT_APP_BACKEND_URL = <backend Render URL>`.

A pre-configured `render.yaml` is included in the repo root for one-click IaC deploy.

</details>

---

## API Surface

All endpoints under `/api`. Auth via `Authorization: Bearer <token>` header. Login response returns `access_token`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account, returns access_token |
| POST | `/api/auth/login` | Log in, returns access_token |
| POST | `/api/auth/logout` | Clear cookies |
| GET | `/api/auth/me` | Current user |
| GET | `/api/opportunities` | Yield pools (filter: `chain`, `asset`, `risk`, `beginner_safe`, `sort_by`) |
| GET | `/api/opportunities/meta` | Chains, assets, stats |
| GET | `/api/watchlist` | User watchlist (enriched with live APY) |
| POST | `/api/watchlist` | Add pool to watchlist |
| DELETE | `/api/watchlist/:pool_id` | Remove from watchlist |
| GET | `/api/alerts` | User alerts |
| POST | `/api/alerts` | Create alert rule |
| PATCH | `/api/alerts/:id` | Update alert |
| DELETE | `/api/alerts/:id` | Delete alert |
| GET | `/api/user/settings` | Get notification settings |
| PATCH | `/api/user/settings` | Update settings |

---

## What's mocked / not yet wired

🟡 **Email alerts** — alert rules persist in MongoDB but **no emails are sent**. To wire up real email delivery you need:
1. A [Resend](https://resend.com) account + API key.
2. A periodic job (cron) that:
   - Hits `/api/opportunities` every hour
   - Compares current APY vs each user's alert rules
   - Calls Resend to send emails when thresholds cross
3. On Railway, add a **Cron** service running a small script. On Cloudflare, use **Cron Triggers** in Workers (HTTP-pings the backend's protected scan endpoint).

🟡 **Pricing page** — referenced in nav but not built.

---

## Disclaimers

QuickYield is informational research and alerting. **Not financial advice.** No custody. No wallet connection. No trade execution. APY data sourced from DeFiLlama and refreshed hourly. Always verify on the source protocol before depositing.

---

## License

MIT
