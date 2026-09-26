import { Montserrat } from 'next/font/google'

// Brand typeface from the Express Lyft brand guidelines (Montserrat Medium
// for text, SemiBold in the logo). Self-hosted by next/font — no render-
// blocking @import.
export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-brand',
  display: 'swap',
})

export const SITE_CLASS = `${montserrat.variable} site-v2`
