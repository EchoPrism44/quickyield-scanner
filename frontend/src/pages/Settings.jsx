import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, apiErr } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function Settings() {
  const { user } = useAuth();
  const [s, setS] = useState({ notifications_enabled: true, digest_frequency: "instant" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/user/settings").then((r) => setS(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const save = async (next) => {
    try {
      const r = await api.patch("/user/settings", next);
      setS(r.data);
      toast.success("Settings saved");
    } catch (e) { toast.error(apiErr(e)); }
  };

  return (
    <div className="px-6 py-8" data-testid="settings-page">
      <div className="mb-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Account</div>
        <h1 className="mt-1 font-display text-3xl tracking-tight text-ink">Settings</h1>
      </div>
      <div className="max-w-2xl space-y-6">
        <section className="rounded-xl border border-line bg-bg-surface p-6">
          <h3 className="font-display text-lg text-ink">Profile</h3>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-mute">Email</div>
              <div className="mt-1 text-ink">{user?.email}</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-ink-mute">Name</div>
              <div className="mt-1 text-ink">{user?.name}</div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-bg-surface p-6">
          <h3 className="font-display text-lg text-ink">Notifications</h3>
          <p className="mt-1 text-sm text-ink-dim">Email frequency for alert deliveries.</p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-ink">Email alerts enabled</div>
              <div className="text-xs text-ink-mute">Master switch for all alerts.</div>
            </div>
            <button
              onClick={() => save({ ...s, notifications_enabled: !s.notifications_enabled })}
              className={`relative h-6 w-11 rounded-full transition-colors ${s.notifications_enabled ? "bg-signal" : "bg-white/10"}`}
              disabled={loading}
              data-testid="toggle-notifications"
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${s.notifications_enabled ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>
          <div className="mt-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-mute">Digest frequency</div>
            <div className="flex gap-2">
              {["instant", "daily", "weekly"].map((f) => (
                <button
                  key={f}
                  onClick={() => save({ ...s, digest_frequency: f })}
                  className={`rounded-full border px-4 py-1.5 text-xs ${s.digest_frequency === f ? "border-signal/40 bg-signal/10 text-signal" : "border-line text-ink-dim hover:text-ink"}`}
                  data-testid={`freq-${f}`}
                >{f}</button>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-line bg-bg-surface p-6">
          <h3 className="font-display text-lg text-ink">Disclaimers</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-dim">
            QuickYield is an informational research and alerting tool. We never custody funds, never connect to your wallet, and never execute trades. APY data is sourced from DeFiLlama and refreshed hourly. Always verify on the source protocol before depositing.
          </p>
        </section>
      </div>
    </div>
  );
}
