'use client'

import { useEffect, useState } from 'react'
import { Bell, Bookmark, Radar, ShieldCheck, X, type LucideIcon } from 'lucide-react'

const STORAGE_KEY = 'qy-onboarded'

type Step = {
  icon: LucideIcon
  overline: string
  title: string
  body: string
}

const steps: Step[] = [
  {
    icon: Radar,
    overline: 'Step 1 · Scan',
    title: 'Find safer yield, fast',
    body: 'Discover scans every live pool on the market feed and ranks them. Every pool gets a Safety Grade (A–F) with a plain-English reason, so high APY never hides high risk.',
  },
  {
    icon: Bookmark,
    overline: 'Step 2 · Save',
    title: 'Track what matters to you',
    body: 'Save pools to your Watchlist to follow their APY, grade, and how they move over time — your shortlist, not the whole noisy market.',
  },
  {
    icon: Bell,
    overline: 'Step 3 · Get alerted',
    title: 'Know before yields turn',
    body: 'Set plain-language alerts — APY rises or drops, TVL drains, rewards spike — delivered by email or Telegram. Set it once, stay ahead.',
  },
]

export function Onboarding() {
  // Render nothing until mounted so the server HTML and first client render
  // match; the localStorage / matchMedia reads only happen on the client.
  const [mount, setMount] = useState<{ visible: boolean; reducedMotion: boolean }>({ visible: false, reducedMotion: false })
  const [step, setStep] = useState(0)
  const { visible, reducedMotion } = mount

  useEffect(() => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client-only read on mount, intentional to avoid hydration mismatch
    setMount({
      visible: window.localStorage.getItem(STORAGE_KEY) !== '1',
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    })
  }, [])

  useEffect(() => {
    if (!visible) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') dismiss()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [visible])

  function dismiss() {
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, '1')
    setMount((current) => ({ ...current, visible: false }))
  }

  function next() {
    if (step < steps.length - 1) setStep((s) => s + 1)
    else dismiss()
  }

  if (!visible) return null

  const current = steps[step]
  const Icon = current.icon
  const isLast = step === steps.length - 1

  return (
    <div className="qy-modal-overlay" role="presentation" onClick={dismiss}>
      <div
        className="qy-modal qy-alert-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="qy-onboarding-title"
        onClick={(event) => event.stopPropagation()}
        style={{ maxWidth: 460, transition: reducedMotion ? 'none' : 'transform .2s ease' }}
      >
        <div className="qy-modal-header">
          <span className="qy-overline qy-overline-signal">Welcome to QuickYield</span>
          <button type="button" className="qy-icon-btn" onClick={dismiss} aria-label="Skip onboarding">
            <X size={16} />
          </button>
        </div>

        <div className="qy-modal-body qy-alert-dialog-body" style={{ alignItems: 'center', textAlign: 'center', gap: 16 }}>
          <span
            aria-hidden="true"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: 'rgba(47,136,255,0.12)',
              color: 'var(--signal)',
              border: '1px solid rgba(47,136,255,0.3)',
            }}
          >
            <Icon size={28} />
          </span>
          <span className="qy-overline qy-overline-signal">{current.overline}</span>
          <h2 id="qy-onboarding-title" style={{ margin: 0 }}>{current.title}</h2>
          <p className="qy-alert-preview" style={{ margin: 0 }}>{current.body}</p>

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }} aria-hidden="true">
            {steps.map((_, index) => (
              <span
                key={index}
                style={{
                  width: index === step ? 22 : 8,
                  height: 8,
                  borderRadius: 999,
                  backgroundColor: index === step ? 'var(--signal)' : 'rgba(255,255,255,0.18)',
                  transition: reducedMotion ? 'none' : 'all .2s ease',
                }}
              />
            ))}
          </div>

          <p className="qy-asset-meta" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0 0' }}>
            <ShieldCheck size={13} /> Research-only — QuickYield never touches your funds or wallet.
          </p>
        </div>

        <div className="qy-modal-footer">
          {step > 0 ? (
            <button type="button" className="qy-btn qy-btn-secondary" onClick={() => setStep((s) => s - 1)}>Back</button>
          ) : (
            <button type="button" className="qy-btn qy-btn-secondary" onClick={dismiss}>Skip</button>
          )}
          <button type="button" className="qy-btn qy-btn-primary" onClick={next}>
            {isLast ? 'Start exploring' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
