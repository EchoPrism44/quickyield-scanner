'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function FAQ() {
  const [open, setOpen] = useState<number | null>(0)

  const faqs = [
    {
      q: 'How often are pools scanned?',
      a: 'QuickYield continuously monitors 500+ pools across major chains, updating metrics every 2 minutes. Real-time alerts trigger instantly when your conditions are met.',
    },
    {
      q: 'What makes your safety grades different?',
      a: 'Our grading combines 15+ risk factors including smart contract analysis, liquidity metrics, token emission schedules, and team track records. Each grade (A-F) is transparent and explainable.',
    },
    {
      q: 'Can I use alerts on mobile?',
      a: 'Yes. Alerts are delivered via Telegram and email, so you can receive them anywhere. Our dashboard is also fully responsive.',
    },
    {
      q: 'Is there a free tier?',
      a: 'QuickYield is completely free during beta. Full feature access—no paywalls, no rate limits. When we launch paid tiers, current beta users get grandfathered pricing.',
    },
    {
      q: 'Which chains are supported?',
      a: 'Currently Ethereum, Arbitrum, Optimism, Polygon, Base, Blast, and Linea. We add new chains monthly based on user requests.',
    },
    {
      q: 'How do I export my data?',
      a: 'API access is available. You can fetch opportunities, alerts, and grades programmatically to build custom dashboards or integrate with your own tools.',
    },
  ]

  return (
    <section className="ql-section">
      <div className="ql-wrap" style={{ maxWidth: '640px' }}>
        <div className="ql-head">
          <span className="ql-eyebrow">Questions?</span>
          <h2 className="ql-h2">Frequently asked.</h2>
        </div>

        <div className="ql-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className={`ql-faq-item ${open === i ? 'ql-faq-open' : ''}`}>
              <button
                className="ql-faq-trigger"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span>{faq.q}</span>
                <ChevronDown size={20} className="ql-faq-arrow" />
              </button>

              {open === i && (
                <div className="ql-faq-content">
                  <p className="ql-faq-answer">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
