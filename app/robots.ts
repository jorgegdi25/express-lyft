import type { MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { BRAND, SITE_V2_LIVE } from '@/lib/site/contact'
import { SERVICES } from '@/lib/site/services'

const PREVIEW_PATHS = ['/home', '/book', '/services', '/fleet', '/partners', '/about', '/faq', '/contact', '/miami', '/orlando', ...SERVICES.map((s) => `/${s.slug}`)]

export default function robots(): MetadataRoute.Robots {
  const host = headers().get('host') || ''
  // The test site must never be indexed.
  if (host.includes('pruebas') || host.includes('vercel.app') || /^(localhost|127\.0\.0\.1|\[::1\])(?::|$)/.test(host)) {
    return { rules: [{ userAgent: '*', disallow: '/' }] }
  }
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin', '/api/', '/guia', '/map-demo', '/review/', '/promo/',
        // Express Lyft 2.0 preview pages stay out of search until launch.
        ...(SITE_V2_LIVE ? [] : PREVIEW_PATHS),
      ],
    }],
    sitemap: `${BRAND.url}/sitemap.xml`,
  }
}
