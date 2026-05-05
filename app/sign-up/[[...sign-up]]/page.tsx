import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="auth-shell">
        <section className="auth-card">
          <h1>Local beta signup</h1>
          <p>
            Clerk keys are not configured in this workspace. Use the dashboard with the local
            beta identity, then connect Clerk on Vercel for real email signups.
          </p>
          <Link className="primary-button full-width" href="/dashboard">
            Open dashboard
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="auth-shell">
      <SignUp />
    </main>
  )
}
