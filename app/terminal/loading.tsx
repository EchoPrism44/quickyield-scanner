import { BrandLogo } from '../../components/brand-logo'

export default function TerminalLoading() {
  return (
    <div className="qy-app">
      <aside className="qy-aside">
        <div className="qy-aside-head">
          <BrandLogo />
        </div>
        <nav className="qy-aside-nav">
          {/* Mirrors navItems in components/dashboard-app.tsx — keep in sync,
              otherwise the sidebar jumps when the real nav swaps in. */}
          {['Discover', 'Watchlist', 'Portfolio', 'Alerts', 'Settings'].map((l) => (
            <div key={l} className="qy-aside-link" style={{ opacity: 0.4 }}>
              {l}
            </div>
          ))}
        </nav>
      </aside>
      <div className="qy-main">
        <header className="qy-topbar">
          <div className="qy-topbar-status">
            <span className="qy-pill-dot" />
            <span className="qy-overline">Loading scanner…</span>
          </div>
        </header>
        <div className="qy-page">
          <div className="qy-page-header">
            <div className="qy-skeleton" style={{ height: 12, width: 80, marginBottom: 8 }} />
            <div className="qy-skeleton" style={{ height: 24, width: 200, borderRadius: 6 }} />
          </div>
          <div className="qy-table-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="qy-table-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="qy-skeleton" style={{ width: 28, height: 28, borderRadius: 6 }} />
                  <div>
                    <div className="qy-skeleton" style={{ height: 14, width: 100, marginBottom: 4 }} />
                    <div className="qy-skeleton" style={{ height: 10, width: 60, borderRadius: 3 }} />
                  </div>
                </div>
                <div className="qy-skeleton" style={{ height: 10, width: 80, borderRadius: 3 }} />
                <div className="qy-skeleton" style={{ height: 10, width: 40, borderRadius: 3 }} />
                <div className="qy-skeleton" style={{ height: 12, width: 70, borderRadius: 3 }} />
                <div className="qy-skeleton" style={{ height: 14, width: 50, borderRadius: 3 }} />
                <div className="qy-skeleton" style={{ height: 10, width: 60, borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
