'use client'

import Link from 'next/link'

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="qy-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16, textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--signal)' }}>Dashboard error</div>
      <p style={{ color: 'var(--ink-dim)', maxWidth: 360 }}>Yield data couldn&apos;t load. This is usually temporary.</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => reset()} className="qy-btn qy-btn-primary">
          Retry
        </button>
        <Link href="/" className="qy-btn qy-btn-secondary">
          Back to home
        </Link>
      </div>
    </div>
  )
}
