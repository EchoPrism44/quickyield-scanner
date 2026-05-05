import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";

const Logo = ({ className = "" }) => (
  <div className={`flex items-center gap-2 ${className}`} data-testid="qy-logo">
    <div className="relative h-7 w-7">
      <div className="absolute inset-0 rounded-md bg-signal" />
      <div className="absolute inset-[3px] rounded-[3px] bg-bg-page" />
      <div className="absolute inset-[6px] rounded-[2px] bg-signal" />
    </div>
    <span className="font-display text-[17px] font-medium tracking-tight text-ink">
      QuickYield
    </span>
  </div>
);

export default function MarketingNav({ onAuth }) {
  const location = useLocation();
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-line glass"
      data-testid="marketing-nav"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/">
          <Logo />
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#how" className="text-sm text-ink-dim hover:text-ink transition-colors" data-testid="nav-how">How it works</a>
          <a href="#features" className="text-sm text-ink-dim hover:text-ink transition-colors" data-testid="nav-features">Features</a>
          <a href="#pricing" className="text-sm text-ink-dim hover:text-ink transition-colors" data-testid="nav-pricing">Pricing</a>
          <a href="#faq" className="text-sm text-ink-dim hover:text-ink transition-colors" data-testid="nav-faq">FAQ</a>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onAuth("login")}
            className="hidden text-sm text-ink-dim hover:text-ink transition-colors md:block"
            data-testid="nav-login-btn"
          >
            Sign in
          </button>
          <button
            onClick={() => onAuth("register")}
            className="rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-bg-page hover:bg-white transition-all"
            data-testid="nav-getstarted-btn"
          >
            Get started
          </button>
        </div>
      </div>
    </motion.nav>
  );
}
