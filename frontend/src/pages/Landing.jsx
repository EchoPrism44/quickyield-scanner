import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Bell, ChartLineUp, ShieldCheck, Sparkle, Lightning, Eye } from "@phosphor-icons/react";
import { api, fmtAPY, fmtUSD } from "@/lib/api";
import MarketingNav from "@/components/MarketingNav";
import AuthModal from "@/components/AuthModal";
import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
};

const stagger = (i = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] },
});

function HeroPreview() {
  const [pools, setPools] = useState([]);
  useEffect(() => {
    api.get("/opportunities", { params: { beginner_safe: true, limit: 5 } })
      .then((r) => setPools(r.data.items || []))
      .catch(() => {});
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      style={{ transformPerspective: 1200 }}
      className="relative w-full"
      data-testid="hero-preview"
    >
      <div className="absolute -inset-x-12 -inset-y-8 -z-10 bg-signal/10 blur-[120px]" />
      <div className="overflow-hidden rounded-2xl border border-line bg-bg-surface shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] noise">
        <div className="flex items-center gap-1.5 border-b border-line bg-bg-page/60 px-4 py-3">
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <div className="ml-3 flex items-center gap-2 text-xs text-ink-mute">
            <span className="dot-pulse" />
            <span className="font-mono">app.quickyield.io/dashboard</span>
          </div>
        </div>
        <div className="grid grid-cols-12 gap-0">
          <div className="col-span-3 hidden border-r border-line p-4 md:block">
            <div className="space-y-1">
              {["Opportunities", "Watchlist", "Alerts", "Settings"].map((s, i) => (
                <div
                  key={s}
                  className={`rounded-md px-3 py-2 text-xs ${
                    i === 0 ? "bg-white/5 text-ink" : "text-ink-mute"
                  }`}
                >
                  {s}
                </div>
              ))}
            </div>
          </div>
          <div className="col-span-12 md:col-span-9">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-mute">Top opportunities</div>
                <div className="mt-0.5 font-display text-base text-ink">Beginner-safe routes</div>
              </div>
              <div className="rounded-full border border-line px-3 py-1 text-[11px] text-ink-dim">Live</div>
            </div>
            <div className="divide-y divide-white/5">
              {(pools.length ? pools : Array.from({ length: 5 }).map((_, i) => ({
                pool_id: `s${i}`,
                protocol: ["Aave v3", "Compound v3", "Morpho", "Lido", "Curve"][i],
                chain: ["Arbitrum", "Ethereum", "Base", "Ethereum", "Polygon"][i],
                asset: ["USDC", "USDT", "DAI", "stETH", "USDC"][i],
                apy: [8.42, 6.18, 9.34, 4.21, 7.55][i],
                tvl_usd: [9.3e8, 6.1e8, 4.8e8, 2.1e10, 1.8e8][i],
                beginner_safe: true,
              }))).slice(0, 5).map((p, i) => (
                <motion.div
                  key={p.pool_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.5 }}
                  className="grid grid-cols-12 items-center gap-4 px-5 py-3 hover:bg-white/[0.02]"
                >
                  <div className="col-span-5 flex items-center gap-3">
                    <div className="h-7 w-7 rounded-md border border-line bg-bg-elevated" />
                    <div>
                      <div className="text-sm text-ink">{p.protocol}</div>
                      <div className="font-mono text-[11px] uppercase tracking-wide text-ink-mute">
                        {p.chain} · {p.asset}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-3">
                    {p.beginner_safe && (
                      <span className="rounded-full border border-safe/30 bg-safe/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-safe">
                        Safe
                      </span>
                    )}
                  </div>
                  <div className="col-span-2 text-right font-mono text-xs text-ink-dim">
                    {fmtUSD(p.tvl_usd)}
                  </div>
                  <div className="col-span-2 text-right font-mono text-sm font-medium text-ink">
                    {fmtAPY(p.apy)}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function HowItWorks() {
  const steps = [
    { n: "01", icon: ChartLineUp, title: "Scan opportunities", body: "Live yields from 30+ protocols across 20+ chains, curated and ranked. Beginner-safe routes are clearly tagged." },
    { n: "02", icon: Eye, title: "Build a watchlist", body: "Save the pools you care about. We track them every hour and surface meaningful changes — no noise." },
    { n: "03", icon: Bell, title: "Set smart alerts", body: "Notify me if Aave/USDC drops below 6% or Pendle/sUSDe rises above 12%. Email lands in seconds." },
    { n: "04", icon: Lightning, title: "Act with confidence", body: "Click the source link to deposit on the protocol's official site. We never touch your funds." },
  ];
  return (
    <section id="how" className="relative mx-auto max-w-7xl px-6 py-32">
      <motion.div {...fadeUp} className="mb-14 max-w-2xl">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-signal">How it works</div>
        <h2 className="font-display text-4xl tracking-tighter text-ink sm:text-5xl">
          From overwhelming to obvious in four steps.
        </h2>
        <p className="mt-4 text-ink-dim">
          Stop manually checking DeFiLlama every morning. QuickYield watches yields for you and tells you what changed.
        </p>
      </motion.div>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <motion.div
            key={s.n}
            {...stagger(i)}
            className="group relative bg-bg-surface p-7 transition-colors hover:bg-bg-elevated"
            data-testid={`how-step-${s.n}`}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="font-mono text-xs text-ink-mute">{s.n}</span>
              <s.icon size={22} weight="duotone" className="text-signal" />
            </div>
            <h3 className="mb-2 font-display text-xl tracking-tight text-ink">{s.title}</h3>
            <p className="text-sm leading-relaxed text-ink-dim">{s.body}</p>
            <div className="absolute inset-x-0 bottom-0 h-px scale-x-0 bg-signal transition-transform duration-500 group-hover:scale-x-100" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function FeatureBento() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-6 py-32">
      <motion.div {...fadeUp} className="mb-14 max-w-2xl">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-signal">Features</div>
        <h2 className="font-display text-4xl tracking-tighter text-ink sm:text-5xl">
          Built for crypto-curious and DeFi natives alike.
        </h2>
      </motion.div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
        <motion.div {...stagger(0)} className="md:col-span-2 md:row-span-2 relative overflow-hidden rounded-2xl border border-line bg-bg-surface p-8 noise">
          <div className="relative z-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Live scanner</div>
            <h3 className="mt-2 font-display text-3xl tracking-tight text-ink">Curated yields, ranked by what matters.</h3>
            <p className="mt-3 max-w-md text-sm text-ink-dim">
              Sort by APY, filter by chain or asset. Beginner-safe routes (Aave, Compound, Morpho, Lido) are tagged so you can act without second-guessing.
            </p>
          </div>
          <div className="absolute -bottom-8 -right-12 hidden h-72 w-[460px] rotate-[2deg] overflow-hidden rounded-xl border border-line bg-bg-elevated md:block">
            <div className="border-b border-line p-3 text-[11px] uppercase tracking-wider text-ink-mute">Top APYs · USDC</div>
            <div className="divide-y divide-white/5">
              {[
                { p: "Pendle", c: "Arbitrum", a: 12.4 },
                { p: "Morpho", c: "Base", a: 9.34 },
                { p: "Aave v3", c: "Arbitrum", a: 8.42 },
                { p: "Spark", c: "Ethereum", a: 7.61 },
                { p: "Compound v3", c: "Optimism", a: 6.18 },
              ].map((r, i) => (
                <div key={i} className="grid grid-cols-12 px-4 py-2.5 text-xs">
                  <div className="col-span-6 text-ink">{r.p}</div>
                  <div className="col-span-3 text-ink-mute">{r.c}</div>
                  <div className="col-span-3 text-right font-mono text-ink">{r.a.toFixed(2)}%</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div {...stagger(1)} className="rounded-2xl border border-line bg-bg-surface p-7">
          <Bell size={26} weight="duotone" className="text-signal" />
          <h3 className="mt-6 font-display text-xl tracking-tight text-ink">Threshold alerts</h3>
          <p className="mt-2 text-sm text-ink-dim">
            "Email me if APY drops below 6%." Instant notifications when something moves.
          </p>
        </motion.div>

        <motion.div {...stagger(2)} className="rounded-2xl border border-line bg-bg-surface p-7">
          <ShieldCheck size={26} weight="duotone" className="text-safe" />
          <h3 className="mt-6 font-display text-xl tracking-tight text-ink">No custody, ever</h3>
          <p className="mt-2 text-sm text-ink-dim">
            We don't connect wallets, hold funds, or execute trades. Pure research and alerting.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

function StatsStrip() {
  const [stats, setStats] = useState({ total_pools: 500, total_tvl_usd: 80e9, beginner_safe_count: 120, avg_apy: 6.2 });
  useEffect(() => {
    api.get("/opportunities/meta").then((r) => r.data?.stats && setStats(r.data.stats)).catch(() => {});
  }, []);
  const items = [
    { label: "Pools tracked", value: stats.total_pools.toLocaleString() },
    { label: "Total TVL", value: fmtUSD(stats.total_tvl_usd) },
    { label: "Beginner-safe", value: stats.beginner_safe_count.toLocaleString() },
    { label: "Avg APY", value: `${stats.avg_apy.toFixed(1)}%` },
  ];
  return (
    <section className="border-y border-line bg-bg-surface/50">
      <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-line md:grid-cols-4">
        {items.map((s, i) => (
          <motion.div key={s.label} {...stagger(i)} className="px-6 py-10 text-center">
            <div className="font-display text-3xl tracking-tighter text-ink md:text-4xl">{s.value}</div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">{s.label}</div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function Testimonials() {
  const items = [
    { q: "Finally a clean way to see DeFi yields without drowning in data. The alerts saved me from staying in a pool that tanked overnight.", n: "Marcus R.", t: "Solo investor" },
    { q: "I check QuickYield every morning instead of seven dashboards. The beginner-safe tag is genuinely useful for clients new to crypto.", n: "Priya S.", t: "Wealth advisor" },
    { q: "The threshold alerts are the killer feature. I sleep better knowing I'll be emailed if my Aave APY drops below my floor.", n: "Daniel K.", t: "DeFi power user" },
  ];
  return (
    <section className="mx-auto max-w-7xl px-6 py-32">
      <motion.div {...fadeUp} className="mb-12 max-w-2xl">
        <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.24em] text-signal">Loved by users</div>
        <h2 className="font-display text-4xl tracking-tighter text-ink sm:text-5xl">
          People stop checking DeFiLlama after a week with QuickYield.
        </h2>
      </motion.div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((it, i) => (
          <motion.figure key={i} {...stagger(i)} className="rounded-2xl border border-line bg-bg-surface p-7">
            <Sparkle size={18} className="mb-4 text-signal" weight="fill" />
            <blockquote className="text-sm leading-relaxed text-ink">"{it.q}"</blockquote>
            <figcaption className="mt-5 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-signal/40 to-bg-elevated ring-1 ring-line" />
              <div>
                <div className="text-sm text-ink">{it.n}</div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-ink-mute">{it.t}</div>
              </div>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}

function CTA({ onAuth }) {
  return (
    <section className="mx-auto max-w-7xl px-6 pb-32">
      <motion.div
        {...fadeUp}
        className="relative overflow-hidden rounded-3xl border border-line bg-bg-surface p-12 text-center md:p-20 noise"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_0%,rgba(255,69,0,0.16),transparent_60%)]" />
        <h2 className="mx-auto max-w-2xl font-display text-4xl tracking-tighter text-ink sm:text-5xl text-balance">
          Stop manually checking yields.<br />Start getting notified.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-ink-dim">
          Free during beta. No wallet connection. No spam. Just clarity on where your stablecoins should sit.
        </p>
        <button
          onClick={() => onAuth("register")}
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-signal px-7 py-3.5 text-sm font-medium text-white transition-all hover:bg-signal-hover signal-glow"
          data-testid="cta-getstarted"
        >
          Get started free <ArrowRight size={16} weight="bold" />
        </button>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 md:grid-cols-4">
        <div>
          <div className="font-display text-base text-ink">QuickYield</div>
          <p className="mt-2 max-w-xs text-xs text-ink-dim">
            Research and alerting for DeFi yields. Not financial advice. No custody. Always verify on the source protocol.
          </p>
        </div>
        <div>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">Product</div>
          <ul className="space-y-2 text-sm text-ink-dim">
            <li><a href="#features" className="hover:text-ink">Features</a></li>
            <li><a href="#how" className="hover:text-ink">How it works</a></li>
            <li><a href="#pricing" className="hover:text-ink">Pricing</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">Resources</div>
          <ul className="space-y-2 text-sm text-ink-dim">
            <li><a href="#faq" className="hover:text-ink">FAQ</a></li>
            <li><a href="#" className="hover:text-ink">Disclaimers</a></li>
          </ul>
        </div>
        <div>
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">Legal</div>
          <ul className="space-y-2 text-sm text-ink-dim">
            <li>Informational only</li>
            <li>No financial advice</li>
            <li>No custody of funds</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-6 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
        © 2026 QuickYield · Built for clarity in DeFi
      </div>
    </footer>
  );
}

export default function Landing() {
  const [authMode, setAuthMode] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate("/app/opportunities");
  }, [user, navigate]);

  const openAuth = (mode) => setAuthMode(mode);

  return (
    <div className="min-h-screen bg-bg-page text-ink" data-testid="landing-page">
      <MarketingNav onAuth={openAuth} />

      {/* HERO */}
      <section className="relative overflow-hidden pt-32">
        <div className="absolute inset-0 grid-bg grid-bg-fade" />
        <div className="absolute left-1/2 top-32 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-signal/[0.07] blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-bg-surface/60 px-4 py-1.5 text-xs text-ink-dim"
          >
            <span className="dot-pulse" />
            <span className="font-mono">DeFiLlama-powered · live yields · email alerts</span>
          </motion.div>

          <div className="grid items-center gap-12 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7"
            >
              <h1 className="font-display text-[44px] leading-[1.02] tracking-tighter text-ink text-balance sm:text-6xl lg:text-[72px]">
                Where your <span className="text-signal">stablecoins</span><br className="hidden sm:block" />
                should sit, right now.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-dim">
                QuickYield scans 500+ DeFi pools every hour, surfaces the beginner-safe routes, and emails you the second something moves. No wallet. No custody. No noise.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => openAuth("register")}
                  className="inline-flex items-center gap-2 rounded-full bg-signal px-6 py-3 text-sm font-medium text-white transition-all hover:bg-signal-hover signal-glow"
                  data-testid="hero-cta-primary"
                >
                  Start scanning free <ArrowRight size={16} weight="bold" />
                </button>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm text-ink hover:border-line-hover hover:bg-white/[0.03] transition-all"
                  data-testid="hero-cta-secondary"
                >
                  See how it works
                </a>
              </div>
              <div className="mt-8 flex items-center gap-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-mute">
                <span>· Aave</span><span>· Compound</span><span>· Morpho</span><span>· Pendle</span><span>· Lido</span>
              </div>
            </motion.div>
            <div className="lg:col-span-5">
              <HeroPreview />
            </div>
          </div>
        </div>
      </section>

      <StatsStrip />
      <HowItWorks />
      <FeatureBento />
      <Testimonials />
      <CTA onAuth={openAuth} />
      <Footer />

      <AuthModal
        open={!!authMode}
        mode={authMode || "login"}
        onClose={() => setAuthMode(null)}
        onSwitch={(m) => setAuthMode(m)}
      />
    </div>
  );
}
