import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="qy-auth">
        <section className="qy-auth-card">
          <Link href="/" className="qy-logo" style={{ marginBottom: 24 }}>
            <span className="qy-logo-mark"><span /><span /><span /></span>
            <span className="qy-logo-text">QuickYield</span>
          </Link>
          <h1>Sign-up unavailable</h1>
          <p>
            Clerk auth is not configured for this environment. Add the Clerk publishable and secret keys before accepting users into the private terminal.
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
      <SignUp />
    </main>
  )
}
