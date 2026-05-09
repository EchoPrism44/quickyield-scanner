import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'QuickYield Intel - Crypto Yield Scanner',
  description:
    'QuickYield scans live and curated crypto yield signals with risk flags, APY context, fees, alerts, and beginner-safe disclosures.',
  openGraph: {
    title: 'QuickYield Intel',
    description:
      'Investigate crypto yield signals before you click. Live data, saved watchlists, alerts, and transparent risk context.',
    type: 'website',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}
