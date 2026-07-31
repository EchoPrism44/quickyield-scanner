import Link from 'next/link'

/**
 * Shared footer for every public marketing surface
 * (landing, /docs, /proof, /yields, legal, auth shells).
 */
export function MarketingFooter() {
  return (
    <footer className="ql-footer">
      <div className="ql-wrap">
        <div className="ql-footer-grid">
          <div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>QuickYield</strong>
            <p className="ql-footer-blurb">
              Onchain yield research with a public track record. Research only — not investment
              advice, not an audit, and never custody. Always verify with the protocol before
              moving funds.
            </p>
          </div>
          <div>
            <h5>Product</h5>
            <ul>
              <li><Link href="/proof">Track record</Link></li>
              <li><Link href="/docs">Methodology</Link></li>
              <li><Link href="/yields">Best yields</Link></li>
              <li><Link href="/blog">Research</Link></li>
              <li><Link href="/roadmap">Roadmap</Link></li>
              <li><Link href="/terminal">Launch terminal</Link></li>
            </ul>
          </div>
          <div>
            <h5>Transparency</h5>
            <ul>
              <li><Link href="/proof">Public track record</Link></li>
              <li><Link href="/docs#ledger">The on-chain ledger</Link></li>
              <li><Link href="/docs#signals">Grading signals</Link></li>
            </ul>
          </div>
          <div>
            <h5>Legal</h5>
            <ul>
              <li><Link href="/legal/terms">Terms</Link></li>
              <li><Link href="/legal/privacy">Privacy</Link></li>
              <li><Link href="/legal/disclaimer">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        <div className="ql-footer-base">
          <span>© 2026 QuickYield</span>
          <span>Graded in the open</span>
        </div>
      </div>
    </footer>
  )
}
