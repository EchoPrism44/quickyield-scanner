import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <Link className="brand" href="/">
            <span className="brand-mark">QY</span>
            <span>
              <strong>QuickYield</strong>
              <small>Dev auth</small>
            </span>
          </Link>
          <h1>Clerk is not configured locally.</h1>
          <p>
            Add Clerk environment variables to enable email magic-link sign-in. Until then,
            the dashboard uses a local development identity so the SaaS flows can be tested.
          </p>
          <Link className="primary-button full-width" href="/dashboard">
            Continue as local beta user
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <SignIn />
    </main>
  )
}
