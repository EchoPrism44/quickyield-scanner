'use client'

import { useEffect, useState } from 'react'
import { BrandLogo } from './brand-logo'

const logs = [
  'Loading yield scanner',
  'Checking 500+ pools',
  'Preparing Telegram and email alerts',
  'Research-only mode enabled',
]

export function AppIntro() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.sessionStorage.getItem('qy-intro-seen') !== '1'
  })
  const [logIndex, setLogIndex] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!visible) return
    const key = 'qy-intro-seen'

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reducedMotion ? 700 : 3200
    const logTimer = window.setInterval(() => {
      setLogIndex((current) => Math.min(current + 1, logs.length - 1))
    }, reducedMotion ? 120 : 620)
    const closeTimer = window.setTimeout(() => {
      window.sessionStorage.setItem(key, '1')
      setVisible(false)
    }, duration)

    return () => {
      window.clearInterval(logTimer)
      window.clearTimeout(closeTimer)
    }
  }, [visible])

  function skip() {
    if (typeof window !== 'undefined') window.sessionStorage.setItem('qy-intro-seen', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="qy-intro" role="status" aria-live="polite" aria-label="QuickYield app loading">
      <button type="button" className="qy-intro-skip" onClick={skip}>
        Skip
      </button>
      <div className="qy-intro-orbit" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="qy-intro-panel">
        <BrandLogo className="qy-logo-intro qy-logo-animated" />
        <div className="qy-intro-progress" aria-hidden="true">
          <span />
        </div>
        <div className="qy-intro-logs">
          {logs.map((log, index) => (
            <span key={log} className={index <= logIndex ? 'active' : ''}>
              {log}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
