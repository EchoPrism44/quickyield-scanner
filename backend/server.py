from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import logging
import uuid
import secrets
import bcrypt
import jwt
import httpx
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict


# ---------------- Setup ----------------
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="QuickYield API")
api_router = APIRouter(prefix="/api")

# In-memory cache for DeFiLlama yields
YIELD_CACHE: dict = {"data": [], "ts": None}
CACHE_TTL = timedelta(minutes=10)

# ---------------- Helpers ----------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "refresh",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=86400, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ---------------- Models ----------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    role: str = "user"
    created_at: datetime


class WatchlistItem(BaseModel):
    pool_id: str
    protocol: str
    chain: str
    asset: str
    apy: float


class AlertRule(BaseModel):
    pool_id: str
    protocol: str
    chain: str
    asset: str
    apy_baseline: float
    threshold_below: Optional[float] = None
    threshold_above: Optional[float] = None
    enabled: bool = True


class UserSettings(BaseModel):
    notifications_enabled: bool = True
    digest_frequency: Literal["instant", "daily", "weekly"] = "instant"


# ---------------- Auth Endpoints ----------------
@api_router.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    email = payload.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": email,
        "password_hash": hash_password(payload.password),
        "name": payload.name or email.split("@")[0],
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    access = create_access_token(user_id, email)
    refresh = create_refresh_token(user_id)
    set_auth_cookies(response, access, refresh)
    return {
        "id": user_id,
        "email": email,
        "name": user_doc["name"],
        "role": "user",
        "created_at": user_doc["created_at"],
        "access_token": access,
    }


@api_router.post("/auth/login")
async def login(payload: LoginIn, request: Request, response: Response):
    email = payload.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"

    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("locked_until"):
        locked_until = attempt["locked_until"]
        if isinstance(locked_until, str):
            locked_until = datetime.fromisoformat(locked_until)
        if locked_until > datetime.now(timezone.utc):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {
                "$inc": {"count": 1},
                "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()},
            },
            upsert=True,
        )
        rec = await db.login_attempts.find_one({"identifier": identifier})
        if rec and rec.get("count", 0) >= 5:
            until = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            await db.login_attempts.update_one({"identifier": identifier}, {"$set": {"locked_until": until}})
        raise HTTPException(status_code=401, detail="Invalid credentials")

    await db.login_attempts.delete_one({"identifier": identifier})
    access = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    set_auth_cookies(response, access, refresh)
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "role": user.get("role", "user"),
        "created_at": user["created_at"],
        "access_token": access,
    }


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------------- DeFi Yield Opportunities ----------------
SAFE_PROTOCOLS = {"aave-v3", "compound-v3", "morpho-blue", "lido", "rocket-pool", "curve-dex", "convex-finance"}
STABLE_ASSETS = {"USDC", "USDT", "DAI", "FRAX", "USDC.E", "USDT.E", "USDS", "GHO", "PYUSD"}


def classify_risk(pool: dict) -> str:
    apy = pool.get("apy") or 0
    tvl = pool.get("tvlUsd") or 0
    project = (pool.get("project") or "").lower()
    asset = (pool.get("symbol") or "").upper()
    is_stable = any(s in asset for s in STABLE_ASSETS)
    if project in SAFE_PROTOCOLS and tvl > 100_000_000 and apy < 15 and is_stable:
        return "low"
    if tvl > 50_000_000 and apy < 25:
        return "medium"
    return "high"


def is_beginner_safe(pool: dict, risk: str) -> bool:
    project = (pool.get("project") or "").lower()
    asset = (pool.get("symbol") or "").upper()
    is_stable = any(s in asset for s in STABLE_ASSETS)
    return risk == "low" and project in SAFE_PROTOCOLS and is_stable


async def fetch_yields() -> list:
    now = datetime.now(timezone.utc)
    if YIELD_CACHE["data"] and YIELD_CACHE["ts"] and (now - YIELD_CACHE["ts"]) < CACHE_TTL:
        return YIELD_CACHE["data"]
    try:
        async with httpx.AsyncClient(timeout=20.0) as ac:
            r = await ac.get("https://yields.llama.fi/pools")
            r.raise_for_status()
            raw = r.json().get("data", [])
    except Exception as e:
        logging.exception("Failed to fetch DeFiLlama yields: %s", e)
        return YIELD_CACHE["data"] or []

    cleaned = []
    for p in raw:
        if not p.get("apy"):
            continue
        if (p.get("tvlUsd") or 0) < 1_000_000:
            continue
        risk = classify_risk(p)
        cleaned.append({
            "pool_id": p.get("pool"),
            "protocol": p.get("project"),
            "chain": p.get("chain"),
            "asset": p.get("symbol"),
            "apy": round(p.get("apy", 0), 2),
            "apy_base": round(p.get("apyBase") or 0, 2),
            "apy_reward": round(p.get("apyReward") or 0, 2),
            "tvl_usd": p.get("tvlUsd"),
            "risk": risk,
            "beginner_safe": is_beginner_safe(p, risk),
            "url": p.get("url"),
            "stable": (p.get("symbol") or "").upper() in STABLE_ASSETS,
        })
    cleaned.sort(key=lambda x: x["apy"], reverse=True)
    YIELD_CACHE["data"] = cleaned[:500]
    YIELD_CACHE["ts"] = now
    return YIELD_CACHE["data"]


@api_router.get("/opportunities")
async def get_opportunities(
    chain: Optional[str] = None,
    asset: Optional[str] = None,
    risk: Optional[str] = None,
    beginner_safe: Optional[bool] = None,
    min_tvl: Optional[float] = None,
    sort_by: str = "apy",
    limit: int = 100,
):
    data = await fetch_yields()
    if chain:
        data = [d for d in data if (d["chain"] or "").lower() == chain.lower()]
    if asset:
        data = [d for d in data if asset.upper() in (d["asset"] or "").upper()]
    if risk:
        data = [d for d in data if d["risk"] == risk]
    if beginner_safe is not None:
        data = [d for d in data if d["beginner_safe"] == beginner_safe]
    if min_tvl:
        data = [d for d in data if (d["tvl_usd"] or 0) >= min_tvl]
    if sort_by == "tvl":
        data = sorted(data, key=lambda x: x["tvl_usd"] or 0, reverse=True)
    else:
        data = sorted(data, key=lambda x: x["apy"], reverse=True)
    return {"items": data[:limit], "total": len(data), "updated_at": YIELD_CACHE["ts"].isoformat() if YIELD_CACHE["ts"] else None}


@api_router.get("/opportunities/meta")
async def get_meta():
    data = await fetch_yields()
    chains = sorted({d["chain"] for d in data if d.get("chain")})
    assets = sorted({d["asset"] for d in data if d.get("asset")})[:200]
    total_tvl = sum((d["tvl_usd"] or 0) for d in data)
    avg_apy = round(sum(d["apy"] for d in data) / max(len(data), 1), 2)
    safe_count = sum(1 for d in data if d["beginner_safe"])
    return {
        "chains": chains,
        "assets": assets,
        "stats": {
            "total_pools": len(data),
            "total_tvl_usd": total_tvl,
            "avg_apy": avg_apy,
            "beginner_safe_count": safe_count,
        },
    }


# ---------------- Watchlist ----------------
@api_router.get("/watchlist")
async def get_watchlist(user: dict = Depends(get_current_user)):
    items = await db.watchlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    if not items:
        return {"items": []}
    pool_ids = {it["pool_id"] for it in items}
    yields = await fetch_yields()
    yield_map = {y["pool_id"]: y for y in yields}
    enriched = []
    for it in items:
        live = yield_map.get(it["pool_id"])
        if live:
            it["current_apy"] = live["apy"]
            it["risk"] = live["risk"]
            it["tvl_usd"] = live["tvl_usd"]
            it["url"] = live["url"]
        enriched.append(it)
    return {"items": enriched}


@api_router.post("/watchlist")
async def add_watchlist(item: WatchlistItem, user: dict = Depends(get_current_user)):
    existing = await db.watchlist.find_one({"user_id": user["id"], "pool_id": item.pool_id})
    if existing:
        raise HTTPException(status_code=400, detail="Already in watchlist")
    doc = item.model_dump()
    doc["user_id"] = user["id"]
    doc["id"] = str(uuid.uuid4())
    doc["added_at"] = datetime.now(timezone.utc).isoformat()
    await db.watchlist.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.delete("/watchlist/{pool_id}")
async def remove_watchlist(pool_id: str, user: dict = Depends(get_current_user)):
    res = await db.watchlist.delete_one({"user_id": user["id"], "pool_id": pool_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ---------------- Alerts ----------------
@api_router.get("/alerts")
async def get_alerts(user: dict = Depends(get_current_user)):
    items = await db.alerts.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    return {"items": items}


@api_router.post("/alerts")
async def create_alert(rule: AlertRule, user: dict = Depends(get_current_user)):
    doc = rule.model_dump()
    doc["user_id"] = user["id"]
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["last_triggered_at"] = None
    await db.alerts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.patch("/alerts/{alert_id}")
async def update_alert(alert_id: str, payload: dict, user: dict = Depends(get_current_user)):
    allowed = {"threshold_below", "threshold_above", "enabled"}
    update = {k: v for k, v in payload.items() if k in allowed}
    if not update:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db.alerts.update_one({"id": alert_id, "user_id": user["id"]}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    item = await db.alerts.find_one({"id": alert_id}, {"_id": 0})
    return item


@api_router.delete("/alerts/{alert_id}")
async def delete_alert(alert_id: str, user: dict = Depends(get_current_user)):
    res = await db.alerts.delete_one({"id": alert_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"ok": True}


# ---------------- Settings ----------------
@api_router.get("/user/settings")
async def get_settings(user: dict = Depends(get_current_user)):
    s = await db.settings.find_one({"user_id": user["id"]}, {"_id": 0})
    if not s:
        s = {"user_id": user["id"], "notifications_enabled": True, "digest_frequency": "instant"}
    return s


@api_router.patch("/user/settings")
async def update_settings(payload: UserSettings, user: dict = Depends(get_current_user)):
    doc = payload.model_dump()
    doc["user_id"] = user["id"]
    await db.settings.update_one({"user_id": user["id"]}, {"$set": doc}, upsert=True)
    return doc


# ---------------- Health ----------------
@api_router.get("/")
async def root():
    return {"service": "quickyield", "status": "ok"}


# ---------------- Startup ----------------
@app.on_event("startup")
async def startup_event():
    await db.users.create_index("email", unique=True)
    await db.watchlist.create_index([("user_id", 1), ("pool_id", 1)], unique=True)
    await db.alerts.create_index("user_id")
    await db.login_attempts.create_index("identifier", unique=True)

    # Seed admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@quickyield.io").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})

    # Seed test user
    test_email = os.environ.get("TEST_USER_EMAIL", "demo@quickyield.io").lower()
    test_password = os.environ.get("TEST_USER_PASSWORD", "demo123")
    existing_t = await db.users.find_one({"email": test_email})
    if not existing_t:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": test_email,
            "password_hash": hash_password(test_password),
            "name": "Demo",
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(test_password, existing_t["password_hash"]):
        await db.users.update_one({"email": test_email}, {"$set": {"password_hash": hash_password(test_password)}})


# ---------------- Mount ----------------
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
