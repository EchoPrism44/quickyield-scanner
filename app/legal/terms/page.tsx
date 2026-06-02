import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — QuickYield',
  description: 'The terms governing your use of QuickYield, an informational DeFi yield research and alerting product.',
}

export default function TermsPage() {
  return (
    <>
      <h1>Terms of Service</h1>
      <div className="ql-legal-meta">Last updated · 1 June 2026</div>

      <div className="ql-legal-note">
        This is a plain-language template provided for transparency during our beta. It is not legal advice and
        should be reviewed by qualified counsel before relying on it for a production launch.
      </div>

      <h2>1. What QuickYield is</h2>
      <p>
        QuickYield (&ldquo;QuickYield&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is an informational research and
        alerting service for decentralized finance (DeFi) yield opportunities. We aggregate publicly available data,
        apply our own scoring, and let you create rules that trigger notifications. We do not provide financial,
        investment, tax, or legal advice.
      </p>

      <h2>2. No custody and no execution</h2>
      <p>
        QuickYield never takes custody of your funds, private keys, or wallets. We do not execute transactions, move
        assets, or act as a broker, exchange, or adviser. Any action you take on a third-party protocol is solely your
        own decision and responsibility.
      </p>

      <h2>3. Eligibility and acceptable use</h2>
      <p>You agree to use QuickYield only where lawful for you to do so, and not to:</p>
      <ul>
        <li>Scrape, overload, or attempt to disrupt the service or its data sources.</li>
        <li>Misrepresent the service&apos;s output as financial advice to others.</li>
        <li>Use the service to violate the terms of any third-party protocol or applicable law.</li>
      </ul>

      <h2>4. Data accuracy</h2>
      <p>
        Yield data is sourced from third parties (including public DeFiLlama feeds) and may be delayed, incomplete, or
        incorrect. Safety Grades and scores are heuristic estimates, not guarantees. You must independently verify any
        opportunity with the underlying protocol before acting.
      </p>

      <h2>5. Disclaimers and limitation of liability</h2>
      <p>
        The service is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum extent permitted by
        law, QuickYield is not liable for any losses arising from your use of the service or from decisions you make
        based on its information. DeFi carries significant risk, including total loss of capital.
      </p>

      <h2>6. Changes</h2>
      <p>
        We may update these terms as the product evolves. Material changes will be reflected by the &ldquo;last
        updated&rdquo; date above. Continued use after changes constitutes acceptance.
      </p>

      <h2>7. Contact</h2>
      <p>Questions about these terms can be sent to the address listed on our site once published.</p>
    </>
  )
}
