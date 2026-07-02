import { Star } from 'lucide-react'

export function Testimonials() {
  const testimonials = [
    {
      name: 'Alex Chen',
      title: 'DeFi Strategist',
      quote: 'QuickYield saved me hours every week. The safety grades are reliable and alerts actually matter.',
      rating: 5,
      avatar: 'AC',
    },
    {
      name: 'Jordan Patel',
      title: 'Yield Farmer',
      quote: 'Finally found a tool that doesn\'t overwhelm with noise. The real-time scanning gives me edge.',
      rating: 5,
      avatar: 'JP',
    },
    {
      name: 'Taylor Kim',
      title: 'Portfolio Manager',
      quote: 'Risk assessment is thorough. We integrated it into our allocation process immediately.',
      rating: 5,
      avatar: 'TK',
    },
  ]

  return (
    <section className="ql-section">
      <div className="ql-wrap">
        <div className="ql-head">
          <span className="ql-eyebrow">Trusted by yield hunters</span>
          <h2 className="ql-h2">Used by DeFi's sharpest minds.</h2>
        </div>

        <div className="ql-testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={i} className="ql-testimonial">
              <div className="ql-testimonial-stars">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={16} fill="var(--signal)" color="var(--signal)" />
                ))}
              </div>

              <blockquote className="ql-testimonial-quote">"{t.quote}"</blockquote>

              <div className="ql-testimonial-author">
                <div className="ql-testimonial-avatar">{t.avatar}</div>
                <div className="ql-testimonial-info">
                  <h5>{t.name}</h5>
                  <p>{t.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
