export default function DashboardLoading() {
  return (
    <div className="qy-app">
      <aside className="qy-aside">
        <div className="qy-aside-head">
          <div className="qy-logo">
            <span className="qy-logo-mark"><span /><span /><span /></span>
            <span className="qy-logo-text">QuickYield</span>
          </div>
        </div>
        <nav className="qy-aside-nav">
          {['Opportunities', 'Watchlist', 'Alerts', 'Settings'].map((l) => (
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
            <span className="qy-overline">Loading...</span>
          </div>
        </header>
        <div className="qy-page">
          <div className="qy-page-header">
            <div style={{ height: 12, width: 80, background: 'var(--line)', borderRadius: 4, marginBottom: 8 }} />
            <div style={{ height: 24, width: 200, background: 'var(--line)', borderRadius: 6 }} />
          </div>
          <div className="qy-table-wrap">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="qy-table-row" style={{ opacity: 1 - i * 0.15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--line)' }} />
                  <div>
                    <div style={{ height: 14, width: 100, background: 'var(--line)', borderRadius: 4, marginBottom: 4 }} />
                    <div style={{ height: 10, width: 60, background: 'var(--line)', borderRadius: 3 }} />
                  </div>
                </div>
                <div style={{ height: 10, width: 80, background: 'var(--line)', borderRadius: 3 }} />
                <div style={{ height: 10, width: 40, background: 'var(--line)', borderRadius: 3 }} />
                <div style={{ height: 12, width: 70, background: 'var(--line)', borderRadius: 3 }} />
                <div style={{ height: 14, width: 50, background: 'var(--line)', borderRadius: 3 }} />
                <div style={{ height: 10, width: 60, background: 'var(--line)', borderRadius: 3 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
