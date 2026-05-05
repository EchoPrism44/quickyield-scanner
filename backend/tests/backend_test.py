"""QuickYield backend API tests - pytest with requests."""
import os
import uuid
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://scanner-redesign.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@quickyield.io"
DEMO_PASSWORD = "DemoUser2026!"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def demo_token(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "access_token" in data
    return data["access_token"]


@pytest.fixture(scope="session")
def auth_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}", "Content-Type": "application/json"}


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/", timeout=10)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# ---------- Auth ----------
def test_login_invalid(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrongpass"}, timeout=10)
    assert r.status_code in (401, 429)


def test_me_requires_auth(session):
    r = session.get(f"{API}/auth/me", timeout=10)
    assert r.status_code == 401


def test_me_with_bearer(session, auth_headers):
    r = session.get(f"{API}/auth/me", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    data = r.json()
    assert data["email"] == DEMO_EMAIL
    assert "password_hash" not in data
    assert "_id" not in data


def test_register_and_login(session):
    unique = f"test_{uuid.uuid4().hex[:10]}@example.com"
    r = session.post(f"{API}/auth/register", json={"email": unique, "password": "TestPass123!", "name": "T"}, timeout=15)
    assert r.status_code == 200, r.text
    data = r.json()
    assert data["email"] == unique
    assert "access_token" in data

    # duplicate email
    r2 = session.post(f"{API}/auth/register", json={"email": unique, "password": "TestPass123!"}, timeout=10)
    assert r2.status_code == 400


# ---------- Opportunities ----------
def test_opportunities_list(session):
    r = session.get(f"{API}/opportunities?limit=100", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "items" in data and "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) > 0
    sample = data["items"][0]
    for k in ("pool_id", "protocol", "chain", "asset", "apy", "tvl_usd", "risk"):
        assert k in sample, f"missing {k}"


def test_opportunities_meta(session):
    r = session.get(f"{API}/opportunities/meta", timeout=30)
    assert r.status_code == 200
    data = r.json()
    assert "chains" in data and "assets" in data and "stats" in data
    assert len(data["chains"]) > 0
    assert len(data["assets"]) > 0
    assert data["stats"]["total_pools"] > 0


def test_opportunities_filter_risk(session):
    r = session.get(f"{API}/opportunities?risk=low&limit=50", timeout=30)
    assert r.status_code == 200
    items = r.json()["items"]
    if items:
        assert all(it["risk"] == "low" for it in items)


def test_opportunities_sort_tvl(session):
    r = session.get(f"{API}/opportunities?sort_by=tvl&limit=20", timeout=30)
    assert r.status_code == 200
    items = r.json()["items"]
    if len(items) > 1:
        tvls = [it["tvl_usd"] or 0 for it in items]
        assert tvls == sorted(tvls, reverse=True)


# ---------- Watchlist ----------
@pytest.fixture(scope="session")
def sample_pool(session):
    r = session.get(f"{API}/opportunities?limit=5", timeout=30)
    return r.json()["items"][0]


def test_watchlist_crud(session, auth_headers, sample_pool):
    pid = sample_pool["pool_id"]
    # cleanup if exists
    session.delete(f"{API}/watchlist/{pid}", headers=auth_headers, timeout=10)

    payload = {
        "pool_id": pid,
        "protocol": sample_pool["protocol"],
        "chain": sample_pool["chain"],
        "asset": sample_pool["asset"],
        "apy": sample_pool["apy"],
    }
    r = session.post(f"{API}/watchlist", json=payload, headers=auth_headers, timeout=10)
    assert r.status_code == 200, r.text
    assert r.json()["pool_id"] == pid

    # duplicate
    r2 = session.post(f"{API}/watchlist", json=payload, headers=auth_headers, timeout=10)
    assert r2.status_code == 400

    # GET shows enriched
    r3 = session.get(f"{API}/watchlist", headers=auth_headers, timeout=30)
    assert r3.status_code == 200
    items = r3.json()["items"]
    assert any(it["pool_id"] == pid for it in items)
    found = next(it for it in items if it["pool_id"] == pid)
    assert "current_apy" in found

    # delete
    r4 = session.delete(f"{API}/watchlist/{pid}", headers=auth_headers, timeout=10)
    assert r4.status_code == 200


# ---------- Alerts ----------
def test_alerts_crud(session, auth_headers, sample_pool):
    payload = {
        "pool_id": sample_pool["pool_id"],
        "protocol": sample_pool["protocol"],
        "chain": sample_pool["chain"],
        "asset": sample_pool["asset"],
        "apy_baseline": sample_pool["apy"],
        "threshold_below": 1.0,
        "threshold_above": 50.0,
        "enabled": True,
    }
    r = session.post(f"{API}/alerts", json=payload, headers=auth_headers, timeout=10)
    assert r.status_code == 200
    alert = r.json()
    aid = alert["id"]
    assert "_id" not in alert

    # list
    r2 = session.get(f"{API}/alerts", headers=auth_headers, timeout=10)
    assert r2.status_code == 200
    assert any(a["id"] == aid for a in r2.json()["items"])

    # patch
    r3 = session.patch(f"{API}/alerts/{aid}", json={"enabled": False}, headers=auth_headers, timeout=10)
    assert r3.status_code == 200
    assert r3.json()["enabled"] is False

    # delete
    r4 = session.delete(f"{API}/alerts/{aid}", headers=auth_headers, timeout=10)
    assert r4.status_code == 200

    # delete nonexistent
    r5 = session.delete(f"{API}/alerts/{aid}", headers=auth_headers, timeout=10)
    assert r5.status_code == 404


# ---------- Settings ----------
def test_settings_get_and_update(session, auth_headers):
    r = session.get(f"{API}/user/settings", headers=auth_headers, timeout=10)
    assert r.status_code == 200
    assert "notifications_enabled" in r.json()

    r2 = session.patch(f"{API}/user/settings", json={"notifications_enabled": False, "digest_frequency": "daily"}, headers=auth_headers, timeout=10)
    assert r2.status_code == 200
    assert r2.json()["digest_frequency"] == "daily"

    r3 = session.get(f"{API}/user/settings", headers=auth_headers, timeout=10)
    assert r3.json()["digest_frequency"] == "daily"
    assert r3.json()["notifications_enabled"] is False

    # reset
    session.patch(f"{API}/user/settings", json={"notifications_enabled": True, "digest_frequency": "instant"}, headers=auth_headers, timeout=10)
