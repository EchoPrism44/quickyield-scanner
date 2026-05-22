import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="qy-auth">
        <section className="qy-auth-card">
          <Link href="/" className="qy-logo" style={{ marginBottom: 24 }}>
            <span className="qy-logo-mark"><span /><span /><span /></span>
            <span className="qy-logo-text">QuickYield</span>
          </Link>
          <h1>Sign-in unavailable</h1>
          <p>
            Clerk auth is not configured for this environment. Add <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--signal)' }}>NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code> and <code style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--signal)' }}>CLERK_SECRET_KEY</code> before opening the private terminal.
          </p>
          <Link className="qy-btn qy-btn-secondary qy-btn-lg" href="/" style={{ width: '100%' }}>
            Back to home
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
