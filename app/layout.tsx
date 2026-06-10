import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Express Lyft — Luxury Transportation',
  description: 'Premium transportation for Miami\'s most discerning hotel guests.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#111111' }}>{children}</body>
    </html>
  )
}
