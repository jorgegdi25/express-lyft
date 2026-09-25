import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import { ButtonLink, PhoneIcon, WhatsAppIcon } from '@/components/site/ui'
import { CONTACT, OFFICES } from '@/lib/site/contact'

export const metadata: Metadata = {
  title: 'Contact Express Lyft | Miami Transportation',
  description: `Call ${CONTACT.phoneDisplay}, WhatsApp ${CONTACT.whatsappDisplay} or email ${CONTACT.email}. Offices in Miami and Orlando.`,
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <PageShell breadcrumb={[{ label: 'Contact' }]} eyebrow="Contact" title="Talk to a real person." intro={`Our team is available ${CONTACT.hours.toLowerCase()}.`}>
      <Section>
        <div className="grid md:grid-cols-3 gap-5">
          <a href={CONTACT.phoneHref} className="rounded-2xl p-7 hover:border-[var(--gold)] transition-colors" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
            <PhoneIcon size={22} className="text-[var(--gold-light)]" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Call</p>
            <p className="mt-1 text-2xl font-semibold text-white">{CONTACT.phoneDisplay}</p>
          </a>
          <a href={CONTACT.whatsappHref} target="_blank" rel="noopener noreferrer" className="rounded-2xl p-7 hover:border-[#25D366] transition-colors" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
            <WhatsAppIcon size={22} className="text-[#25D366]" />
            <p className="mt-5 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>WhatsApp</p>
            <p className="mt-1 text-2xl font-semibold text-white">{CONTACT.whatsappDisplay}</p>
          </a>
          <a href={`mailto:${CONTACT.email}`} className="rounded-2xl p-7 hover:border-[var(--gold)] transition-colors" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="1.7" aria-hidden><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
            <p className="mt-5 text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>Email</p>
            <p className="mt-1 text-2xl font-semibold text-white">{CONTACT.email}</p>
          </a>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {OFFICES.map((o) => (
            <address key={o.city} className="not-italic rounded-2xl p-7" style={{ border: '1px solid var(--border-faint)' }}>
              <p className="font-display text-2xl font-bold text-white">
                {o.city}
                {o.status === 'expanding' && <span className="ml-3 align-middle text-[10px] font-sans uppercase tracking-wider" style={{ color: 'var(--gold-light)' }}>Expanding</span>}
              </p>
              <p className="mt-2 text-[15px]" style={{ color: 'var(--text-subtle)' }}>{o.street}<br />{o.locality}, {o.region} {o.postalCode}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${o.street}, ${o.locality}, ${o.region} ${o.postalCode}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm underline"
                style={{ color: 'var(--gold-light)' }}
              >
                Open in Google Maps
              </a>
            </address>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <ButtonLink href="/book" size="lg">Book a ride online</ButtonLink>
          <ButtonLink href="/partners" variant="outline" size="lg">Partnership inquiries</ButtonLink>
        </div>
      </Section>
    </PageShell>
  )
}
