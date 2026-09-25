import type { MetadataRoute } from 'next'
import { BRAND } from '@/lib/site/contact'
import { SERVICES } from '@/lib/site/services'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const pages: { path: string; priority: number }[] = [
    { path: '', priority: 1 },
    { path: '/book', priority: 0.9 },
    { path: '/services', priority: 0.8 },
    ...SERVICES.map((s) => ({ path: `/${s.slug}`, priority: 0.8 })),
    { path: '/fleet', priority: 0.7 },
    { path: '/miami', priority: 0.7 },
    { path: '/partners', priority: 0.6 },
    { path: '/about', priority: 0.5 },
    { path: '/faq', priority: 0.5 },
    { path: '/contact', priority: 0.5 },
    { path: '/orlando', priority: 0.3 },
  ]
  return pages.map((p) => ({ url: `${BRAND.url}${p.path}`, lastModified: now, priority: p.priority }))
}
