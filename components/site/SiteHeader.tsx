'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CONTACT } from '@/lib/site/contact'
import { SERVICES } from '@/lib/site/services'
import { Arrow, PhoneIcon, WhatsAppIcon } from './ui'

const NAV = [
  { label: 'Fleet', href: '/fleet' },
  { label: 'Partners', href: '/partners' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
]

const LOCATIONS = [
  { label: 'Miami & South Florida', href: '/miami' },
  { label: 'Orlando', href: '/orlando', note: 'Expanding' },
]

export default function SiteHeader({ overlay = false, bookHref = '/book' }: { overlay?: boolean; bookHref?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [menu, setMenu] = useState<'services' | 'locations' | null>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const solid = !overlay || scrolled || open

  return (
    <>
      <header
        className={`${overlay ? 'fixed' : 'sticky'} top-0 inset-x-0 z-50 transition-colors duration-300`}
        style={{
          background: solid ? 'rgba(14,14,14,0.9)' : 'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,0,0,0))',
          backdropFilter: solid ? 'blur(12px)' : undefined,
          WebkitBackdropFilter: solid ? 'blur(12px)' : undefined,
          borderBottom: solid ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        }}
        onMouseLeave={() => setMenu(null)}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-[68px] md:h-[76px] flex items-center justify-between gap-6">
          <Link href="/" className="shrink-0" aria-label="Express Lyft home" onClick={() => setOpen(false)}>
            <Image src="/logo.webp" alt="Express Lyft" width={180} height={48} priority className="h-9 md:h-10 w-auto object-contain" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold" aria-label="Main">
            <div className="relative" onMouseEnter={() => setMenu('services')}>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-white/85 hover:text-white flex items-center gap-1"
                aria-expanded={menu === 'services'}
                onClick={() => setMenu(menu === 'services' ? null : 'services')}
              >
                Services
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {menu === 'services' && (
                <div className="absolute left-0 top-full pt-2 w-[380px]">
                  <div className="rounded-2xl p-2 shadow-2xl" style={{ background: '#141414', border: '1px solid var(--border)' }}>
                    {SERVICES.map((s) => (
                      <Link key={s.slug} href={`/${s.slug}`} className="block rounded-xl px-4 py-3 hover:bg-white/5" onClick={() => setMenu(null)}>
                        <span className="block text-white text-sm font-semibold">{s.name}</span>
                        <span className="block text-xs font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.short}</span>
                      </Link>
                    ))}
                    <Link href="/services" className="flex items-center gap-2 px-4 py-3 text-xs uppercase tracking-[0.14em]" style={{ color: 'var(--gold-light)' }} onClick={() => setMenu(null)}>
                      All services <Arrow />
                    </Link>
                  </div>
                </div>
              )}
            </div>
            <div className="relative" onMouseEnter={() => setMenu('locations')}>
              <button
                type="button"
                className="px-3 py-2 rounded-lg text-white/85 hover:text-white flex items-center gap-1"
                aria-expanded={menu === 'locations'}
                onClick={() => setMenu(menu === 'locations' ? null : 'locations')}
              >
                Locations
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
              </button>
              {menu === 'locations' && (
                <div className="absolute left-0 top-full pt-2 w-[260px]">
                  <div className="rounded-2xl p-2 shadow-2xl" style={{ background: '#141414', border: '1px solid var(--border)' }}>
                    {LOCATIONS.map((l) => (
                      <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-xl px-4 py-3 hover:bg-white/5 text-sm text-white" onClick={() => setMenu(null)}>
                        {l.label}
                        {l.note && <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--gold-light)' }}>{l.note}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="px-3 py-2 rounded-lg text-white/85 hover:text-white" onMouseEnter={() => setMenu(null)}>
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <a href={CONTACT.phoneHref} className="hidden md:flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-[var(--gold-light)]">
              <PhoneIcon size={15} />
              <span className="hidden xl:inline">{CONTACT.phoneDisplay}</span>
            </a>
            <a
              href={CONTACT.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hidden md:flex w-9 h-9 rounded-full items-center justify-center text-[#25D366] hover:bg-white/5"
            >
              <WhatsAppIcon size={17} />
            </a>
            <Link
              href={bookHref}
              className="hidden sm:inline-flex items-center gap-2 px-4 md:px-5 py-2.5 rounded-xl text-[12px] font-bold uppercase tracking-[0.12em] hover:brightness-110 transition"
              style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
            >
              Book a Ride
            </Link>
            <a href={CONTACT.phoneHref} aria-label="Call Express Lyft" className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ border: '1px solid rgba(255,255,255,0.14)' }}>
              <PhoneIcon size={16} />
            </a>
            <button
              type="button"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              onClick={() => setOpen(!open)}
              className="lg:hidden w-10 h-10 rounded-xl flex items-center justify-center text-white"
              style={{ border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 pt-[68px] overflow-y-auto" style={{ background: '#0c0c0c' }}>
          <div className="px-5 py-6 flex flex-col gap-8">
            <Link
              href={bookHref}
              onClick={() => setOpen(false)}
              className="w-full text-center py-4 rounded-xl text-sm font-bold uppercase tracking-[0.12em]"
              style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
            >
              Book a Ride
            </Link>
            <div>
              <p className="text-[11px] uppercase tracking-[3px] mb-3" style={{ color: 'var(--gold)' }}>Services</p>
              <ul className="flex flex-col">
                {SERVICES.map((s) => (
                  <li key={s.slug}>
                    <Link href={`/${s.slug}`} onClick={() => setOpen(false)} className="block py-3 text-lg font-display text-white border-b border-white/5">
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <ul className="flex flex-col">
              {[...NAV, ...LOCATIONS.map((l) => ({ label: l.label, href: l.href }))].map((n) => (
                <li key={n.href}>
                  <Link href={n.href} onClick={() => setOpen(false)} className="block py-3 text-lg font-display text-white border-b border-white/5">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
              <a href={CONTACT.phoneHref} className="block text-white font-semibold text-base">{CONTACT.phoneDisplay}</a>
              <p className="mt-1">{CONTACT.hours}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Fixed bottom bar on phones: booking is always one tap away.
export function MobileActionBar({ hideBook = false, bookHref = '/book' }: { hideBook?: boolean; bookHref?: string }) {
  // When the booking form is on this page, get out of its way while it's on screen.
  const [formVisible, setFormVisible] = useState(false)
  useEffect(() => {
    if (!bookHref.startsWith('#')) return
    const el = document.querySelector(bookHref)
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setFormVisible(e.isIntersecting), { threshold: 0.05 })
    io.observe(el)
    return () => io.disconnect()
  }, [bookHref])

  return (
    <div
      className={`md:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))] flex gap-2 transition-transform duration-300 ${formVisible ? 'translate-y-full' : ''}`}
      style={{ background: 'linear-gradient(180deg, rgba(10,10,10,0) 0%, rgba(10,10,10,0.92) 30%)' }}
      aria-hidden={formVisible}
    >
      {!hideBook && (
        <Link
          href={bookHref}
          className="flex-1 h-12 rounded-xl flex items-center justify-center text-[13px] font-bold uppercase tracking-[0.12em]"
          style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
        >
          Book a Ride
        </Link>
      )}
      <a
        href={CONTACT.whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        className={`${hideBook ? 'flex-1' : 'w-12'} h-12 rounded-xl flex items-center justify-center gap-2 text-white text-[13px] font-semibold`}
        style={{ background: '#1a1a1a', border: '1px solid var(--border-soft)' }}
      >
        <WhatsAppIcon size={18} className="text-[#25D366]" />
        {hideBook && 'WhatsApp'}
      </a>
      <a
        href={CONTACT.phoneHref}
        aria-label="Call"
        className={`${hideBook ? 'flex-1' : 'w-12'} h-12 rounded-xl flex items-center justify-center gap-2 text-white text-[13px] font-semibold`}
        style={{ background: '#1a1a1a', border: '1px solid var(--border-soft)' }}
      >
        <PhoneIcon size={17} />
        {hideBook && 'Call'}
      </a>
    </div>
  )
}
