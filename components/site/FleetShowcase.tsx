'use client'

import { useId, useState, type KeyboardEvent } from 'react'
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
  const id = useId()
  const [active, setActive] = useState<FleetType>('suburban')
  const [photo, setPhoto] = useState(0)
  const v = FLEET.find((f) => f.type === active)!
  const photos = [
    { src: v.catalogImage, alt: v.catalogImageAlt, label: v.catalogImageLabel, catalog: true },
    ...(v.catalogGallery || []).map((g) => ({ ...g, catalog: true })),
    ...v.gallery.map((src) => ({ src, alt: `${v.name} — Express Lyft fleet gallery`, label: undefined, catalog: false })),
  ]
  const selectedPhoto = photos[photo] || photos[0]
  const photoSrc = selectedPhoto.src
  const catalogPhoto = selectedPhoto.catalog
  const price = prices[v.type]
  const light = tone === 'light'
  const ink = light ? 'var(--ink-dark)' : 'var(--text)'
  const muted = light ? 'var(--ink-dark-muted)' : 'var(--text-muted)'
  const line = light ? 'var(--sand-line)' : 'var(--border)'

  function selectVehicle(type: FleetType) {
    setActive(type)
    setPhoto(0)
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % FLEET.length
    else if (event.key === 'ArrowLeft') next = (index + FLEET.length - 1) % FLEET.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = FLEET.length - 1
    else return
    event.preventDefault()
    selectVehicle(FLEET[next].type)
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus()
  }

  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor={`${id}-select`} className="block mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: muted }}>Vehicle class</label>
        <select
          id={`${id}-select`}
          value={active}
          onChange={(event) => selectVehicle(event.target.value as FleetType)}
          aria-controls={`${id}-panel`}
          className="w-full min-h-12 rounded-xl px-4 py-3 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-light)]"
          style={{ background: light ? 'var(--sand)' : 'var(--surface)', color: ink, border: `1px solid ${line}` }}
        >
          {FLEET.map((f) => <option key={f.type} value={f.type}>{f.name}</option>)}
        </select>
      </div>
      <div role="tablist" aria-label="Vehicle classes" className="hidden sm:flex flex-wrap gap-2 pb-1">
        {FLEET.map((f, index) => {
          const on = f.type === active
          return (
            <button
              key={f.type}
              type="button"
              id={`${id}-tab-${f.type}`}
              role="tab"
              aria-selected={on}
              aria-controls={`${id}-panel`}
              tabIndex={on ? 0 : -1}
              onClick={() => selectVehicle(f.type)}
              onKeyDown={(event) => onTabKeyDown(event, index)}
              className="shrink-0 min-h-11 px-4 py-2.5 rounded-full text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-light)]"
              style={{
                background: on ? ink : 'transparent',
                color: on ? (light ? 'var(--sand)' : 'var(--bg-deep)') : ink,
                border: `1px solid ${on ? ink : line}`,
              }}
            >
              {f.name}
            </button>
          )
        })}
      </div>

      <div id={`${id}-panel`} aria-labelledby={`${id}-tab-${active}`} className="mt-6 grid lg:grid-cols-12 gap-6 lg:gap-10 items-stretch" role="tabpanel">
        <div className="min-w-0 lg:col-span-7">
          <div className="relative aspect-[3/2] rounded-2xl overflow-hidden" style={{ background: catalogPhoto ? '#E9E6E0' : 'var(--surface)' }}>
            <Image
              key={photoSrc}
              src={photoSrc}
              alt={selectedPhoto.alt}
              fill
              sizes="(min-width:1280px) 710px, (min-width:1024px) 58vw, calc(100vw - 32px)"
              className={`${catalogPhoto ? 'object-contain' : 'object-cover'} animate-[fadein_.5s_ease] motion-reduce:animate-none`}
            />
          </div>
          {photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto p-1 -mx-1">
              {photos.map((g, i) => (
                <button
                  key={g.src}
                  type="button"
                  onClick={() => setPhoto(i)}
                  aria-label={`Photo ${i + 1} of ${v.name}${g.label ? `: ${g.label}` : ''}`}
                  aria-pressed={i === photo}
                  className="relative shrink-0 w-20 h-14 rounded-lg overflow-hidden transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold-light)]"
                  style={{ opacity: i === photo ? 1 : 0.55, boxShadow: i === photo ? '0 0 0 2px var(--gold)' : undefined }}
                >
                  <Image src={g.src} alt="" fill sizes="80px" className={g.catalog ? 'object-contain' : 'object-cover'} />
                </button>
              ))}
            </div>
          )}
          {selectedPhoto.label && <p className="mt-3 text-sm font-semibold" style={{ color: ink }}>{selectedPhoto.label}</p>}
          <p className="mt-3 text-xs" style={{ color: muted }}>Vehicle images are illustrative.</p>
        </div>

        <div className="min-w-0 lg:col-span-5 flex flex-col">
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
              style={{ background: 'var(--brand-gold-gradient)', color: 'var(--button-ink)' }}
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
