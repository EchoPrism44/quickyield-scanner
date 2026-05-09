'use client'

import Link from 'next/link'

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 16, padding: 24, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 700, color: 'var(--signal)' }}>Oops</div>
      <p style={{ color: 'var(--ink-dim)', maxWidth: 400 }}>
        Something went wrong. This is a glitch, not a rug pull.
      </p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => reset()} className="qy-btn qy-btn-primary">
          Try again
        </button>
        <Link href="/" className="qy-btn qy-btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  )
}
