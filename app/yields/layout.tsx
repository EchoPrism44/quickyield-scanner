import Link from 'next/link'
import { MarketingNav } from '../../components/marketing-nav'

export default function YieldsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />
      {children}
      <footer className="ql-footer">
        <div className="ql-wrap">
          <div className="ql-footer-base">
            <span>© 2026 QuickYield · Research only — not financial advice, no custody</span>
            <span><Link href="/legal/disclaimer">Disclaimer</Link></span>
          </div>
        </div>
      </footer>
    </div>
  )
}
