import { SignUp } from '@clerk/nextjs'
import Link from 'next/link'
import { BrandLogo } from '../../../components/brand-logo'

export default function SignUpPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="qy-auth">
        <section className="qy-auth-card">
          <BrandLogo href="/" className="qy-auth-logo" />
          <h1>Sign-up unavailable</h1>
          <p>
            Clerk auth is not configured for this environment. Add the Clerk publishable and secret keys before accepting users into the dashboard.
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
      <SignUp fallbackRedirectUrl="/dashboard" forceRedirectUrl="/dashboard" />
    </main>
  )
}
