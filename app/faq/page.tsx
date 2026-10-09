import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import FaqList from '@/components/site/FaqList'
import { ButtonLink } from '@/components/site/ui'
import { FAQ } from '@/lib/site/faq'
import { CONTACT } from '@/lib/site/contact'

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Express Lyft',
  description: 'Booking, airport pickups, flight delays, Meet & Greet, luggage, child seats, changes and payment — answers about Express Lyft transportation.',
  alternates: { canonical: '/faq' },
}

export default function FaqPage() {
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <PageShell breadcrumb={[{ label: 'FAQ' }]} eyebrow="Questions & answers" title="Frequently asked questions." intro="Everything about booking, airport pickups, vehicles and payment.">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <Section>
        <div className="max-w-3xl">
          <FaqList items={FAQ} categories />
          <div className="mt-12 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
            <p className="text-[var(--text)] text-lg font-semibold">Still have a question?</p>
            <div className="flex gap-3">
              <ButtonLink href={CONTACT.whatsappHref} variant="outline">WhatsApp</ButtonLink>
              <ButtonLink href={CONTACT.phoneHref}>Call us</ButtonLink>
            </div>
          </div>
        </div>
      </Section>
    </PageShell>
  )
}
