import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Trash, Bell, ArrowSquareOut, Eye } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api, apiErr, fmtAPY, fmtUSD } from "@/lib/api";

export default function Watchlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingAlertFor, setCreatingAlertFor] = useState(null);
  const [thrBelow, setThrBelow] = useState("");
  const [thrAbove, setThrAbove] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/watchlist");
      setItems(r.data.items || []);
    } catch (e) {
      toast.error(apiErr(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (pool_id) => {
    try {
      await api.delete(`/watchlist/${pool_id}`);
      setItems((p) => p.filter((x) => x.pool_id !== pool_id));
      toast.success("Removed from watchlist");
    } catch (e) { toast.error(apiErr(e)); }
  };

  const createAlert = async (item) => {
    try {
      await api.post("/alerts", {
        pool_id: item.pool_id,
        protocol: item.protocol,
        chain: item.chain,
        asset: item.asset,
        apy_baseline: item.current_apy ?? item.apy,
        threshold_below: thrBelow ? parseFloat(thrBelow) : null,
        threshold_above: thrAbove ? parseFloat(thrAbove) : null,
        enabled: true,
      });
      setCreatingAlertFor(null); setThrBelow(""); setThrAbove("");
      toast.success("Alert created — we'll email you when thresholds cross.");
    } catch (e) { toast.error(apiErr(e)); }
  };

  return (
    <div className="px-6 py-8" data-testid="watchlist-page">
      <div className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Saved</div>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">Watchlist</h1>
        <p className="mt-1 text-sm text-ink-dim">Pools you're tracking. Set thresholds to get alerts.</p>
      </div>
      {loading ? (
        <div className="rounded-xl border border-line bg-bg-surface p-12 text-center text-sm text-ink-mute">Loading…</div>
      ) : !items.length ? (
        <div className="rounded-xl border border-dashed border-line p-16 text-center" data-testid="watchlist-empty">
          <Eye size={28} className="mx-auto text-ink-mute" weight="duotone" />
          <h3 className="mt-4 font-display text-lg text-ink">No pools saved yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-dim">
            Browse Opportunities and click the + icon to start tracking yields.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <motion.div
              key={it.pool_id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-line bg-bg-surface"
              data-testid="watchlist-row"
            >
              <div className="flex flex-wrap items-center gap-4 p-5">
                <div className="h-10 w-10 rounded-md border border-line bg-bg-elevated text-center font-display text-base leading-10 text-ink-dim">
                  {(it.protocol || "?").slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-ink">{it.protocol}</div>
                  <div className="font-mono text-[11px] uppercase tracking-wide text-ink-mute">{it.chain} · {it.asset}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">Saved at</div>
                  <div className="font-mono text-sm text-ink-dim">{fmtAPY(it.apy)}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">Now</div>
                  <div className="font-mono text-sm font-medium text-ink">{fmtAPY(it.current_apy ?? it.apy)}</div>
                </div>
                <div className="text-right hidden md:block">
                  <div className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">TVL</div>
                  <div className="font-mono text-xs text-ink-dim">{fmtUSD(it.tvl_usd)}</div>
                </div>
                <div className="flex items-center gap-1">
                  {it.url && (
                    <a href={it.url} target="_blank" rel="noopener noreferrer" className="rounded-md p-2 text-ink-mute hover:bg-white/5 hover:text-ink"><ArrowSquareOut size={14} /></a>
                  )}
                  <button
                    onClick={() => setCreatingAlertFor(creatingAlertFor === it.pool_id ? null : it.pool_id)}
                    className="rounded-md p-2 text-ink-mute hover:bg-white/5 hover:text-ink"
                    data-testid="wl-create-alert-btn"
                    title="Create alert"
                  ><Bell size={14} /></button>
                  <button
                    onClick={() => remove(it.pool_id)}
                    className="rounded-md p-2 text-ink-mute hover:bg-risk/10 hover:text-risk"
                    data-testid="wl-remove-btn"
                  ><Trash size={14} /></button>
                </div>
              </div>
              {creatingAlertFor === it.pool_id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="overflow-hidden border-t border-line bg-bg-page/60">
                  <div className="flex flex-wrap items-end gap-3 p-5">
                    <div>
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-mute">Notify if APY drops below</div>
                      <input value={thrBelow} onChange={(e) => setThrBelow(e.target.value)} type="number" step="0.01" placeholder="6.00" className="w-28 rounded-md border border-line bg-bg-elevated px-3 py-2 font-mono text-sm text-ink focus:border-signal/40 focus:outline-none" data-testid="alert-threshold-below" />
                    </div>
                    <div>
                      <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-mute">…or rises above</div>
                      <input value={thrAbove} onChange={(e) => setThrAbove(e.target.value)} type="number" step="0.01" placeholder="12.00" className="w-28 rounded-md border border-line bg-bg-elevated px-3 py-2 font-mono text-sm text-ink focus:border-signal/40 focus:outline-none" data-testid="alert-threshold-above" />
                    </div>
                    <button onClick={() => createAlert(it)} className="rounded-full bg-signal px-5 py-2 text-sm font-medium text-white hover:bg-signal-hover" data-testid="alert-save-btn">Save alert</button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
