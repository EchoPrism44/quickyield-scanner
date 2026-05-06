import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="qy-auth">
        <section className="qy-auth-card">
          <Link href="/" className="qy-logo" style={{ marginBottom: 24 }}>
            <span className="qy-logo-mark"><span /><span /><span /></span>
            <span className="qy-logo-text">QuickYield</span>
          </Link>
          <h1>Local beta mode</h1>
          <p>
            Clerk auth isn't configured here. Open the dashboard with a local beta identity to test the product, then connect Clerk on Vercel for real email signups.
          </p>
          <Link className="qy-btn qy-btn-primary qy-btn-glow qy-btn-lg" href="/dashboard" style={{ width: '100%' }}>
            Open dashboard <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="qy-auth">
      <SignUp />
    </main>
  )
}
