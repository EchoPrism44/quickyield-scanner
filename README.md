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

**`backend/.env`**
```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="quickyield"
CORS_ORIGINS="*"
JWT_SECRET="<generate with: openssl rand -hex 32>"
ADMIN_EMAIL="admin@quickyield.io"
ADMIN_PASSWORD="ChangeThisInProd!"
TEST_USER_EMAIL="demo@quickyield.io"
TEST_USER_PASSWORD="ChangeThisInProd!"
FRONTEND_URL="http://localhost:3000"
```

**`frontend/.env`**
```env
REACT_APP_BACKEND_URL="http://localhost:8001"
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

Visit [http://localhost:3000](http://localhost:3000). Default seeded test login: `demo@quickyield.io` / `DemoUser2026!` (or whatever you set in `.env`).

---

## Deploy to Render

Render is the recommended platform for this stack. You will deploy **3 components**:

1. **MongoDB** — use [MongoDB Atlas](https://www.mongodb.com/atlas) free tier (Render has no native MongoDB)
2. **FastAPI backend** — Render Web Service
3. **React frontend** — Render Static Site

### Step 1 — MongoDB Atlas (free)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Create a free **M0** cluster (any region close to your Render region).
3. **Database Access** → create a user with read/write permissions. Copy the password.
4. **Network Access** → add `0.0.0.0/0` to allow Render to connect.
5. **Connect** → "Drivers" → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `<password>` with the password you set, append `&appName=quickyield` if you like.

### Step 2 — Deploy backend on Render

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
2. Connect your GitHub → select **`EchoPrism44/quickyield-scanner`** → branch **`ui-overhaul`**.
3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `quickyield-api` |
   | **Region** | Closest to your users |
   | **Branch** | `ui-overhaul` |
   | **Root directory** | `backend` |
   | **Runtime** | Python 3 |
   | **Build command** | `pip install -r requirements.txt` |
   | **Start command** | `uvicorn server:app --host 0.0.0.0 --port $PORT` |
   | **Plan** | Free (or Starter $7/mo for no cold starts) |

4. Add **Environment Variables**:
   ```
   MONGO_URL = <your Atlas connection string>
   DB_NAME = quickyield
   JWT_SECRET = <run: openssl rand -hex 32>
   ADMIN_EMAIL = admin@quickyield.io
   ADMIN_PASSWORD = <a strong password>
   TEST_USER_EMAIL = demo@quickyield.io
   TEST_USER_PASSWORD = <a strong password>
   FRONTEND_URL = <your render frontend URL — fill after step 3>
   CORS_ORIGINS = *
   ```

5. Click **Create Web Service**. Wait for the first build (~3-5 min).
6. Note the URL Render gives you, e.g. `https://quickyield-api.onrender.com`.
7. Test: `curl https://quickyield-api.onrender.com/api/` should return `{"service":"quickyield","status":"ok"}`.

### Step 3 — Deploy frontend on Render

1. **New** → **Static Site** → same GitHub repo → branch **`ui-overhaul`**.
2. Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `quickyield-app` |
   | **Branch** | `ui-overhaul` |
   | **Root directory** | `frontend` |
   | **Build command** | `yarn install && yarn build` |
   | **Publish directory** | `build` |

3. Add **Environment Variable**:
   ```
   REACT_APP_BACKEND_URL = https://quickyield-api.onrender.com
   ```
   (use the backend URL from Step 2.6)

4. Add a **Rewrite Rule** (so React Router works):
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: Rewrite

5. Click **Create Static Site**. Wait for build (~2-3 min).
6. Note the URL, e.g. `https://quickyield-app.onrender.com`.

### Step 4 — Loop back

1. Go back to your **backend service** → **Environment** → set `FRONTEND_URL` to the static-site URL from Step 3.6.
2. Render auto-redeploys.
3. Visit the frontend URL — register a new account or log in with your seeded admin/test creds.

### Optional: render.yaml (Infrastructure as Code)

You can commit a `render.yaml` to the repo root for one-click reproducible deploys. Example:

```yaml
services:
  - type: web
    name: quickyield-api
    runtime: python
    rootDir: backend
    branch: ui-overhaul
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn server:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: MONGO_URL
        sync: false
      - key: JWT_SECRET
        generateValue: true
      - key: DB_NAME
        value: quickyield

  - type: web
    name: quickyield-app
    runtime: static
    rootDir: frontend
    branch: ui-overhaul
    buildCommand: yarn install && yarn build
    staticPublishPath: build
    routes:
      - type: rewrite
        source: /*
        destination: /index.html
    envVars:
      - key: REACT_APP_BACKEND_URL
        sync: false
```

---

## API Surface

All endpoints under `/api`. Auth via `Authorization: Bearer <token>` header. Login response returns `access_token`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Create account, returns access_token |
| POST | `/api/auth/login` | Log in, returns access_token |
| POST | `/api/auth/logout` | Clear cookies |
| GET | `/api/auth/me` | Current user |
| GET | `/api/opportunities` | Yield pools (filter: chain, asset, risk, beginner_safe, sort_by) |
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
3. On Render, add a **Cron Job** service (`runtime: docker` or use a tiny Node/Python script) that hits a protected `/api/cron/scan-yields` endpoint hourly.

🟡 **Pricing page** — referenced in nav but not built.

---

## Disclaimers

QuickYield is informational research and alerting. **Not financial advice.** No custody. No wallet connection. No trade execution. APY data sourced from DeFiLlama and refreshed hourly. Always verify on the source protocol before depositing.

---

## License

MIT
