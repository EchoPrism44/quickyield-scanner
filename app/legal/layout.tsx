import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { MarketingNav } from '../../components/marketing-nav'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="ql-legal">
        <div className="ql-legal-wrap">
          <Link href="/" className="ql-legal-back"><ArrowLeft size={15} /> Back to home</Link>
          {children}
        </div>
      </main>
    </>
  )
}
