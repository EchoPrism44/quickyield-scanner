-- Enable Row-Level Security on every public table.
--
-- Why: Supabase auto-exposes a PostgREST REST API for the `public` schema,
-- reachable with the public `anon` key. With RLS disabled, anyone with the
-- project URL + anon key can read/write these tables. QuickYield does NOT use
-- that API — it connects directly to Postgres as the `postgres` superuser via
-- DATABASE_URL, which BYPASSES RLS. So enabling RLS with no policies (deny-all)
-- blocks the public API roles while leaving the app fully functional.
--
-- Run this in the Supabase SQL Editor (or `psql "$DATABASE_URL" -f db/enable-rls.sql`).

alter table public.users                   enable row level security;
alter table public.opportunities_cache     enable row level security;
alter table public.opportunity_snapshots   enable row level security;
alter table public.watchlist_items         enable row level security;
alter table public.alert_rules             enable row level security;
alter table public.positions               enable row level security;
alter table public.alert_deliveries        enable row level security;
alter table public.notification_channels   enable row level security;
alter table public.telegram_connect_tokens enable row level security;
alter table public.interaction_events      enable row level security;
