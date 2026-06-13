import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Express Lyft — Luxury Transportation',
  description: 'Premium transportation for Miami and Orlando\'s most discerning hotel guests. Book your private car, SUV, or coach bus today.',
  keywords: 'luxury transportation, Miami car service, Orlando black car, airport transfer, private chauffeur, coach bus rental',
  openGraph: {
    title: 'Express Lyft — Luxury Transportation',
    description: 'Premium transportation for Miami and Orlando\'s most discerning hotel guests.',
    url: 'https://bo.explyft.com',
    siteName: 'Express Lyft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Express Lyft — Luxury Transportation',
    description: 'Premium transportation for Miami and Orlando\'s most discerning hotel guests.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body style={{ margin: 0, background: '#111111' }} className="overflow-x-hidden">
        {children}
      </body>
    </html>
  )
}
