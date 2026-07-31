import { MarketingNav } from '../../components/marketing-nav'
import { MarketingFooter } from '../../components/marketing/marketing-footer'

export default function RoadmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="ql">
      <div className="ql-grain" aria-hidden="true" />
      <MarketingNav />
      <div className="ql-docs">
        <div className="ql-wrap">{children}</div>
      </div>
      <MarketingFooter />
    </main>
  )
}
