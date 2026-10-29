import Link from 'next/link'

export function MarketingFooter() {
  return (
    <footer className="ql-footer">
      <div className="ql-wrap">
        <div className="ql-footer-grid">
          <div>
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Litmus</strong>
            <p className="ql-footer-blurb">
              Independent crypto news and research. We cover digital assets, DeFi, markets,
              regulation, and onchain risk with evidence over hype.
            </p>
          </div>
          <div>
            <h5>Coverage</h5>
            <ul>
              <li><Link href="/blog">Latest stories</Link></li>
              <li><Link href="/blog?category=defi">DeFi</Link></li>
              <li><Link href="/blog?category=markets">Markets</Link></li>
              <li><Link href="/blog?category=regulation">Policy & regulation</Link></li>
            </ul>
          </div>
          <div>
            <h5>About Litmus</h5>
            <ul>
              <li><Link href="/about">Editorial standards</Link></li>
              <li><Link href="/about#corrections">Corrections policy</Link></li>
              <li><Link href="/about#independence">Independence</Link></li>
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
          <span>© 2026 Litmus</span>
          <span>Facts first. Hype questioned.</span>
        </div>
      </div>
    </footer>
  )
}
