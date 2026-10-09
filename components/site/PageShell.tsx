import { SITE_CLASS } from '@/lib/site/fonts'
import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import SiteHeader, { MobileActionBar } from './SiteHeader'
import SiteFooter from './SiteFooter'
import { Container } from './ui'
import { BRAND, SITE_HOME } from '@/lib/site/contact'

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
  const crumbs = [{ label: 'Home', href: SITE_HOME }, ...breadcrumb]
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
      <SiteHeader />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <section className="relative overflow-hidden py-10 md:py-16" style={{ background: 'var(--bg-deep)' }}>
        <Container className="relative w-full">
          <nav aria-label="Breadcrumb" className="mb-6 text-xs text-[var(--text-muted)]">
            <ol className="flex flex-wrap items-center gap-2">
              {crumbs.map((c, i) => (
                <li key={c.label} className="flex items-center gap-2">
                  {c.href && i < crumbs.length - 1 ? <Link href={c.href} className="hover:text-[var(--text)]">{c.label}</Link> : <span className="text-[var(--text)]">{c.label}</span>}
                  {i < crumbs.length - 1 && <span aria-hidden>/</span>}
                </li>
              ))}
            </ol>
          </nav>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="min-w-0 lg:col-span-7">
              <p className="text-[11px] font-medium uppercase tracking-[0.32em] mb-4" style={{ color: 'var(--gold-light)' }}>{eyebrow}</p>
              <h1 className="font-display font-semibold text-[var(--text)] text-4xl md:text-6xl leading-[1.05] tracking-[-0.01em]">{title}</h1>
              {intro && <p className="mt-5 text-base md:text-lg text-[var(--text-muted)] max-w-xl leading-relaxed">{intro}</p>}
              {image && heroAside && (
                <div className="relative mt-7 aspect-[16/10] overflow-hidden rounded-2xl">
                  <Image src={image} alt={imageAlt} fill priority sizes="(min-width:1280px) 660px, (min-width:1024px) 58vw, calc(100vw - 32px)" className="object-cover" />
                </div>
              )}
            </div>
            {heroAside && <div className="min-w-0 lg:col-span-5">{heroAside}</div>}
            {image && !heroAside && (
              <div className="lg:col-span-5 relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image src={image} alt={imageAlt} fill priority sizes="(min-width:1280px) 490px, (min-width:1024px) 40vw, calc(100vw - 32px)" className="object-cover" />
              </div>
            )}
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
