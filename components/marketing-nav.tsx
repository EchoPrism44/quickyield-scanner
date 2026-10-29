import Link from 'next/link'
import { BrandLogo } from './brand-logo'

export function MarketingNav() {
  return (
    <nav className="ql-nav" data-testid="marketing-nav">
      <div className="ql-nav-inner">
        <BrandLogo href="/" className="ql-logo-nav" />
        <div className="ql-nav-links">
          <Link href="/blog" className="ql-nav-link">Latest</Link>
          <Link href="/blog/category/defi" className="ql-nav-link">DeFi</Link>
          <Link href="/blog/category/markets" className="ql-nav-link">Markets</Link>
          <Link href="/blog/category/regulation" className="ql-nav-link">Policy</Link>
          <Link href="/about" className="ql-nav-link">About</Link>
        </div>
        <div className="ql-nav-actions">
          <Link href="/blog" className="ql-btn ql-btn--primary ql-btn--sm">Read the news</Link>
        </div>
      </div>
    </nav>
  )
}
