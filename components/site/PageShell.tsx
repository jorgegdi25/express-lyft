import { SITE_CLASS } from '@/lib/site/fonts'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import SiteHeader, { MobileActionBar } from './SiteHeader'
import SiteFooter from './SiteFooter'
import { Container } from './ui'
import { BRAND } from '@/lib/site/contact'

// Shared chrome for the corporate inner pages: header, breadcrumb,
// page hero, footer and the phone action bar.
export default function PageShell({
  children,
  breadcrumb,
  eyebrow,
  title,
  intro,
  image,
  imageAlt = '',
  heroAside,
}: {
  children: ReactNode
  breadcrumb: { label: string; href?: string }[]
  eyebrow: string
  title: string
  intro?: string
  image?: string
  imageAlt?: string
  heroAside?: ReactNode
}) {
  const crumbs = [{ label: 'Home', href: '/' }, ...breadcrumb]
  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${BRAND.url}${c.href === '/' ? '' : c.href}` } : {}),
    })),
  }

  return (
    <main className={SITE_CLASS} style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <SiteHeader overlay={Boolean(image)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className={`relative overflow-hidden ${image ? 'pt-32 md:pt-40 pb-14 md:pb-20 min-h-[62svh] flex items-end' : 'pt-12 md:pt-16 pb-12'}`} style={{ background: 'var(--bg-deep)' }}>
        {image && (
          <>
            <Image src={image} alt={imageAlt} fill priority sizes="100vw" className="object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,8,8,0.9) 0%, rgba(8,8,8,0.55) 55%, rgba(8,8,8,0.2) 100%)' }} />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(10,10,10,0.9) 0%, rgba(10,10,10,0) 50%)' }} />
          </>
        )}
        <Container className="relative w-full">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-white/55">
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.href && i < crumbs.length - 1 ? <Link href={c.href} className="hover:text-white">{c.label}</Link> : <span className="text-white/80">{c.label}</span>}
                  {i < crumbs.length - 1 && <span aria-hidden>/</span>}
                </li>
              ))}
            </ol>
          </nav>
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] mb-4" style={{ color: 'var(--gold-light)' }}>{eyebrow}</p>
              <h1 className="font-display font-semibold text-white text-4xl md:text-6xl leading-[1.05] tracking-[-0.01em]">{title}</h1>
              {intro && <p className="mt-5 text-base md:text-lg text-white/75 max-w-xl leading-relaxed">{intro}</p>}
            </div>
            {heroAside && <div className="lg:col-span-5">{heroAside}</div>}
          </div>
        </Container>
      </section>

      {children}
      <SiteFooter />
      <MobileActionBar />
    </main>
  )
}

export function Section({ children, tone = 'dark', className = '' }: { children: ReactNode; tone?: 'dark' | 'deep' | 'sand'; className?: string }) {
  const bg = tone === 'sand' ? 'var(--sand)' : tone === 'deep' ? 'var(--bg-deep)' : 'var(--bg)'
  return (
    <section className={`py-16 md:py-24 ${className}`} style={{ background: bg }}>
      <Container>{children}</Container>
    </section>
  )
}
