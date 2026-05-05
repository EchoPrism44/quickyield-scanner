import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bell, Trash, BellSlash } from "@phosphor-icons/react";
import { toast } from "sonner";
import { api, apiErr, fmtAPY } from "@/lib/api";

export default function Alerts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/alerts");
      setItems(r.data.items || []);
    } catch (e) { toast.error(apiErr(e)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (a) => {
    try {
      const r = await api.patch(`/alerts/${a.id}`, { enabled: !a.enabled });
      setItems((p) => p.map((x) => (x.id === a.id ? r.data : x)));
    } catch (e) { toast.error(apiErr(e)); }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/alerts/${id}`);
      setItems((p) => p.filter((x) => x.id !== id));
      toast.success("Alert removed");
    } catch (e) { toast.error(apiErr(e)); }
  };

  return (
    <div className="px-6 py-8" data-testid="alerts-page">
      <div className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Notifications</div>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">Alerts</h1>
        <p className="mt-1 text-sm text-ink-dim">Threshold rules across your watchlist. Email lands the second a threshold is crossed.</p>
      </div>
      {loading ? (
        <div className="rounded-xl border border-line bg-bg-surface p-12 text-center text-sm text-ink-mute">Loading…</div>
      ) : !items.length ? (
        <div className="rounded-xl border border-dashed border-line p-16 text-center" data-testid="alerts-empty">
          <Bell size={28} className="mx-auto text-ink-mute" weight="duotone" />
          <h3 className="mt-4 font-display text-lg text-ink">No alerts yet</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-dim">
            Open your Watchlist and tap the bell icon on a pool to set a threshold.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-bg-surface">
          <div className="grid grid-cols-12 gap-3 border-b border-line px-5 py-3 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
            <div className="col-span-4">Pool</div>
            <div className="col-span-2">Baseline</div>
            <div className="col-span-2">Below</div>
            <div className="col-span-2">Above</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {items.map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`grid grid-cols-12 items-center gap-3 px-5 py-4 ${a.enabled ? "" : "opacity-50"}`}
                data-testid="alert-row"
              >
                <div className="col-span-4">
                  <div className="text-sm text-ink">{a.protocol}</div>
                  <div className="font-mono text-[11px] uppercase tracking-wide text-ink-mute">{a.chain} · {a.asset}</div>
                </div>
                <div className="col-span-2 font-mono text-sm text-ink-dim">{fmtAPY(a.apy_baseline)}</div>
                <div className="col-span-2 font-mono text-sm text-risk">{a.threshold_below != null ? fmtAPY(a.threshold_below) : "—"}</div>
                <div className="col-span-2 font-mono text-sm text-safe">{a.threshold_above != null ? fmtAPY(a.threshold_above) : "—"}</div>
                <div className="col-span-2 flex items-center justify-end gap-1">
                  <button onClick={() => toggle(a)} className="rounded-md p-2 text-ink-mute hover:bg-white/5 hover:text-ink" data-testid="alert-toggle">
                    {a.enabled ? <Bell size={14} /> : <BellSlash size={14} />}
                  </button>
                  <button onClick={() => remove(a.id)} className="rounded-md p-2 text-ink-mute hover:bg-risk/10 hover:text-risk" data-testid="alert-delete">
                    <Trash size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
