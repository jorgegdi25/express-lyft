import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import { Arrow, Eyebrow, Heading } from '@/components/site/ui'
import { FLEET } from '@/lib/site/fleet'
import { getStartingPrices } from '@/lib/site/data'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Our Fleet: Sedans, Suburbans, Sprinters & Coach Buses | Express Lyft',
  description: 'Compare the Express Lyft fleet: Sedan & SUV, Chevrolet Suburban, Mercedes-Benz Sprinter, Mini Bus and Coach Bus. Passengers, luggage and starting prices.',
  alternates: { canonical: '/fleet' },
}

export default async function FleetPage() {
  const prices = await getStartingPrices()
  return (
    <PageShell
      breadcrumb={[{ label: 'Fleet' }]}
      eyebrow="Our fleet"
      title="The right vehicle for every trip."
      intro="Five vehicle classes, from a private ride for two to a 55-passenger coach. Every class shows its passenger and luggage capacity, so you know it fits."
      image="/site/fleet-coaches-real.webp"
      imageAlt="Express Lyft coach buses parked at the Miami yard"
    >
      <Section tone="sand">
        <ul className="flex flex-col gap-6">
          {FLEET.map((v, i) => (
            <li key={v.type} id={v.slug} className="grid lg:grid-cols-12 rounded-3xl overflow-hidden scroll-mt-28" style={{ background: 'var(--surface-raised)', border: '1px solid var(--sand-line)' }}>
              <div className={`relative lg:col-span-7 aspect-[16/10] lg:aspect-auto lg:min-h-[380px] ${i % 2 ? 'lg:order-2' : ''}`}>
                <Image src={v.image} alt={`${v.name} — Express Lyft`} fill sizes="(min-width:1024px) 58vw, 100vw" className="object-cover" />
              </div>
              <div className="lg:col-span-5 p-6 md:p-10 flex flex-col">
                <Eyebrow tone="light">{v.category}</Eyebrow>
                <Heading as="h2" tone="light" className="text-3xl md:text-4xl">{v.name}</Heading>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--ink-dark-muted)' }}>{v.description}</p>
                <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
                  <div><dt style={{ color: 'var(--ink-dark-muted)' }}>Passengers</dt><dd className="text-lg font-semibold" style={{ color: 'var(--ink-dark)' }}>Up to {v.passengers}</dd></div>
                  <div><dt style={{ color: 'var(--ink-dark-muted)' }}>Luggage</dt><dd className="text-lg font-semibold" style={{ color: 'var(--ink-dark)' }}>{v.luggage} bags</dd></div>
                  <div><dt style={{ color: 'var(--ink-dark-muted)' }}>{v.quoteOnly ? 'Rate' : 'From'}</dt><dd className="text-lg font-semibold" style={{ color: 'var(--ink-dark)' }}>{v.quoteOnly || !prices[v.type] ? 'Quote' : `$${prices[v.type]}`}</dd></div>
                </dl>
                <p className="mt-5 text-sm" style={{ color: 'var(--ink-dark-muted)' }}><strong style={{ color: 'var(--ink-dark)' }}>Best for:</strong> {v.bestFor}</p>
                <Link
                  href={`/book?vehicle=${v.type}`}
                  className="mt-auto pt-8 self-start inline-flex items-center gap-2 text-[14px] font-semibold"
                  style={{ color: 'var(--gold-light)' }}
                >
                  {v.quoteOnly ? 'Request a quote' : 'Book this vehicle'} <Arrow />
                </Link>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs" style={{ color: 'var(--ink-dark-muted)' }}>Starting rates. Final price depends on route, time and availability.</p>
      </Section>
    </PageShell>
  )
}
