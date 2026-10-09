import Link from 'next/link'
import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import TripStarter from '@/components/site/TripStarter'
import RouteMap from '@/components/site/RouteMap'
import Reveal from '@/components/site/Reveal'
import { Arrow, Eyebrow, Heading } from '@/components/site/ui'
import { POPULAR_ROUTES } from '@/components/site/home/sections'
import { SERVICES } from '@/lib/site/services'
import { BRAND, CONTACT, OFFICES } from '@/lib/site/contact'

export const metadata: Metadata = {
  title: 'Private Transportation in Miami & South Florida | Express Lyft',
  description: 'Miami-based private transportation: MIA and FLL airport transfers, PortMiami cruise transfers, Miami Beach and Brickell hotel transfers, corporate and group transportation.',
  alternates: { canonical: '/miami' },
}

const AREAS = [
  { t: 'Miami International Airport (MIA)', d: 'Arrivals and departures from every terminal, curbside or Meet & Greet.' },
  { t: 'Fort Lauderdale (FLL)', d: 'Airport transfers between FLL, Miami and Fort Lauderdale hotels.' },
  { t: 'PortMiami', d: 'Cruise terminal transfers for couples, families and large groups.' },
  { t: 'Miami Beach', d: 'South Beach, Mid-Beach and North Beach hotels and residences.' },
  { t: 'Downtown & Brickell', d: 'Business district, hotels, restaurants and events.' },
  { t: 'Across South Florida', d: 'Any address — enter it in the booking form to see your price.' },
]

export default function MiamiPage() {
  const miami = OFFICES.find((o) => o.city === 'Miami')!
  const localLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `${BRAND.name} — Miami`,
    url: `${BRAND.url}/miami`,
    telephone: CONTACT.phoneDisplay,
    email: CONTACT.email,
    address: { '@type': 'PostalAddress', streetAddress: miami.street, addressLocality: miami.locality, addressRegion: miami.region, postalCode: miami.postalCode, addressCountry: 'US' },
    areaServed: AREAS.map((a) => a.t),
    openingHours: 'Mo-Su 08:00-22:00',
  }

  return (
    <PageShell
      breadcrumb={[{ label: 'Locations' }, { label: 'Miami' }]}
      eyebrow="Miami & South Florida"
      title="Private transportation, based in Miami."
      intro="Our home market. We know the terminals, the cruise piers and the hotels — and how long it really takes to get between them."
      image="/gallery/miami.webp"
      imageAlt="Express Lyft vehicle with the Miami skyline at sunset"
      heroAside={<TripStarter variant="card" />}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localLd) }} />
      <Section>
        <Eyebrow>Where we operate</Eyebrow>
        <Heading className="text-3xl md:text-4xl">Miami, covered.</Heading>
        <ul className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {AREAS.map((a) => (
            <li key={a.t} className="rounded-2xl p-6" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
              <h3 className="text-lg font-semibold text-[var(--text)]">{a.t}</h3>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>{a.d}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="deep">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6"><Reveal><RouteMap /></Reveal></div>
          <div className="lg:col-span-6">
            <Eyebrow>Popular routes</Eyebrow>
            <Heading className="text-3xl md:text-4xl">See the price for your route.</Heading>
            <ul className="mt-8" style={{ borderTop: '1px solid var(--border)' }}>
              {POPULAR_ROUTES.map((r) => (
                <li key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Link href={`/book?pickup=${encodeURIComponent(r.pickup)}&dropoff=${encodeURIComponent(r.dropoff)}`} className="flex items-center justify-between py-4 text-[var(--text)] hover:text-[var(--gold-light)]">
                    <span>{r.from} → {r.to}</span><Arrow />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section>
        <Eyebrow>Services in Miami</Eyebrow>
        <ul className="mt-4 flex flex-wrap gap-3">
          {SERVICES.map((s) => (
            <li key={s.slug}><Link href={`/${s.slug}`} className="inline-block px-4 py-2.5 rounded-full text-sm text-[var(--text)] hover:border-[var(--gold)]" style={{ border: '1px solid var(--border-soft)' }}>{s.name}</Link></li>
          ))}
        </ul>
        <p className="mt-10 text-sm" style={{ color: 'var(--text-muted)' }}>
          Miami office: {miami.street}, {miami.locality}, {miami.region} {miami.postalCode} · <a href={CONTACT.phoneHref} className="text-[var(--text)]">{CONTACT.phoneDisplay}</a>
        </p>
      </Section>
    </PageShell>
  )
}
