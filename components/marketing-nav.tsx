'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { BrandLogo } from './brand-logo'

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`qy-nav qy-nav-fade ${scrolled ? 'qy-glass' : ''}`}
      data-testid="marketing-nav"
    >
      <div className="qy-nav-inner">
        <BrandLogo href="/" className="qy-logo-nav" />
        <div className="qy-nav-links">
          <a href="#how" className="qy-nav-link">How it works</a>
          <a href="#features" className="qy-nav-link">Features</a>
          <Link href="/sign-in" className="qy-nav-link">Dashboard</Link>
        </div>
        <div className="qy-nav-actions">
          <Link href="/sign-in" className="qy-nav-signin" data-testid="nav-signin">Sign in</Link>
          <Link href="/sign-up" className="qy-btn qy-btn-ink" data-testid="nav-getstarted">Get started</Link>
        </div>
      </div>
    </nav>
  )
}
