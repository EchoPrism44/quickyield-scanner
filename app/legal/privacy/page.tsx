import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — QuickYield',
  description: 'How QuickYield handles your data: account info, alert rules, and notification channels.',
}

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <div className="ql-legal-meta">Last updated · 1 June 2026</div>

      <div className="ql-legal-note">
        This is a plain-language template provided for transparency during our beta. It is not legal advice and should
        be reviewed by qualified counsel before a production launch.
      </div>

      <h2>1. What we collect</h2>
      <ul>
        <li><b>Account data:</b> your email address and authentication identifiers (via our auth provider).</li>
        <li><b>Product data:</b> your watchlist, alert rules, notification preferences, and sizing defaults.</li>
        <li><b>Notification channels:</b> your email and, if you connect it, your Telegram chat identifier.</li>
        <li><b>Usage data:</b> basic technical logs needed to operate and secure the service.</li>
      </ul>

      <h2>2. What we do not collect</h2>
      <p>
        We never ask for or store private keys, seed phrases, or custody of any assets. We do not require you to
        connect a wallet to use the core product.
      </p>

      <h2>3. How we use your data</h2>
      <p>
        We use your data to operate the scanner, evaluate your alert rules, deliver notifications you request, and
        improve the product. We do not sell your personal data.
      </p>

      <h2>4. Third parties</h2>
      <p>
        We rely on service providers for authentication, database hosting, email delivery, and Telegram messaging.
        Public market data is retrieved from third-party sources such as DeFiLlama. These providers process data only
        to provide their service to us.
      </p>

      <h2>5. Retention and your choices</h2>
      <p>
        You can delete your watchlist items, alert rules, and notification connections from within the app. You may
        request deletion of your account data via the contact channel listed on our site.
      </p>

      <h2>6. Security</h2>
      <p>
        We take reasonable measures to protect your data, but no method of transmission or storage is perfectly
        secure. Use the service with that understanding.
      </p>

      <h2>7. Changes</h2>
      <p>Updates will be reflected by the &ldquo;last updated&rdquo; date above.</p>
    </>
  )
}
