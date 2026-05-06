import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function SignInPage() {
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
            Clerk auth isn't configured in this workspace. The dashboard works with a local
            development identity. Add <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--signal)' }}>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> on Vercel to enable real email sign-ins.
          </p>
          <Link className="qy-btn qy-btn-primary qy-btn-glow qy-btn-lg" href="/dashboard" style={{ width: '100%' }} data-testid="local-continue-btn">
            Continue to dashboard <ArrowRight size={16} strokeWidth={2.5} />
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="qy-auth">
      <SignIn />
    </main>
  )
}
