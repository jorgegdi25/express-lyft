import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import { ButtonLink, Eyebrow, Heading } from '@/components/site/ui'
import { CONTACT, OFFICES, whatsappLink } from '@/lib/site/contact'

export const metadata: Metadata = {
  title: 'Orlando Transportation | Express Lyft',
  description: 'Express Lyft is expanding to Orlando. Contact our team for airport, hotel and group transportation in the Orlando area.',
  alternates: { canonical: '/orlando' },
}

// Orlando operation is being set up (confirmed by the team, Sep 2026).
// Keep this page honest: an "expanding" message plus direct contact,
// no claims about airports or coverage until they are confirmed.
export default function OrlandoPage() {
  const orlando = OFFICES.find((o) => o.city === 'Orlando')!
  return (
    <PageShell
      breadcrumb={[{ label: 'Locations' }, { label: 'Orlando' }]}
      eyebrow="Orlando · Expanding"
      title="Express Lyft is coming to Orlando."
      intro="We are setting up our Orlando operation. Planning a trip or a group movement in the area? Talk to our team — we'll tell you exactly what we can do."
    >
      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-6">
            <Eyebrow>Orlando office</Eyebrow>
            <Heading className="text-3xl">{orlando.street}</Heading>
            <p className="mt-2 text-[15px]" style={{ color: 'var(--text-subtle)' }}>{orlando.locality}, {orlando.region} {orlando.postalCode}</p>
            <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
              Contact our team to confirm service availability for your travel dates.
            </p>
          </div>
          <div className="lg:col-span-6 flex flex-col sm:flex-row lg:justify-end items-start gap-3">
            <ButtonLink href={whatsappLink('Hello Express Lyft, I need transportation in Orlando.')} size="lg">Ask about Orlando</ButtonLink>
            <ButtonLink href={CONTACT.phoneHref} variant="outline" size="lg">{CONTACT.phoneDisplay}</ButtonLink>
          </div>
        </div>
      </Section>
    </PageShell>
  )
}
