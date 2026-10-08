import type { Metadata } from 'next'
import './globals.css'
import { BRAND } from '@/lib/site/contact'

export const metadata: Metadata = {
  metadataBase: new URL(BRAND.url),
  title: 'Express Lyft — Luxury Transportation',
  description: 'Premium transportation for Miami and Orlando\'s most discerning hotel guests. Book your private car, SUV, or coach bus today.',
  keywords: 'luxury transportation, Miami car service, Orlando black car, airport transfer, private chauffeur, coach bus rental',
  openGraph: {
    title: 'Express Lyft — Luxury Transportation',
    description: 'Premium transportation for Miami and Orlando\'s most discerning hotel guests.',
    url: BRAND.url,
    images: [{ url: '/site/fleet-studio-hero.jpg', width: 1536, height: 1024, alt: 'Express Lyft vehicle classes' }],
    siteName: 'Express Lyft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/site/fleet-studio-hero.jpg'],
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
