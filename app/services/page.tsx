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
              <Link href={`/${s.slug}`} className="group grid grid-cols-5 rounded-2xl overflow-hidden h-full" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}>
                <div className="relative col-span-2 min-h-[180px]">
                  <Image src={s.image} alt={s.imageAlt} fill sizes="(min-width:768px) 20vw, 40vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <div className="col-span-3 p-5 md:p-7 flex flex-col">
                  <h2 className="font-display text-2xl font-bold text-white">{s.name}</h2>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>{s.short}</p>
                  <span className="mt-auto pt-4 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.12em]" style={{ color: 'var(--gold-light)' }}>
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
