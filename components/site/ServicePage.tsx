import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import PageShell, { Section } from './PageShell'
import TripStarter from './TripStarter'
import FaqList from './FaqList'
import ReviewsGrid from './ReviewsGrid'
import { Arrow, ButtonLink, Eyebrow, Heading } from './ui'
import { serviceBySlug, SERVICES } from '@/lib/site/services'
import { FLEET } from '@/lib/site/fleet'
import { faqByIds } from '@/lib/site/faq'
import { BRAND, CONTACT } from '@/lib/site/contact'
import { getStartingPrices } from '@/lib/site/data'
import { getApprovedReviews, toTestimonials } from '@/lib/reviews'

export function serviceMetadata(slug: string): Metadata {
  const s = serviceBySlug(slug)!
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: { canonical: `/${s.slug}` },
    openGraph: { title: s.metaTitle, description: s.metaDescription, url: `${BRAND.url}/${s.slug}`, images: [s.image] },
  }
}

// Landing template for every service: hero + booking → use cases → how we
// handle it → vehicles → places → reviews → FAQ → book.
export default async function ServicePage({ slug }: { slug: string }) {
  const s = serviceBySlug(slug)!
  const [prices, reviewRows] = await Promise.all([getStartingPrices(), getApprovedReviews(undefined, 9)])
  const vehicles = FLEET.filter((v) => s.vehicles.includes(v.type))
  const faqs = faqByIds(s.faqIds)
  const others = SERVICES.filter((o) => o.slug !== s.slug)

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    serviceType: s.name,
    description: s.metaDescription,
    areaServed: s.places.map((p) => ({ '@type': 'Place', name: p })),
    provider: { '@type': 'LocalBusiness', name: BRAND.name, telephone: CONTACT.phoneDisplay, url: BRAND.url },
  }

  return (
    <PageShell
      breadcrumb={[{ label: 'Services', href: '/services' }, { label: s.name }]}
      eyebrow={s.name}
      title={s.heroTitle}
      intro={s.heroCopy}
      image={s.image}
      imageAlt={s.imageAlt}
      heroAside={<TripStarter variant="card" service={s.slug} />}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />

      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Eyebrow>When you need it</Eyebrow>
            <Heading className="text-3xl md:text-4xl">Made for these moments.</Heading>
          </div>
          <ul className="lg:col-span-8 grid md:grid-cols-3 gap-4">
            {s.useCases.map((u) => (
              <li key={u.title} className="rounded-2xl p-6" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
                <h3 className="text-lg font-semibold text-white">{u.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{u.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="deep">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 relative aspect-[4/5] rounded-2xl overflow-hidden hidden lg:block">
            <Image src="/gallery/interna.webp" alt="Inside an Express Lyft vehicle" fill sizes="40vw" className="object-cover" />
          </div>
          <div className="lg:col-span-7">
            <Eyebrow>How Express Lyft handles it</Eyebrow>
            <Heading className="text-3xl md:text-4xl">The details, taken care of.</Heading>
            <ol className="mt-8 flex flex-col gap-7">
              {s.howWeHandle.map((h, i) => (
                <li key={h.title} className="flex gap-5">
                  <span className="font-display text-3xl font-semibold shrink-0 w-10" style={{ color: 'var(--gold)' }}>{i + 1}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{h.title}</h3>
                    <p className="mt-1.5 text-[15px] leading-relaxed" style={{ color: 'var(--text-subtle)' }}>{h.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      <Section tone="sand">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <Eyebrow tone="light">Vehicle options</Eyebrow>
            <Heading tone="light" className="text-3xl md:text-4xl">Choose the right size.</Heading>
          </div>
          <Link href="/fleet" className="inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--ink-dark)' }}>Full fleet <Arrow /></Link>
        </div>
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {vehicles.map((v) => (
            <li key={v.type} className="min-w-0 rounded-2xl overflow-hidden flex flex-col" style={{ background: 'var(--sand)', border: '1px solid var(--sand-line)' }}>
              <div className="relative aspect-[3/2] bg-[#ededeb]"><Image src={v.catalogImage} alt={v.catalogImageAlt} fill sizes="(min-width:1280px) 240px, (min-width:1024px) 33vw, (min-width:640px) 50vw, 100vw" className="object-contain" /></div>
              <div className="p-5 flex flex-col flex-1">
                <h3 className="font-display text-xl font-semibold" style={{ color: 'var(--ink-dark)' }}>{v.name}</h3>
                <p className="mt-1 text-sm" style={{ color: 'var(--ink-dark-muted)' }}>Up to {v.passengers} passengers · {v.luggage} bags</p>
                <p className="mt-4 text-sm font-semibold" style={{ color: 'var(--ink-dark)' }}>
                  {v.quoteOnly || !prices[v.type] ? 'Custom quote' : `From $${prices[v.type]}`}
                </p>
                <Link href={`/book?vehicle=${v.type}&service=${s.slug}`} className="mt-auto pt-4 inline-flex items-center gap-2 text-[14px] font-semibold hover:underline" style={{ color: 'var(--ink-dark)' }}>
                  {v.quoteOnly ? 'Request a quote' : 'Book this vehicle'} <Arrow />
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs" style={{ color: 'var(--ink-dark-muted)' }}>Vehicle images are illustrative. Final vehicle assignment depends on availability.</p>
      </Section>

      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Eyebrow>Where we go</Eyebrow>
            <Heading className="text-3xl md:text-4xl">Serving South Florida.</Heading>
            <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Not seeing your location? Enter any address in the booking form or <a href={CONTACT.phoneHref} className="underline hover:text-white">call us</a>.</p>
          </div>
          <ul className="lg:col-span-8 flex flex-wrap gap-3 content-start">
            {s.places.map((p) => (
              <li key={p} className="px-4 py-2.5 rounded-full text-sm text-white" style={{ border: '1px solid var(--border-soft)' }}>{p}</li>
            ))}
          </ul>
        </div>
      </Section>

      {reviewRows.length > 0 && (
        <Section tone="deep">
          <Eyebrow>Passenger reviews</Eyebrow>
          <Heading className="text-3xl md:text-4xl mb-8">What passengers say.</Heading>
          <ReviewsGrid reviews={toTestimonials(reviewRows)} />
        </Section>
      )}

      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Eyebrow>FAQ</Eyebrow>
            <Heading className="text-3xl md:text-4xl">{s.name} questions.</Heading>
          </div>
          <div className="lg:col-span-8"><FaqList items={faqs} /></div>
        </div>
      </Section>

      <Section tone="deep">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Heading className="text-3xl md:text-4xl max-w-xl">Ready to book your {s.name.toLowerCase()}?</Heading>
          <div className="flex flex-col sm:flex-row gap-3">
            <ButtonLink href={`/book?service=${s.slug}`} size="lg">Book a ride <Arrow /></ButtonLink>
            <ButtonLink href={CONTACT.phoneHref} variant="outline" size="lg">Call {CONTACT.phoneDisplay}</ButtonLink>
          </div>
        </div>
        <div className="mt-12 pt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ borderTop: '1px solid var(--surface)', color: 'var(--text-muted)' }}>
          <span className="text-white/60">Other services:</span>
          {others.map((o) => <Link key={o.slug} href={`/${o.slug}`} className="hover:text-white">{o.name}</Link>)}
        </div>
      </Section>
    </PageShell>
  )
}
