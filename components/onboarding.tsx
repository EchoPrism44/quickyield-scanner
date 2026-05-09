'use client'

import { useState } from 'react'
import { ShieldCheck, Eye, Bell, ArrowRight } from 'lucide-react'

const steps = [
  {
    icon: ShieldCheck,
    title: 'Here is your first opportunity',
    body: 'Aave USDC on Base is a beginner-safe lending pool. It is the most stable starting point in DeFi.',
    highlight: 'Low risk · $146M TVL · No lockup',
  },
  {
    icon: Eye,
    title: 'Add it to your watchlist',
    body: 'Click "+ Watch" on any pool to track it. Your watchlist shows current APY and TVL at a glance.',
    highlight: 'You can remove pools anytime',
  },
  {
    icon: Bell,
    title: 'Set your first alert',
    body: 'Set a threshold — "Email me if APY drops below 6%". You will get notified instantly.',
    highlight: 'Email alerts arrive in seconds',
  },
]

export function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const s = steps[step]

  return (
    <div className="qy-onboard-overlay">
      <div className="qy-onboard-card">
        <div className="qy-onboard-steps">
          {steps.map((_, i) => (
            <div key={i} className={`qy-onboard-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>
        <s.icon className="qy-onboard-icon" size={32} />
        <h2>{s.title}</h2>
        <p>{s.body}</p>
        <div className="qy-onboard-highlight">{s.highlight}</div>
        <div className="qy-onboard-actions">
          {step < steps.length - 1 ? (
            <button className="qy-btn qy-btn-primary" onClick={() => setStep(step + 1)}>
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button className="qy-btn qy-btn-primary qy-btn-glow" onClick={onComplete}>
              Start scanning
            </button>
          )}
          <button className="qy-btn qy-btn-secondary" onClick={onComplete}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
