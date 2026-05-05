import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowSquareOut, Plus, Funnel, ArrowDown, ArrowUp, ShieldCheck } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api, apiErr, fmtAPY, fmtUSD } from "@/lib/api";

const RiskBadge = ({ risk }) => {
  const map = {
    low: { c: "text-safe", b: "border-safe/30 bg-safe/10", l: "Low" },
    medium: { c: "text-signal", b: "border-signal/30 bg-signal/10", l: "Medium" },
    high: { c: "text-risk", b: "border-risk/30 bg-risk/10", l: "High" },
  };
  const m = map[risk] || map.medium;
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${m.b} ${m.c}`}>
      {m.l}
    </span>
  );
};

export default function Opportunities() {
  const [data, setData] = useState([]);
  const [meta, setMeta] = useState({ chains: [], assets: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [chain, setChain] = useState("");
  const [asset, setAsset] = useState("");
  const [risk, setRisk] = useState("");
  const [safeOnly, setSafeOnly] = useState(false);
  const [sortBy, setSortBy] = useState("apy");
  const [watchlistIds, setWatchlistIds] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const params = { limit: 100, sort_by: sortBy };
      if (chain) params.chain = chain;
      if (asset) params.asset = asset;
      if (risk) params.risk = risk;
      if (safeOnly) params.beginner_safe = true;
      const [opps, m, wl] = await Promise.all([
        api.get("/opportunities", { params }),
        api.get("/opportunities/meta"),
        api.get("/watchlist").catch(() => ({ data: { items: [] } })),
      ]);
      setData(opps.data.items || []);
      setMeta(m.data);
      setWatchlistIds(new Set((wl.data.items || []).map((x) => x.pool_id)));
    } catch (e) {
      toast.error(apiErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [chain, asset, risk, safeOnly, sortBy]);

  const addWatch = async (p) => {
    try {
      await api.post("/watchlist", {
        pool_id: p.pool_id,
        protocol: p.protocol,
        chain: p.chain,
        asset: p.asset,
        apy: p.apy,
      });
      setWatchlistIds(new Set([...watchlistIds, p.pool_id]));
      toast.success(`Added ${p.protocol} · ${p.asset} to watchlist`);
    } catch (e) {
      toast.error(apiErr(e));
    }
  };

  return (
    <div className="px-6 py-8" data-testid="opportunities-page">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Live scanner</div>
          <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">Opportunities</h1>
          <p className="mt-1 text-sm text-ink-dim">
            {meta.stats?.total_pools?.toLocaleString() || "—"} pools · {fmtUSD(meta.stats?.total_tvl_usd)} TVL · avg APY {meta.stats?.avg_apy?.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-bg-surface p-3" data-testid="filters">
        <div className="flex items-center gap-2 px-2 text-ink-mute">
          <Funnel size={14} />
          <span className="font-mono text-[10px] uppercase tracking-wider">Filter</span>
        </div>
        <select
          value={chain}
          onChange={(e) => setChain(e.target.value)}
          className="rounded-md border border-line bg-bg-elevated px-3 py-1.5 text-xs text-ink focus:border-signal/40 focus:outline-none"
          data-testid="filter-chain"
        >
          <option value="">All chains</option>
          {meta.chains?.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          placeholder="Asset (USDC, ETH...)"
          value={asset}
          onChange={(e) => setAsset(e.target.value)}
          className="rounded-md border border-line bg-bg-elevated px-3 py-1.5 text-xs text-ink placeholder:text-ink-mute focus:border-signal/40 focus:outline-none"
          data-testid="filter-asset"
        />
        <select
          value={risk}
          onChange={(e) => setRisk(e.target.value)}
          className="rounded-md border border-line bg-bg-elevated px-3 py-1.5 text-xs text-ink focus:border-signal/40 focus:outline-none"
          data-testid="filter-risk"
        >
          <option value="">Any risk</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          onClick={() => setSafeOnly((s) => !s)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${
            safeOnly ? "border-safe/40 bg-safe/10 text-safe" : "border-line text-ink-dim hover:text-ink"
          }`}
          data-testid="filter-safe"
        >
          <ShieldCheck size={12} weight={safeOnly ? "fill" : "regular"} /> Beginner safe
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-mute">Sort</span>
          <button
            onClick={() => setSortBy("apy")}
            className={`rounded-md px-2.5 py-1 text-xs ${sortBy === "apy" ? "bg-white/5 text-ink" : "text-ink-dim hover:text-ink"}`}
            data-testid="sort-apy"
          >APY</button>
          <button
            onClick={() => setSortBy("tvl")}
            className={`rounded-md px-2.5 py-1 text-xs ${sortBy === "tvl" ? "bg-white/5 text-ink" : "text-ink-dim hover:text-ink"}`}
            data-testid="sort-tvl"
          >TVL</button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-line bg-bg-surface">
        <div className="grid grid-cols-12 gap-3 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
          <div className="col-span-4">Protocol · Asset</div>
          <div className="col-span-2">Chain</div>
          <div className="col-span-1">Risk</div>
          <div className="col-span-2 text-right">TVL</div>
          <div className="col-span-2 text-right">APY</div>
          <div className="col-span-1 text-right">Action</div>
        </div>
        {loading ? (
          <div className="space-y-px">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-3 px-5 py-4">
                <div className="col-span-12 h-4 animate-pulse rounded bg-white/[0.04]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {data.map((p, i) => (
              <motion.div
                key={p.pool_id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.015, 0.4), duration: 0.3 }}
                className="grid grid-cols-12 items-center gap-3 px-5 py-3.5 transition-colors hover:bg-white/[0.02]"
                data-testid="opp-row"
              >
                <div className="col-span-4 flex items-center gap-3">
                  <div className="h-8 w-8 flex-shrink-0 rounded-md border border-line bg-bg-elevated text-center font-display text-xs leading-8 text-ink-dim">
                    {(p.protocol || "?").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm text-ink">{p.protocol}</span>
                      {p.beginner_safe && (
                        <span className="rounded-full border border-safe/30 bg-safe/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-safe">Safe</span>
                      )}
                    </div>
                    <div className="font-mono text-[11px] uppercase tracking-wide text-ink-mute">{p.asset}</div>
                  </div>
                </div>
                <div className="col-span-2 font-mono text-xs text-ink-dim">{p.chain}</div>
                <div className="col-span-1"><RiskBadge risk={p.risk} /></div>
                <div className="col-span-2 text-right font-mono text-xs text-ink-dim">{fmtUSD(p.tvl_usd)}</div>
                <div className="col-span-2 text-right font-mono text-sm font-medium text-ink">{fmtAPY(p.apy)}</div>
                <div className="col-span-1 flex items-center justify-end gap-1">
                  {p.url && (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md p-1.5 text-ink-mute hover:bg-white/5 hover:text-ink"
                      title="Open source"
                      data-testid="opp-external"
                    >
                      <ArrowSquareOut size={14} />
                    </a>
                  )}
                  <button
                    onClick={() => addWatch(p)}
                    disabled={watchlistIds.has(p.pool_id)}
                    className={`rounded-md p-1.5 text-ink-mute hover:bg-white/5 hover:text-ink ${watchlistIds.has(p.pool_id) ? "opacity-40" : ""}`}
                    title={watchlistIds.has(p.pool_id) ? "Already in watchlist" : "Add to watchlist"}
                    data-testid="opp-add-watch"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
            {!data.length && (
              <div className="px-5 py-12 text-center text-sm text-ink-mute">No opportunities match the filters.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
