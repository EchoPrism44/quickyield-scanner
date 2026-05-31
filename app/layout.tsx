import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://quickyield.vercel.app')

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'QuickYield - DeFi Yield Radar',
  description:
    'QuickYield scans live DeFi yield pools with safety context, target rules, and Telegram alerts for non-custodial yield research.',
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'QuickYield - DeFi Yield Radar',
    description:
      'Scan DeFi yield pools, save targets, and get alerts when cleaner opportunities match your rules.',
    type: 'website',
    images: ['/brand/quickyield-wordmark.svg'],
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
