import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import PageShell, { Section } from '@/components/site/PageShell'
import { Arrow } from '@/components/site/ui'
import { SERVICES } from '@/lib/site/services'

export const metadata: Metadata = {
  title: 'Transportation Services in Miami & South Florida | Express Lyft',
  description: 'Airport transfers, hotel transfers, cruise port transfers, corporate transportation and group transportation across Miami and South Florida.',
  alternates: { canonical: '/services' },
}

export default function ServicesPage() {
  return (
    <PageShell
      breadcrumb={[{ label: 'Services' }]}
      eyebrow="Services"
      title="Ground transportation for travelers, hotels and teams."
      intro="From a single airport pickup to moving an entire conference — one team, one standard of service."
    >
      <Section>
        <ul className="grid md:grid-cols-2 gap-5">
          {SERVICES.map((s) => (
            <li key={s.slug}>
              <Link href={`/${s.slug}`} className="group flex flex-col rounded-2xl overflow-hidden h-full" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
                <div className="relative aspect-[16/10] shrink-0">
                  <Image src={s.image} alt={s.imageAlt} fill sizes="(min-width:1280px) 600px, (min-width:768px) 50vw, calc(100vw - 32px)" className="object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
                </div>
                <div className="p-5 md:p-7 flex flex-col flex-1">
                  <h2 className="font-display text-2xl font-semibold text-[var(--text)]">{s.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.short}</p>
                  <span className="mt-auto pt-4 inline-flex items-center gap-2 text-[14px] font-semibold" style={{ color: 'var(--gold-light)' }}>
                    Learn more <Arrow />
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </PageShell>
  )
}
