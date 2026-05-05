import Link from 'next/link'

const proofPoints = [
  ['Live yield scan', 'Hourly server-side DeFiLlama ingestion with curated fallback routes.'],
  ['Persistent alerts', 'Saved watchlists and email rules tied to an authenticated account.'],
  ['Risk first', 'Confidence scoring, TVL checks, fee context, and no-profit-guarantee disclosure.'],
]

export default function HomePage() {
  return (
    <main className="landing-shell">
      <header className="landing-header">
        <Link className="brand" href="/">
          <span className="brand-mark">QY</span>
          <span>
            <strong>QuickYield</strong>
            <small>Intel Beta</small>
          </span>
        </Link>
        <nav className="landing-nav" aria-label="Primary">
          <a href="#signals">Signals</a>
          <a href="#risk">Risk</a>
          <Link href="/dashboard">Dashboard</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div>
          <h1>Crypto yield research that watches the boring risk details for you.</h1>
          <p>
            QuickYield scans public yield data, normalizes risk signals, saves your watchlist,
            and emails beta alerts when safer opportunities match your rules.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/dashboard">
              Open beta dashboard
            </Link>
            <a className="ghost-button" href="#risk">
              Review disclosure
            </a>
          </div>
        </div>

        <div className="hero-product" aria-label="QuickYield product preview">
          <div className="preview-top">
            <span>Scanner health</span>
            <strong>Live + curated</strong>
          </div>
          <div className="preview-row selected">
            <span>USDC</span>
            <strong>8.4% APY</strong>
            <em>Low risk</em>
          </div>
          <div className="preview-row">
            <span>SOL</span>
            <strong>7.1% APY</strong>
            <em>94 score</em>
          </div>
          <div className="preview-row">
            <span>Alert</span>
            <strong>Base stablecoins</strong>
            <em>Email on match</em>
          </div>
        </div>
      </section>

      <section className="proof-grid" id="signals" aria-label="Product capabilities">
        {proofPoints.map(([title, copy]) => (
          <article key={title}>
            <h2>{title}</h2>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="disclaimer-card" id="risk">
        <h2>Important disclosure</h2>
        <p>
          QuickYield is an informational research and alerting tool. It does not provide
          financial advice, custody funds, execute transactions, guarantee returns, or verify
          that an external protocol is safe. Always review the destination platform, fees,
          lockups, smart-contract risk, tax impact, and regional availability before depositing
          assets.
        </p>
      </section>
    </main>
  )
}
