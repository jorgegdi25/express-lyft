'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FLEET, type FleetType } from '@/lib/site/fleet'
import type { StartingPrices } from '@/lib/site/data'
import { Arrow } from './ui'

function PeopleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5" /><path d="M16 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c1.9.7 3.1 2.4 3.5 5.2" />
    </svg>
  )
}
function BagIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
      <rect x="5" y="7" width="14" height="13" rx="2" /><path d="M9 7V4.5h6V7M9 20v1.5M15 20v1.5" />
    </svg>
  )
}

// Tabbed vehicle selector on the sand surface. Picking a vehicle and
// pressing "Book this vehicle" opens /book with that vehicle preselected.
export default function FleetShowcase({ prices, tone = 'light' }: { prices: StartingPrices; tone?: 'light' | 'dark' }) {
  const [active, setActive] = useState<FleetType>('suburban')
  const [photo, setPhoto] = useState(0)
  const v = FLEET.find((f) => f.type === active)!
  const price = prices[v.type]
  const light = tone === 'light'
  const ink = light ? 'var(--ink-dark)' : 'var(--text)'
  const muted = light ? 'var(--ink-dark-muted)' : 'var(--text-muted)'
  const line = light ? 'var(--sand-line)' : 'var(--border)'

  return (
    <div>
      <div role="tablist" aria-label="Vehicle classes" className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 pb-1">
        {FLEET.map((f) => {
          const on = f.type === active
          return (
            <button
              key={f.type}
              role="tab"
              aria-selected={on}
              onClick={() => { setActive(f.type); setPhoto(0) }}
              className="shrink-0 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors"
              style={{
                background: on ? ink : 'transparent',
                color: on ? '#000' : ink,
                border: `1px solid ${on ? ink : line}`,
              }}
            >
              {f.name}
            </button>
          )
        })}
      </div>

      <div className="mt-6 grid lg:grid-cols-12 gap-6 lg:gap-10 items-stretch" role="tabpanel">
        <div className="lg:col-span-7">
          <div className="relative aspect-[16/10] rounded-2xl overflow-hidden" style={{ background: light ? 'var(--sand-deep)' : 'var(--surface)' }}>
            <Image
              key={v.gallery[photo]}
              src={v.gallery[photo]}
              alt={`${v.name} — Express Lyft fleet`}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="object-cover animate-[fadein_.5s_ease]"
            />
          </div>
          {v.gallery.length > 1 && (
            <div className="mt-3 flex gap-2">
              {v.gallery.map((g, i) => (
                <button
                  key={g}
                  onClick={() => setPhoto(i)}
                  aria-label={`Photo ${i + 1} of ${v.name}`}
                  className="relative w-20 h-14 rounded-lg overflow-hidden transition-opacity"
                  style={{ opacity: i === photo ? 1 : 0.55, outline: i === photo ? '2px solid var(--gold)' : 'none', outlineOffset: 2 }}
                >
                  <Image src={g} alt="" fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-5 flex flex-col">
          <p className="text-[11px] font-bold uppercase tracking-[3px]" style={{ color: light ? 'var(--gold-light)' : 'var(--gold)' }}>{v.category}</p>
          <h3 className="font-display text-3xl md:text-4xl font-semibold mt-2" style={{ color: ink }}>{v.name}</h3>
          <p className="mt-3 text-base leading-relaxed" style={{ color: muted }}>{v.description}</p>

          <dl className="mt-6 grid grid-cols-2 gap-px rounded-xl overflow-hidden" style={{ background: line, border: `1px solid ${line}` }}>
            {[
              { k: 'Passengers', v: `Up to ${v.passengers}`, icon: <PeopleIcon /> },
              { k: 'Luggage', v: `Up to ${v.luggage} bags`, icon: <BagIcon /> },
            ].map((s) => (
              <div key={s.k} className="p-4" style={{ background: light ? 'var(--sand)' : 'var(--surface-raised)' }}>
                <dt className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em]" style={{ color: muted }}>{s.icon}{s.k}</dt>
                <dd className="mt-1 text-lg font-semibold" style={{ color: ink }}>{s.v}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-5 text-sm" style={{ color: muted }}>
            <span className="font-semibold" style={{ color: ink }}>Best for: </span>{v.bestFor}
          </p>

          <div className="mt-auto pt-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em]" style={{ color: muted }}>{v.quoteOnly ? 'Rate' : 'Starting at'}</p>
              <p className="font-display text-4xl font-semibold" style={{ color: ink }}>
                {v.quoteOnly || !price ? 'Custom quote' : `$${price}`}
              </p>
            </div>
            <Link
              href={`/book?vehicle=${v.type}&pax=${Math.min(v.passengers, v.type === 'sedan_suv' ? 2 : v.passengers)}`}
              className="inline-flex items-center gap-2 px-6 py-4 rounded-xl text-[14px] font-semibold hover:brightness-110 transition"
              style={{ background: 'var(--brand-gold-gradient)', color: 'var(--bg-deep)' }}
            >
              {v.quoteOnly ? 'Request a quote' : 'Book this vehicle'} <Arrow />
            </Link>
          </div>
          <p className="mt-3 text-xs" style={{ color: muted }}>
            Starting rates. Final price depends on route, time and availability.
          </p>
        </div>
      </div>
    </div>
  )
}
