import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Risk Disclaimer — Litmus',
  description: 'Litmus is research and alerting only. Not financial advice. DeFi carries significant risk.',
}

export default function DisclaimerPage() {
  return (
    <>
      <h1>Risk Disclaimer</h1>
      <div className="ql-legal-meta">Last updated · 1 June 2026</div>

      <div className="ql-legal-note">
        Read this carefully. Litmus is an informational tool only. Nothing here is financial advice, and DeFi can
        result in the total loss of your funds.
      </div>

      <h2>Not financial advice</h2>
      <p>
        Litmus provides research context and alerts about publicly available DeFi yield opportunities. It does not
        recommend any specific pool, asset, protocol, or strategy, and nothing in the product should be construed as
        financial, investment, tax, or legal advice. We are not a licensed financial adviser, broker, or exchange.
      </p>

      <h2>Yields are variable and risky</h2>
      <p>
        Advertised APYs change constantly and are often driven by temporary incentives that can collapse. High yields
        frequently reflect high risk. Smart-contract bugs, exploits, depegs, liquidity withdrawal, and protocol
        failure can all lead to partial or total loss of capital.
      </p>

      <h2>Safety Grades are estimates</h2>
      <p>
        Our Safety Grade and scores are heuristic signals built from liquidity, APY stability, reward quality, and data
        completeness. They are not audits, not guarantees of safety, and not a substitute for your own due diligence.
      </p>

      <h2>Verify everything</h2>
      <p>
        Always confirm details directly with the underlying protocol before taking any action. External links open
        third-party sites we do not control. You are solely responsible for any decision you make.
      </p>

      <h2>Do your own research</h2>
      <p>
        Only commit capital you can afford to lose, and consider consulting a qualified professional about your
        individual circumstances.
      </p>
    </>
  )
}
