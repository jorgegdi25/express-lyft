import { SITE_CLASS } from '@/lib/site/fonts'
import type { Metadata } from 'next'
import MainMapBookingForm, { type BookingPrefill } from '@/components/MainMapBookingForm'
import SiteHeader, { MobileActionBar } from '@/components/site/SiteHeader'
import SiteFooter from '@/components/site/SiteFooter'
import { Container, PhoneIcon, WhatsAppIcon } from '@/components/site/ui'
import { getPricingParams } from '@/lib/site/data'
import { CONTACT } from '@/lib/site/contact'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Book a Ride | Express Lyft',
  description: 'Book private airport, hotel and cruise port transportation in Miami and South Florida. See your price, choose your vehicle and pay securely online.',
  alternates: { canonical: '/book' },
}

const VEHICLES = ['sedan_suv', 'suburban', 'sprinter', 'minibus', 'coachbus'] as const

export default async function BookPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const prices = await getPricingParams()

  const pax = Number(searchParams.pax)
  const vehicle = VEHICLES.find((v) => v === searchParams.vehicle)
  const initial: BookingPrefill = {
    pickup: searchParams.pickup?.slice(0, 200),
    destination: searchParams.dropoff?.slice(0, 200),
    date: /^\d{4}-\d{2}-\d{2}$/.test(searchParams.date || '') ? searchParams.date : undefined,
    passengers: Number.isInteger(pax) && pax > 0 && pax <= 55 ? pax : undefined,
    vehicle,
  }

  return (
    <main className={SITE_CLASS} style={{ background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
      <SiteHeader />
      <section className="pt-10 md:pt-14" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--surface)' }}>
        <Container className="pb-8 md:pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.32em] mb-4" style={{ color: 'var(--gold-light)' }}>Book a ride</p>
            <h1 className="font-display text-4xl md:text-5xl font-semibold">Where are we taking you?</h1>
            <p className="mt-3 text-[15px]" style={{ color: 'var(--text-muted)' }}>
              Trip details → vehicle → checkout. You see the total before you pay.
            </p>
          </div>
          <div className="flex flex-wrap shrink-0 gap-3 text-sm">
            <a href={CONTACT.phoneHref} className="inline-flex items-center gap-2 whitespace-nowrap px-4 py-2.5 rounded-xl text-[var(--text)]" style={{ border: '1px solid var(--border-soft)' }}>
              <PhoneIcon size={14} /> {CONTACT.phoneDisplay}
            </a>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-[var(--text)]" style={{ border: '1px solid var(--border-soft)' }}>
              <WhatsAppIcon size={14} className="text-[#25D366]" /> WhatsApp
            </a>
          </div>
        </Container>
      </section>

      <div className="pt-8 pb-6">
        <MainMapBookingForm prices={prices} initial={initial} hideHeader variant="hero" />
      </div>

      <section className="pb-16">
        <Container>
          <ul className="grid sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-sm" style={{ color: 'var(--text-muted)' }}>
            <li className="rounded-xl p-4" style={{ border: '1px solid var(--border-faint)' }}><span className="block text-[var(--text)] font-semibold mb-1">Secure payment</span>Card payments processed securely. Receipt by email.</li>
            <li className="rounded-xl p-4" style={{ border: '1px solid var(--border-faint)' }}><span className="block text-[var(--text)] font-semibold mb-1">30-min airport grace</span>Complimentary waiting on airport pickups.</li>
            <li className="rounded-xl p-4" style={{ border: '1px solid var(--border-faint)' }}><span className="block text-[var(--text)] font-semibold mb-1">Groups</span>Mini Bus and Coach Bus bookings are confirmed with a quote.</li>
          </ul>
        </Container>
      </section>
      <SiteFooter />
      <MobileActionBar hideBook />
    </main>
  )
}
