import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { BRAND } from '@/lib/site/contact'

export default function robots(): MetadataRoute.Robots {
  const host = headers().get('host') || ''
  // The test site must never be indexed.
  if (host.includes('pruebas') || host.includes('vercel.app') || host.startsWith('localhost')) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/guia', '/map-demo', '/review/', '/promo/'] }],
    sitemap: `${BRAND.url}/sitemap.xml`,
  }
}
