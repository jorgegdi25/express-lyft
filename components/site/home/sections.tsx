import Image from 'next/image'
import Link from 'next/link'
import { CONTACT } from '@/lib/site/contact'
import { SERVICES } from '@/lib/site/services'
import { FAQ } from '@/lib/site/faq'
import type { StartingPrices } from '@/lib/site/data'
import type { Testimonial } from '@/components/Testimonials'
import { Arrow, ButtonLink, Container, Eyebrow, Heading, PhoneIcon, WhatsAppIcon } from '../ui'
import Reveal from '../Reveal'
import FleetShowcase from '../FleetShowcase'
import ReviewsGrid from '../ReviewsGrid'
import FaqList from '../FaqList'
import HeroMedia from './HeroMedia'
import HeroQuickStart from './HeroQuickStart'
import RouteMap from '../RouteMap'

/* ── 02 HERO ─────────────────────────────────────────────────────── */
// Full-bleed video with the copy and quick start over a cinematic scrim.
export function Hero() {
  return (
    <section className="site-dark relative overflow-hidden min-h-[88svh] md:min-h-[calc(100svh-77px)] flex items-end pt-24 pb-12 md:pb-16 bg-black">
      <HeroMedia video="/hero-video-1280.mp4" mobileVideo="/hero-video-960.mp4" poster="/gallery/aeropuerto.webp" alt="Express Lyft chauffeur waiting at the Miami airport curb" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(5,5,5,0.82) 0%, rgba(5,5,5,0.55) 38%, rgba(5,5,5,0.12) 70%, rgba(5,5,5,0) 100%)' }} />
      <div className="absolute inset-x-0 bottom-0 h-3/5" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.4) 45%, transparent 100%)' }} />
      <div className="absolute inset-x-0 top-0 h-32" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), transparent)' }} />
      <Container className="relative w-full">
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.32em]" style={{ color: '#E9D5A6' }}>
            <span className="h-px w-8" style={{ background: 'var(--brand-gold-gradient)' }} aria-hidden />
            Private transportation · Miami & South Florida
          </p>
          <h1 className="font-display font-semibold text-white text-[40px] leading-[1.04] md:text-[60px] xl:text-[72px] mt-5 tracking-[-0.03em]" style={{ textShadow: '0 2px 30px rgba(0,0,0,0.4)' }}>
            From arrival to destination, <span className="text-gold-gradient">handled.</span>
          </h1>
          <p className="mt-5 text-base md:text-lg text-white/85 leading-relaxed max-w-xl">
            Airport, hotel and cruise port transfers, corporate travel and group transportation — with professional drivers, clear prices and easy online booking.
          </p>
          <div className="mt-8"><HeroQuickStart /></div>
          <p className="mt-6 text-sm text-white/70 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Prefer to talk to someone?</span>
            <a href={CONTACT.phoneHref} className="inline-flex items-center gap-1.5 text-white hover:text-[#E9D5A6]"><PhoneIcon size={14} />{CONTACT.phoneDisplay}</a>
            <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-white hover:text-[#25D366]"><WhatsAppIcon size={14} />WhatsApp</a>
          </p>
        </div>
      </Container>
    </section>
  )
}

/* ── 03 TRUST STRIP ──────────────────────────────────────────────── */
// Only claims backed by the current site/FAQ.
const TRUST = [
  { t: 'Licensed & insured', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4" /> },
  { t: '30-min free airport wait', icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
  { t: 'Meet & Greet available', icon: <><rect x="4" y="5" width="16" height="11" rx="2" /><path d="M8 20h8M12 16v4" /></> },
  { t: 'Free child seats', icon: <><circle cx="12" cy="6" r="2.5" /><path d="M7 21v-5l-2-4 4-2h6l4 2-2 4v5" /></> },
  { t: CONTACT.hours, icon: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></> },
]

export function TrustStrip() {
  return (
    <section aria-label="Why travelers trust Express Lyft" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--surface)' }}>
      <Container>
        <ul className="flex md:grid md:grid-cols-5 gap-6 md:gap-4 overflow-x-auto no-scrollbar py-6 -mx-4 px-4 md:mx-0 md:px-0">
          {TRUST.map((x) => (
            <li key={x.t} className="shrink-0 flex items-center gap-3 text-[13px] font-medium text-[var(--text-subtle)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{x.icon}</svg>
              {x.t}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}

/* ── 04 SERVICES ─────────────────────────────────────────────────── */
export function ServicesSection() {
  const [lead, ...rest] = SERVICES
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--bg)' }}>
      <Container>
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-10 md:mb-14">
          <div className="max-w-2xl">
            <Eyebrow>Services</Eyebrow>
            <Heading className="text-4xl md:text-5xl">Transportation for every part of the trip.</Heading>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            One team for the flight, the hotel, the cruise and the meeting in between.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-4 md:gap-5">
          <Reveal className="min-w-0 xl:col-span-2">
            <ServiceCard s={lead} />
          </Reveal>
          {rest.map((s, i) => (
            <Reveal key={s.slug} delay={80 * (i + 1)} className={`min-w-0 ${i > 1 ? 'xl:col-span-3' : 'xl:col-span-2'}`}>
              <ServiceCard s={s} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  )
}

function ServiceCard({ s }: { s: (typeof SERVICES)[number] }) {
  return (
    <Link
      href={`/${s.slug}`}
      className="group relative flex h-full flex-col rounded-2xl overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--gold-light)] hover:shadow-lg transition-shadow"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}
    >
      <div className="relative shrink-0 aspect-[16/10]">
        <Image src={s.image} alt={s.imageAlt} fill sizes="(min-width:1280px) 600px, (min-width:768px) 50vw, calc(100vw - 32px)" className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
      </div>
      <div className="relative flex flex-1 flex-col p-5 md:p-6">
        <h3 className="font-display font-semibold leading-tight text-2xl">{s.name}</h3>
        <p className="mt-3 leading-relaxed text-sm" style={{ color: 'var(--text-subtle)' }}>{s.cardDescription}</p>
        <span className="mt-auto pt-5 inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--gold-light)' }}>
          Learn more <Arrow className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}

/* ── 05 THE EXPERIENCE (journey) ────────────────────────────────── */
// Each step is backed by something the system actually does (confirmation
// email, trip-reminders cron, curbside / Meet & Greet, change support).
const JOURNEY = [
  { k: 'Booked', t: 'Confirmed by email', d: 'Your trip details — pickup, destination, vehicle and contact — arrive right after you book.' },
  { k: 'Before pickup', t: 'A reminder ahead of time', d: 'We remind you before your ride so there are no surprises on travel day.' },
  { k: 'Arrival', t: 'Met where you land', d: 'Curbside at arrivals, or inside at baggage claim with a sign for Meet & Greet.' },
  { k: 'On the road', t: 'A comfortable ride', d: 'Clean, well-maintained vehicles and professional drivers who know South Florida.' },
  { k: 'Destination', t: 'A real person if plans change', d: 'Flight delayed or plans moved? Call or WhatsApp — our team adjusts the ride.' },
]

export function JourneySection() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: 'var(--bg-deep)' }}>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <Eyebrow>The Express Lyft experience</Eyebrow>
            <Heading className="text-4xl md:text-5xl">What happens after you book.</Heading>
            <p className="mt-5 text-[15px] leading-relaxed max-w-md" style={{ color: 'var(--text-muted)' }}>
              We have worked with airlines, cruise lines and hotels for years. That experience shows up in the small moments of your trip.
            </p>
            <div className="relative mt-8 aspect-[4/3] rounded-2xl overflow-hidden hidden md:block">
              <Image src="/gallery/interna.webp" alt="View from inside an Express Lyft vehicle toward the Miami skyline" fill sizes="40vw" className="object-cover" />
            </div>
          </div>

          <ol className="lg:col-span-7 relative">
            <span className="absolute left-[15px] top-2 bottom-2 w-px" style={{ background: 'linear-gradient(180deg, var(--gold) 0%, rgba(184,150,12,0.15) 100%)' }} aria-hidden />
            {JOURNEY.map((j, i) => (
              <Reveal as="li" key={j.k} delay={i * 90} className="relative pl-14 pb-10 last:pb-0">
                <span
                  className="absolute left-0 top-0 w-[31px] h-[31px] rounded-full flex items-center justify-center text-[11px] font-bold"
                  style={{ background: 'var(--bg-deep)', border: '1px solid var(--gold)', color: 'var(--gold-light)' }}
                  aria-hidden
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'var(--text-faint)' }}>{j.k}</p>
                <h3 className="font-display text-2xl md:text-3xl font-semibold text-[var(--text)] mt-1">{j.t}</h3>
                <p className="mt-2 text-[15px] leading-relaxed max-w-lg" style={{ color: 'var(--text-subtle)' }}>{j.d}</p>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}

/* ── 06 FLEET ────────────────────────────────────────────────────── */
export function FleetSection({ prices }: { prices: StartingPrices }) {
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--sand)' }}>
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 md:mb-10">
          <div className="max-w-2xl">
            <Eyebrow tone="light">Our fleet</Eyebrow>
            <Heading tone="light" className="text-4xl md:text-5xl">The right vehicle for every group.</Heading>
          </div>
          <Link href="/fleet" className="inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--ink-dark)' }}>
            Compare all vehicles <Arrow />
          </Link>
        </div>
        <FleetShowcase prices={prices} />
      </Container>
    </section>
  )
}

/* ── 07 LOCAL + POPULAR ROUTES ──────────────────────────────────── */
// [TODO: Dennis to confirm the 6 routes to feature]. Prices are not shown
// here on purpose — /book calculates the real price for the exact route.
export const POPULAR_ROUTES = [
  { id: 'mia-beach', from: 'MIA', to: 'Miami Beach', pickup: 'Miami International Airport (MIA)', dropoff: 'Miami Beach, FL' },
  { id: 'mia-port', from: 'MIA', to: 'PortMiami', pickup: 'Miami International Airport (MIA)', dropoff: 'PortMiami, Miami, FL' },
  { id: 'mia-brickell', from: 'MIA', to: 'Downtown & Brickell', pickup: 'Miami International Airport (MIA)', dropoff: 'Brickell, Miami, FL' },
  { id: 'fll-port', from: 'FLL', to: 'PortMiami', pickup: 'Fort Lauderdale-Hollywood International Airport (FLL)', dropoff: 'PortMiami, Miami, FL' },
  { id: 'fll-beach', from: 'FLL', to: 'Miami Beach', pickup: 'Fort Lauderdale-Hollywood International Airport (FLL)', dropoff: 'Miami Beach, FL' },
  { id: 'beach-port', from: 'Miami Beach hotels', to: 'PortMiami', pickup: 'Miami Beach, FL', dropoff: 'PortMiami, Miami, FL' },
]

export function LocalSection() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--bg)' }}>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1">
            <Reveal>
              <RouteMap />
            </Reveal>
          </div>
          <div className="lg:col-span-6 order-1 lg:order-2">
            <Eyebrow>Local knowledge</Eyebrow>
            <Heading className="text-4xl md:text-5xl">We drive these roads every day.</Heading>
            <p className="mt-5 text-[15px] leading-relaxed max-w-lg" style={{ color: 'var(--text-muted)' }}>
              Based in Miami, we know the terminals at MIA and FLL, the cruise piers at PortMiami and the hotels from Brickell to Miami Beach. Choose a route and see your price for your exact trip.
            </p>
            <ul className="mt-8 flex flex-col" style={{ borderTop: '1px solid var(--border)' }}>
              {POPULAR_ROUTES.map((r) => (
                <li key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <Link
                    href={`/book?pickup=${encodeURIComponent(r.pickup)}&dropoff=${encodeURIComponent(r.dropoff)}`}
                    className="group flex items-center justify-between gap-4 py-4 min-h-[56px]"
                  >
                    <span className="flex items-center gap-3 text-[var(--text)] text-[15px] md:text-base font-medium">
                      <span>{r.from}</span>
                      <span className="w-8 h-px" style={{ background: 'var(--gold)' }} aria-hidden />
                      <span>{r.to}</span>
                    </span>
                    <span className="inline-flex items-center gap-2 text-[14px] font-semibold shrink-0" style={{ color: 'var(--gold-light)' }}>
                      See price <Arrow className="transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ── 08 PARTNERS (B2B) ──────────────────────────────────────────── */
const B2B = [
  {
    t: 'Hotels & Resorts',
    d: 'Offer guests reliable transfers, take coordination off your front desk, and earn a rebate on eligible completed bookings.*',
    cta: 'Partner with us', href: '/partners#hotels',
  },
  {
    t: 'Corporate & Airlines',
    d: 'Business travel, crew transportation and ground support when flights are disrupted.',
    cta: 'Corporate transportation', href: '/corporate-transportation',
  },
  {
    t: 'Groups & Events',
    d: 'Sprinters, mini buses and coaches for conferences, weddings, tours and cruise groups.',
    cta: 'Request a group quote', href: '/group-transportation',
  },
]

export function PartnersSection() {
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--sand)' }}>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-end mb-10 md:mb-14">
          <div className="lg:col-span-7">
            <Eyebrow tone="light">For hotels, businesses & groups</Eyebrow>
            <Heading tone="light" className="text-4xl md:text-5xl">A transportation partner for hospitality and travel.</Heading>
          </div>
          <p className="lg:col-span-5 text-[15px] leading-relaxed" style={{ color: 'var(--ink-dark-muted)' }}>
            Express Lyft manages the vehicles, drivers, insurance, scheduling and customer service — so your team doesn&apos;t have to.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 relative min-h-[320px] rounded-2xl overflow-hidden">
            <Image src="/site/hotel-arrival.webp" alt="Guests arriving at a hotel entrance with an Express Lyft coach" fill sizes="(min-width:1024px) 40vw, 100vw" className="object-cover" />
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-3 lg:grid-cols-1 gap-px rounded-2xl overflow-hidden" style={{ background: 'var(--sand-line)', border: '1px solid var(--sand-line)' }}>
            {B2B.map((b) => (
              <Link key={b.t} href={b.href} className="group p-6 md:p-7 flex flex-col lg:flex-row gap-3 lg:gap-8 hover:bg-white/[0.03] transition-colors" style={{ background: 'var(--sand)' }}>
                <h3 className="font-display text-2xl font-semibold lg:w-52 shrink-0" style={{ color: 'var(--ink-dark)' }}>{b.t}</h3>
                <div className="flex-1">
                  <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ink-dark-muted)' }}>{b.d}</p>
                  <span className="mt-3 inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--gold-light)' }}>
                    {b.cta} <Arrow className="transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Partner hotel names (from the `hotels` table) stay off the home
            until the client confirms which ones may be shown publicly. */}
        <p className="mt-6 text-xs" style={{ color: 'var(--ink-dark-muted)' }}>*Terms & conditions apply.</p>
      </Container>
    </section>
  )
}

/* ── 09 REVIEWS ──────────────────────────────────────────────────── */
export function ReviewsSection({ reviews }: { reviews: Testimonial[] }) {
  if (reviews.length === 0) return null
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--bg)' }}>
      <Container>
        <div className="mb-10 md:mb-14 max-w-2xl">
          <Eyebrow>Real passenger experiences</Eyebrow>
          <Heading className="text-4xl md:text-5xl">What passengers say.</Heading>
          <p className="mt-4 text-[15px]" style={{ color: 'var(--text-muted)' }}>Verified reviews from Express Lyft passengers, collected after each completed ride.</p>
        </div>
        <ReviewsGrid reviews={reviews} />
      </Container>
    </section>
  )
}

/* ── 10 HOW IT WORKS ─────────────────────────────────────────────── */
const STEPS = [
  { t: 'Enter your trip', d: 'Pickup, destination, date and passengers.' },
  { t: 'Choose your vehicle', d: 'See the price for each vehicle before you pay.' },
  { t: 'Confirm & pay securely', d: 'Pay online and receive your confirmation by email.' },
  { t: 'Meet your driver', d: 'Relax — your ride is planned around your schedule.' },
]

export function HowItWorks() {
  return (
    <section className="py-20 md:py-24" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--surface)' }}>
      <Container>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <Heading className="text-4xl md:text-5xl">Booked in a few minutes.</Heading>
          </div>
          <ButtonLink href="#book">Book a ride <Arrow /></ButtonLink>
        </div>
        <ol className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {STEPS.map((s, i) => (
            <Reveal as="li" key={s.t} delay={i * 80}>
              <span className="font-display text-5xl md:text-6xl font-semibold" style={{ color: 'var(--gold)' }}>{i + 1}</span>
              <h3 className="mt-3 text-lg font-semibold text-[var(--text)]">{s.t}</h3>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.d}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  )
}

/* ── 11 FAQ ──────────────────────────────────────────────────────── */
export function FaqSection() {
  const featured = FAQ.filter((f) => f.featured)
  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--bg)' }}>
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-4">
            <Eyebrow>Questions & answers</Eyebrow>
            <Heading className="text-4xl md:text-5xl">Good to know before you ride.</Heading>
            <Link href="/faq" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--gold-light)' }}>
              All questions <Arrow />
            </Link>
          </div>
          <div className="lg:col-span-8">
            <FaqList items={featured} />
          </div>
        </div>
      </Container>
    </section>
  )
}

/* ── 12 FINAL CTA ────────────────────────────────────────────────── */
export function FinalCta() {
  return (
    <section className="site-dark relative py-24 md:py-36 overflow-hidden">
      <Image src="/site/night-arrival.webp" alt="" fill sizes="100vw" className="object-cover" />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg, rgba(8,8,8,0.8) 0%, rgba(8,8,8,0.4) 60%, rgba(8,8,8,0.1) 100%)' }} />
      <Container className="relative">
        <div className="max-w-xl">
          <Eyebrow>Ready when you are</Eyebrow>
          <Heading className="text-4xl md:text-6xl">Your ride is ready when you are.</Heading>
          <p className="mt-5 text-base md:text-lg text-[var(--text-muted)]">Book online in a few minutes, or talk to a real person on our team.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <ButtonLink href="#book" size="lg">Book a ride <Arrow /></ButtonLink>
            <ButtonLink href={CONTACT.phoneHref} variant="outline" size="lg"><PhoneIcon size={15} /> Call us</ButtonLink>
            <ButtonLink href={CONTACT.whatsappHref} variant="outline" size="lg"><WhatsAppIcon size={15} className="text-[#25D366]" /> WhatsApp</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
