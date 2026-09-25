import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://www.explyft.com'),
  title: 'Express Lyft | Private Airport, Hotel & Cruise Transportation in Miami',
  description: 'Private transportation in Miami and South Florida: airport, hotel and cruise port transfers, corporate travel and group transportation. Book online with clear prices.',
  openGraph: {
    title: 'Express Lyft | Private Transportation in Miami & South Florida',
    description: 'Airport, hotel and cruise port transfers, corporate and group transportation. Book online with clear prices.',
    url: 'https://www.explyft.com',
    siteName: 'Express Lyft',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Express Lyft | Private Transportation in Miami & South Florida',
    description: 'Airport, hotel and cruise port transfers, corporate and group transportation.',
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
