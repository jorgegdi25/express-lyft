import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import { Arrow, ButtonLink, Eyebrow, Heading } from '@/components/site/ui'
import Pending from '@/components/site/Pending'

export const metadata: Metadata = {
  title: 'About Express Lyft | Transportation & Hospitality Solutions',
  description: 'Express Lyft is a privately owned transportation and hospitality solutions provider serving travelers, hotels, airlines, cruise lines and businesses in South Florida.',
  alternates: { canonical: '/about' },
}

// Content from the Express Lyft portfolio (pages 2–5). Dates are left as
// pending: the portfolio says "since 2000", "founded in 1984" and "20+ years".
const APPROACH = [
  { t: 'Safety first', d: 'Passenger safety at every step.' },
  { t: 'Reliable service', d: 'On-time pickups and flight tracking.' },
  { t: 'Tailored solutions', d: 'Built around guest and partner needs.' },
  { t: 'Professional service', d: 'Experienced, courteous and comfortable.' },
  { t: 'Efficient operations', d: 'Smart scheduling for smooth journeys.' },
]

const EXPERTISE = ['Airlines', 'Cruise lines', 'Hotels', 'Corporate travel', 'Travel agencies']

export default function AboutPage() {
  return (
    <PageShell
      breadcrumb={[{ label: 'About' }]}
      eyebrow="About Express Lyft"
      title="Built on experience. Driven by travel."
      intro="A privately owned transportation and hospitality solutions provider for the travel industry — from a single airport pickup to moving airline crews and large groups."
      image="/gallery/miami.webp"
      imageAlt="Express Lyft vehicle in front of the Miami skyline at sunset"
    >
      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Eyebrow>Our story</Eyebrow>
            <Heading className="text-3xl md:text-4xl">Grown alongside the travel industry.</Heading>
            <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>Founding year: <Pending>1984 or 2000? portfolio shows both</Pending></p>
          </div>
          <div className="lg:col-span-7 flex flex-col gap-5 text-[16px] leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
            <p>
              Express Lyft has grown alongside the travel industry, building long-standing relationships with airlines, cruise lines, travel partners and hospitality businesses.
            </p>
            <p>
              Over the years our work expanded from travel and transportation support to accommodation, corporate travel, group movements and specialized travel requirements. With strong industry relationships, we help partners simplify logistics, manage costs and deliver dependable experiences for their travelers.
            </p>
            <p>Today, Express Lyft delivers professional transportation from our base in Miami, and is expanding to Orlando.</p>
          </div>
        </div>
      </Section>

      <Section tone="sand">
        <Eyebrow tone="light">Our approach</Eyebrow>
        <Heading tone="light" className="text-3xl md:text-4xl max-w-2xl">More than a ride. A complete travel experience.</Heading>
        <ul className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-px rounded-2xl overflow-hidden" style={{ background: 'var(--sand-line)', border: '1px solid var(--sand-line)' }}>
          {APPROACH.map((a, i) => (
            <li key={a.t} className="p-6" style={{ background: 'var(--sand)' }}>
              <span className="font-display text-3xl font-bold" style={{ color: '#8C6F08' }}>0{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--ink-dark)' }}>{a.t}</h3>
              <p className="mt-1 text-sm" style={{ color: 'var(--ink-dark-muted)' }}>{a.d}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section tone="deep">
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-5">
            <Eyebrow>Leadership</Eyebrow>
            <Heading className="text-3xl md:text-4xl">The people behind the ride.</Heading>
          </div>
          <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-5">
            {[
              { n: 'Karen Hernandez', r: 'Owner' },
              { n: 'Dennis Rivera', r: 'Founder / Managing Director' },
            ].map((p) => (
              <li key={p.n} className="rounded-2xl p-6" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
                <div className="w-14 h-14 rounded-full flex items-center justify-center font-display text-xl font-bold" style={{ background: 'rgba(184,150,12,0.12)', color: 'var(--gold-light)', border: '1px solid rgba(184,150,12,0.35)' }}>
                  {p.n.split(' ').map((w) => w[0]).join('')}
                </div>
                <p className="mt-4 text-lg font-semibold text-white">{p.n}</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{p.r}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-14 pt-10 grid lg:grid-cols-12 gap-10" style={{ borderTop: '1px solid var(--surface)' }}>
          <div className="lg:col-span-5">
            <Eyebrow>Industry expertise</Eyebrow>
          </div>
          <ul className="lg:col-span-7 flex flex-wrap gap-3">
            {EXPERTISE.map((e) => <li key={e} className="px-4 py-2.5 rounded-full text-sm text-white" style={{ border: '1px solid var(--border-soft)' }}>{e}</li>)}
          </ul>
        </div>
      </Section>

      <Section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Heading className="text-3xl md:text-4xl">Travel with us, or partner with us.</Heading>
          <div className="flex flex-col sm:flex-row gap-3">
            <ButtonLink href="/book" size="lg">Book a ride <Arrow /></ButtonLink>
            <ButtonLink href="/partners" variant="outline" size="lg">Partnerships</ButtonLink>
          </div>
        </div>
      </Section>
    </PageShell>
  )
}
