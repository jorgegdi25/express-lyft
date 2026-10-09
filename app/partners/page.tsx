import Image from 'next/image'
import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import { Arrow, ButtonLink, Eyebrow, Heading, WhatsAppIcon } from '@/components/site/ui'
import { CONTACT, whatsappLink } from '@/lib/site/contact'
import { getPartnerHotels } from '@/lib/site/data'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Hotel & Travel Partners | Express Lyft',
  description: 'Transportation partnerships for hotels, airlines, cruise lines, travel agencies and corporate travel in South Florida. Guest transfers, crew transportation and group movements.',
  alternates: { canonical: '/partners' },
}

// Content from the Express Lyft portfolio (pages 6–10, 12).
const AUDIENCES = [
  {
    id: 'hotels',
    t: 'Hotels & Resorts',
    d: 'Give guests a trusted transportation partner. Your hotel gets its own booking page and QR code for the front desk, and earns a rebate on eligible completed bookings.*',
    points: ['Dedicated booking page for your guests', 'Airport, cruise, beach and local transfers', 'Rebate on eligible completed bookings*'],
  },
  {
    id: 'airlines',
    t: 'Airlines & Crew',
    d: 'Ground transportation and hotel arrangements for crews, care teams and passengers affected by flight disruptions.',
    points: ['Crew transportation', 'Distressed passenger support', 'Rapid accommodation coordination'],
  },
  {
    id: 'corporate',
    t: 'Corporate Travel',
    d: 'Transportation for business travelers, teams and events, with exclusive group and corporate rates for eligible programs.*',
    points: ['Executive and team transfers', 'Meetings, conferences and events', 'Group & corporate rates*'],
  },
  {
    id: 'travel',
    t: 'Travel Agencies & Cruise',
    d: 'Integrate transportation into your customer’s trip — airport, hotel and cruise terminal transfers for individuals and groups.',
    points: ['Transportation-inclusive packages', 'Booking add-ons', 'Group movements'],
  },
]

const BENEFITS = [
  { t: 'Additional revenue', d: 'Earn a rebate for every eligible completed guest transportation booking.*' },
  { t: 'Zero transportation operating costs', d: 'We manage vehicles, professional drivers, insurance, scheduling and customer service.' },
  { t: 'Less work for your staff', d: 'Refer guests to a trusted partner instead of coordinating rides.' },
  { t: 'Better guest experience', d: 'Reliable transportation supports positive reviews, repeat stays and guest loyalty.' },
]

export default async function PartnersPage() {
  const hotels = await getPartnerHotels().catch(() => [])
  const meetingMsg = 'Hello Express Lyft, I would like to schedule a partnership meeting.'

  return (
    <PageShell
      breadcrumb={[{ label: 'Partners' }]}
      eyebrow="Partnerships"
      title="Let’s build the next journey together."
      intro="Express Lyft works with hotels, airlines, cruise lines, travel agencies and businesses to make transportation a seamless part of the traveler’s journey."
      image="/site/hotel-arrival.webp"
      imageAlt="Guests arriving at a hotel entrance with an Express Lyft coach"
      heroAside={
        <div className="flex flex-col sm:flex-row lg:justify-end gap-3">
          <ButtonLink href={whatsappLink(meetingMsg)} size="lg">Schedule a meeting <Arrow /></ButtonLink>
          <ButtonLink href={`mailto:${CONTACT.email}?subject=Partnership%20inquiry`} variant="outline" size="lg">Email us</ButtonLink>
        </div>
      }
    >
      <Section>
        <div className="grid md:grid-cols-2 gap-5">
          {AUDIENCES.map((a) => (
            <article key={a.id} id={a.id} className="rounded-2xl p-7 md:p-9 scroll-mt-28" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
              <h2 className="font-display text-3xl font-semibold text-[var(--text)]">{a.t}</h2>
              <p className="mt-3 text-[15px] leading-relaxed" style={{ color: 'var(--text-subtle)' }}>{a.d}</p>
              <ul className="mt-6 flex flex-col gap-2.5">
                {a.points.map((p) => (
                  <li key={p} className="flex items-center gap-3 text-sm text-[var(--text)]">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-light)' }} aria-hidden />{p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </Section>

      <Section tone="sand">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5">
            <Eyebrow tone="light">For hotels</Eyebrow>
            <Heading tone="light" className="text-4xl md:text-5xl">More value. Less operational work.</Heading>
            <p className="mt-5 text-[15px] leading-relaxed" style={{ color: 'var(--ink-dark-muted)' }}>
              Express Lyft helps hotels improve the guest experience, reduce transportation coordination and generate additional revenue — without investing in vehicles, drivers, insurance or daily operations.
            </p>
            <p className="mt-4 text-sm" style={{ color: 'var(--ink-dark-muted)' }}>
              Rebate eligibility and amounts are agreed with each hotel before the program starts.
            </p>
          </div>
          <ul className="lg:col-span-7 grid sm:grid-cols-2 gap-px rounded-2xl overflow-hidden" style={{ background: 'var(--sand-line)', border: '1px solid var(--sand-line)' }}>
            {BENEFITS.map((b, i) => (
              <li key={b.t} className="p-6 md:p-8" style={{ background: 'var(--sand)' }}>
                <span className="font-display text-3xl font-semibold" style={{ color: 'var(--gold-light)' }}>0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold" style={{ color: 'var(--ink-dark)' }}>{b.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--ink-dark-muted)' }}>{b.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      <Section tone="deep">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image src="/site/partners-hotel.jpg" alt="Chauffeur loading luggage into a black Chevrolet Suburban at a Miami hotel entrance, with a Sprinter van waiting behind" fill sizes="(min-width:1280px) 600px, (min-width:1024px) 50vw, calc(100vw - 32px)" className="object-cover" />
          </div>
          <div className="lg:col-span-6">
            <Eyebrow>How it works for hotels</Eyebrow>
            <Heading className="text-3xl md:text-4xl">Simple to set up.</Heading>
            <ol className="mt-8 flex flex-col gap-6">
              {[
                ['Meet our team', 'We learn about your guests, your location and your transportation needs.'],
                ['Your hotel page goes live', 'A booking page and QR code for your front desk and guest communications.'],
                ['Guests book, we drive', 'We handle vehicles, drivers, scheduling and customer service — and track eligible bookings for your rebate.'],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-5">
                  <span className="font-display text-3xl font-semibold w-8 shrink-0" style={{ color: 'var(--gold)' }}>{i + 1}</span>
                  <div><h3 className="text-lg font-semibold text-[var(--text)]">{t}</h3><p className="mt-1 text-[15px]" style={{ color: 'var(--text-subtle)' }}>{d}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {hotels.length > 0 && (
        <Section>
          <Eyebrow>Hotel partners</Eyebrow>
          <ul className="mt-4 flex flex-wrap gap-x-10 gap-y-4">
            {hotels.map((h) => <li key={h.slug} className="font-display text-2xl text-[var(--text)]">{h.name}</li>)}
          </ul>
        </Section>
      )}

      <Section tone="deep">
        <div className="rounded-3xl p-8 md:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-8" style={{ background: 'var(--sand-deep)', border: '1px solid rgba(184,150,12,0.3)' }}>
          <div>
            <Heading className="text-3xl md:text-4xl">Schedule a partnership meeting.</Heading>
            <p className="mt-3 text-[15px]" style={{ color: 'var(--text-subtle)' }}>Dennis Rivera, Founder / Managing Director · {CONTACT.phoneDisplay} · {CONTACT.email}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <ButtonLink href={whatsappLink(meetingMsg)} size="lg"><WhatsAppIcon size={15} /> WhatsApp</ButtonLink>
            <ButtonLink href={CONTACT.phoneHref} variant="outline" size="lg">Call</ButtonLink>
          </div>
        </div>
        <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>*Terms & conditions apply.</p>
      </Section>
    </PageShell>
  )
}
