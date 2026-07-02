import { Shield, Droplets, TrendingUp, AlertCircle } from 'lucide-react'

export function RiskMetrics() {
  const metrics = [
    {
      title: 'Smart Contract Risk',
      icon: Shield,
      description: 'Analyzed for known vulnerabilities, audit status, and code complexity.',
      gauge: 85,
      detail: '15+ risk factors',
    },
    {
      title: 'Liquidity Risk',
      icon: Droplets,
      description: 'TVL trends, withdrawal limits, and concentration risk evaluated.',
      gauge: 72,
      detail: '8 liquidity signals',
    },
    {
      title: 'APY Sustainability',
      icon: TrendingUp,
      description: 'Reward tokenomics and emission schedules analyzed for viability.',
      gauge: 68,
      detail: '6-month trends',
    },
    {
      title: 'Counterparty Risk',
      icon: AlertCircle,
      description: 'Team history, backing, and market conditions assessed.',
      gauge: 78,
      detail: 'Continuous monitoring',
    },
  ]

  return (
    <section className="ql-section">
      <div className="ql-wrap">
        <div className="ql-head">
          <span className="ql-eyebrow">Risk Intelligence</span>
          <h2 className="ql-h2">Comprehensive risk assessment built-in.</h2>
          <p className="ql-lead">
            Every pool is evaluated across multiple risk dimensions. Our grading system combines on-chain data with off-chain intelligence.
          </p>
        </div>

        <div className="ql-risk-cards-grid">
          {metrics.map((m, i) => {
            const Icon = m.icon
            return (
              <div key={i} className="ql-risk-card">
                <Icon size={24} style={{ marginBottom: '12px' }} />
                <h4>{m.title}</h4>
                <p>{m.description}</p>
                <div className="ql-gauge" style={{ marginBottom: '12px' }}>
                  <div className="ql-gauge-fill" style={{ width: `${m.gauge}%` }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ink-mute)', fontFamily: 'var(--font-mono)' }}>
                  {m.detail}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
