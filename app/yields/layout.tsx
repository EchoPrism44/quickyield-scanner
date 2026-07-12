import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'

export default function YieldsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  )
}
