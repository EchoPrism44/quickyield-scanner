import React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChartLineUp, Eye, Bell, Gear, SignOut, MagnifyingGlass } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth";

const navItems = [
  { to: "/app/opportunities", label: "Opportunities", icon: ChartLineUp },
  { to: "/app/watchlist", label: "Watchlist", icon: Eye },
  { to: "/app/alerts", label: "Alerts", icon: Bell },
  { to: "/app/settings", label: "Settings", icon: Gear },
];

const Logo = () => (
  <div className="flex items-center gap-2">
    <div className="relative h-7 w-7">
      <div className="absolute inset-0 rounded-md bg-signal" />
      <div className="absolute inset-[3px] rounded-[3px] bg-bg-page" />
      <div className="absolute inset-[6px] rounded-[2px] bg-signal" />
    </div>
    <span className="font-display text-[15px] font-medium tracking-tight text-ink">QuickYield</span>
  </div>
);

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (user === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page text-ink-dim">
        <div className="font-mono text-xs uppercase tracking-widest">Loading…</div>
      </div>
    );
  }
  if (user === null) {
    navigate("/", { replace: true });
    return null;
  }

  return (
    <div className="flex min-h-screen bg-bg-page text-ink">
      {/* Sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-line bg-bg-surface md:flex md:flex-col" data-testid="dash-sidebar">
        <div className="border-b border-line px-5 py-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-white/[0.06] text-ink" : "text-ink-dim hover:bg-white/[0.03] hover:text-ink"
                }`
              }
              data-testid={`nav-${it.label.toLowerCase()}`}
            >
              <it.icon size={17} weight="duotone" />
              <span>{it.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <div className="mb-2 truncate rounded-md px-3 py-2 text-xs text-ink-mute">
            <div className="font-mono uppercase tracking-wider text-[10px] text-ink-mute">Signed in as</div>
            <div className="text-ink truncate">{user.email}</div>
          </div>
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-ink-dim hover:bg-white/[0.03] hover:text-ink"
            data-testid="logout-btn"
          >
            <SignOut size={16} weight="duotone" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg-page/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-3 text-xs text-ink-mute">
            <span className="dot-pulse" />
            <span className="font-mono uppercase tracking-[0.16em]">Live · Updated hourly</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-line bg-bg-surface px-3 py-1.5 text-xs text-ink-mute md:flex">
              <MagnifyingGlass size={12} />
              <span className="font-mono">⌘K</span>
            </div>
          </div>
        </header>
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
