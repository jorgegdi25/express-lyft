import Image from 'next/image'
import Link from 'next/link'
import { BRAND, CONTACT, OFFICES } from '@/lib/site/contact'
import { SERVICES } from '@/lib/site/services'

export default function SiteFooter() {
  return (
    <footer className="pt-16 pb-28 md:pb-10" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--surface-alt)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10">
          <div className="col-span-2 md:col-span-4 flex flex-col gap-4">
            <Image src="/logo.webp" alt="Express Lyft" width={160} height={42} className="h-10 w-auto object-contain object-left mr-auto" />
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: 'var(--text-muted)' }}>
              Private transportation and hospitality solutions — airport, hotel and cruise port transfers, corporate travel and group transportation in South Florida.
            </p>
            <div className="flex gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <a href={CONTACT.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold-light)]">Facebook</a>
              <a href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-[var(--gold-light)]">Instagram</a>
            </div>
          </div>

          <nav className="md:col-span-2" aria-label="Services">
            <h2 className="text-xs font-bold uppercase tracking-[2px] mb-4 text-white">Services</h2>
            <ul className="flex flex-col gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              {SERVICES.map((s) => (
                <li key={s.slug}><Link href={`/${s.slug}`} className="hover:text-white">{s.name}</Link></li>
              ))}
            </ul>
          </nav>

          <nav className="md:col-span-2" aria-label="Company">
            <h2 className="text-xs font-bold uppercase tracking-[2px] mb-4 text-white">Company</h2>
            <ul className="flex flex-col gap-2.5 text-sm" style={{ color: 'var(--text-muted)' }}>
              <li><Link href="/fleet" className="hover:text-white">Our Fleet</Link></li>
              <li><Link href="/partners" className="hover:text-white">Hotel & Travel Partners</Link></li>
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
              <li><Link href="/book" className="hover:text-white">Book a Ride</Link></li>
            </ul>
          </nav>

          <div className="col-span-2 md:col-span-4 grid grid-cols-2 gap-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div className="col-span-2">
              <h2 className="text-xs font-bold uppercase tracking-[2px] mb-4 text-white">Contact</h2>
              <ul className="flex flex-col gap-2">
                <li><a href={CONTACT.phoneHref} className="text-white font-semibold hover:text-[var(--gold-light)]">{CONTACT.phoneDisplay}</a></li>
                <li><a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="hover:text-white">WhatsApp {CONTACT.whatsappDisplay}</a></li>
                <li><a href={`mailto:${CONTACT.email}`} className="hover:text-white">{CONTACT.email}</a></li>
                <li>{CONTACT.hours}</li>
              </ul>
            </div>
            {OFFICES.map((o) => (
              <address key={o.city} className="not-italic leading-relaxed">
                <span className="block text-white font-semibold mb-1">
                  {o.city}
                  {o.status === 'expanding' && <span className="ml-2 text-[10px] uppercase tracking-wider" style={{ color: 'var(--gold-light)' }}>Expanding</span>}
                </span>
                {o.street}<br />{o.locality}, {o.region} {o.postalCode}
              </address>
            ))}
          </div>
        </div>

        <div className="mt-14 pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs" style={{ borderTop: '1px solid var(--surface-alt)', color: '#666' }}>
          <p>© {new Date().getFullYear()} Express Lyft. All rights reserved. Licensed & Insured.</p>
          <p className="md:text-center max-w-md" style={{ color: 'var(--text-muted)' }}>{BRAND.disclaimer}</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
