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
      className={`ql-nav ${scrolled ? 'ql-nav--scrolled' : ''}`}
      data-testid="marketing-nav"
    >
      <div className="ql-nav-inner">
        <BrandLogo href="/" className="ql-logo-nav" />
        <div className="ql-nav-links">
          <a href="/#how" className="ql-nav-link">How it works</a>
          <Link href="/docs" className="ql-nav-link">Methodology</Link>
          <Link href="/proof" className="ql-nav-link">Track record</Link>
          <Link href="/yields" className="ql-nav-link">Yields</Link>
        </div>
        <div className="ql-nav-actions">
          <Link href="/sign-in" className="ql-nav-signin" data-testid="nav-signin">Sign in</Link>
          <Link href="/sign-up" className="ql-btn ql-btn--primary ql-btn--sm" data-testid="nav-getstarted">Get started</Link>
        </div>
      </div>
    </nav>
  )
}
