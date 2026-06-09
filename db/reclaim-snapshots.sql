-- One-time reclaim for opportunity_snapshots bloat (Supabase free-tier overage).
--
-- The hourly scan wrote ~pool-count rows/scan, each carrying an unused
-- `payload_json` blob (~90% of row size), with no retention — growing ~1 GB/mo.
-- Code now (a) stops writing payload_json and (b) prunes rows older than 14 days
-- on every scan. This script reclaims the space that has already accumulated.
--
-- Run in the Supabase SQL Editor.

-- 1) Drop the never-read payload column.
alter table public.opportunity_snapshots drop column if exists payload_json;

-- 2) Reclaim space immediately. Snapshots are non-critical — pool charts use
--    DeFiLlama directly and market-trend analytics rebuilds within days — so a
--    clean truncate is the fastest, safest reclaim when near the storage limit.
truncate table public.opportunity_snapshots;

-- Gentler alternative (keeps recent history) if you are NOT tight on space —
-- use INSTEAD of the truncate above:
--   delete from public.opportunity_snapshots where captured_at < now() - interval '14 days';
--   vacuum full public.opportunity_snapshots;   -- needs temporary free space; locks the table
