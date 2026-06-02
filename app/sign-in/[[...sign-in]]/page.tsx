import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'
import { BrandLogo } from '../../../components/brand-logo'

export default function SignInPage() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="qy-auth">
        <section className="qy-auth-card">
          <BrandLogo href="/" className="qy-auth-logo" />
          <h1>Try the demo terminal</h1>
          <p>
            Sign-in isn&apos;t configured in this environment, but you can explore the full terminal in local-demo mode — no account needed.
          </p>
          <Link className="qy-btn qy-btn-primary qy-btn-lg" href="/terminal" style={{ width: '100%' }}>
            Open demo terminal
          </Link>
          <Link className="qy-btn qy-btn-secondary qy-btn-lg" href="/" style={{ width: '100%', marginTop: 10 }}>
            Back to home
          </Link>
        </section>
      </main>
    )
  }

  return (
    <main className="qy-auth">
      <SignIn fallbackRedirectUrl="/terminal" forceRedirectUrl="/terminal" />
    </main>
  )
}
