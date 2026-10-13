'use client'

import { useEffect, useState } from 'react'
import { calculateTierAmount, normalizeMileTiers, type MileTier, type MileTierConfig } from '@/lib/pricing'

// CRM editor for the corporate site's mileage-tier pricing: per vehicle, a
// list of "up to X miles → $Y" rows plus a rate per extra mile past the last
// row. Guests only see the resulting price, never the miles or the tiers.

type Row = { up_to: string; price: string }
type Draft = { enabled: boolean; rows: Row[]; extra: string }

const STARTER_ROWS: Row[] = [
  { up_to: '30', price: '30' },
  { up_to: '60', price: '60' },
  { up_to: '90', price: '90' },
]

function toDraft(config: unknown): Draft {
  const c = normalizeMileTiers(config)
  if (!c || c.tiers.length === 0) return { enabled: false, rows: STARTER_ROWS, extra: '1' }
  return {
    enabled: c.enabled,
    rows: c.tiers.map((t) => ({ up_to: String(t.up_to), price: String(t.price) })),
    extra: String(c.extra_per_mile),
  }
}

function toConfig(d: Draft): MileTierConfig {
  const tiers: MileTier[] = d.rows.map((r) => ({ up_to: Number(r.up_to), price: Number(r.price) }))
  return normalizeMileTiers({ enabled: d.enabled, tiers, extra_per_mile: Number(d.extra) }) || { enabled: false, tiers: [], extra_per_mile: 0 }
}

const VEHICLE_ORDER = ['sedan_suv', 'suburban', 'sprinter', 'minibus', 'coachbus']
const byVehicleOrder = (a: { vehicle_type: string }, b: { vehicle_type: string }) =>
  (VEHICLE_ORDER.indexOf(a.vehicle_type) + 1 || 99) - (VEHICLE_ORDER.indexOf(b.vehicle_type) + 1 || 99)

const INPUT = 'w-20 rounded-lg px-2.5 py-1.5 text-sm text-right bg-[var(--surface-raised)] border border-[var(--border)] focus:border-[var(--gold)] outline-none text-white'

export default function MileTierEditor({
  password,
  vehicles,
  labels,
  onSaved,
  notify,
}: {
  password: string
  vehicles: { vehicle_type: string; mile_tiers?: unknown }[]
  labels: Record<string, string>
  onSaved: () => void
  notify: (message: string, type?: 'success' | 'error') => void
}) {
  const [drafts, setDrafts] = useState<Record<string, Draft>>({})
  const [testMiles, setTestMiles] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    setDrafts(Object.fromEntries(vehicles.map((v) => [v.vehicle_type, toDraft(v.mile_tiers)])))
  }, [vehicles])

  function update(type: string, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [type]: { ...prev[type], ...patch } }))
  }

  function updateRow(type: string, i: number, patch: Partial<Row>) {
    const rows = drafts[type].rows.map((r, j) => (j === i ? { ...r, ...patch } : r))
    update(type, { rows })
  }

  function addRow(type: string) {
    const rows = drafts[type].rows
    const last = rows[rows.length - 1]
    const step = 30
    update(type, {
      rows: [...rows, { up_to: String((Number(last?.up_to) || 0) + step), price: String((Number(last?.price) || 0) + step) }],
    })
  }

  async function save(type: string) {
    const config = toConfig(drafts[type])
    if (drafts[type].enabled && config.tiers.length === 0) {
      notify('Add at least one tier with miles and a price before turning tiers on.', 'error')
      return
    }
    setSaving(type)
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
        body: JSON.stringify({ vehicle_type: type, mile_tiers: config }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => null))?.error || 'Could not save the tiers')
      notify(`${labels[type] || type}: mileage pricing saved`, 'success')
      onSaved()
    } catch (e: any) {
      notify(e.message, 'error')
    }
    setSaving(null)
  }

  return (
    <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
      <div className="mb-5">
        <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Website Mileage Pricing</h2>
        <p className="text-xs mt-1 max-w-2xl" style={{ color: 'var(--text-muted)' }}>
          Prices for the booking form on the main website, by trip distance. Guests only see the final price — never the miles or these tiers.
          When a vehicle&apos;s tiers are off, it uses the per-mile formula above. Prices are before tax; the time-of-day surcharge and
          Meet &amp; Greet are added on top. Hotel pages are not affected.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[...vehicles].sort(byVehicleOrder).map(({ vehicle_type: type }) => {
          const d = drafts[type]
          if (!d) return null
          const config = toConfig(d)
          const lastUpTo = config.tiers[config.tiers.length - 1]?.up_to
          const miles = Number(testMiles[type])
          const preview = Number.isFinite(miles) && miles > 0 ? calculateTierAmount({ ...config, enabled: true }, miles) : null

          return (
            <div key={type} className="rounded-xl p-4" style={{ background: 'var(--surface-raised)', border: `1px solid ${d.enabled ? 'var(--gold)' : 'var(--border)'}` }}>
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="font-semibold text-white">{labels[type] || type}</p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={d.enabled}
                  onClick={() => update(type, { enabled: !d.enabled })}
                  className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                  style={{ color: d.enabled ? 'var(--gold)' : 'var(--text-muted)' }}
                >
                  <span className="relative w-9 h-5 rounded-full transition-colors" style={{ background: d.enabled ? 'var(--gold)' : 'var(--border-soft)' }}>
                    <span className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all" style={{ left: d.enabled ? 18 : 2 }} />
                  </span>
                  {d.enabled ? 'Tiers on' : 'Tiers off'}
                </button>
              </div>

              <div className={`flex flex-col gap-2 ${d.enabled ? '' : 'opacity-60'}`}>
                {d.rows.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-subtle)' }}>
                    <span className="w-14">Up to</span>
                    <input type="number" min={1} className={INPUT} value={r.up_to} onChange={(e) => updateRow(type, i, { up_to: e.target.value })} aria-label="Up to miles" />
                    <span>miles</span>
                    <span className="mx-1" style={{ color: 'var(--gold)' }}>→</span>
                    <span>$</span>
                    <input type="number" min={0} className={INPUT} value={r.price} onChange={(e) => updateRow(type, i, { price: e.target.value })} aria-label="Price" />
                    <button
                      type="button"
                      onClick={() => update(type, { rows: d.rows.filter((_, j) => j !== i) })}
                      className="ml-auto text-xs hover:text-white"
                      style={{ color: 'var(--text-muted)' }}
                      aria-label="Remove tier"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => addRow(type)} className="self-start text-xs font-semibold mt-1 hover:text-white" style={{ color: 'var(--gold)' }}>
                  + Add tier
                </button>

                <div className="flex flex-wrap items-center gap-2 text-sm mt-2 pt-3" style={{ color: 'var(--text-subtle)', borderTop: '1px solid var(--border)' }}>
                  <span>Over {lastUpTo ?? '—'} miles: add $</span>
                  <input type="number" min={0} step="0.05" className={INPUT} value={d.extra} onChange={(e) => update(type, { extra: e.target.value })} aria-label="Price per extra mile" />
                  <span>per extra mile</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                  Try a trip of
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    className={INPUT}
                    value={testMiles[type] ?? ''}
                    onChange={(e) => setTestMiles((prev) => ({ ...prev, [type]: e.target.value }))}
                    placeholder="miles"
                  />
                  miles
                </label>
                <span className="text-sm font-semibold text-white">{preview !== null ? `= $${preview}` : ''}</span>
                <button
                  type="button"
                  onClick={() => save(type)}
                  disabled={saving === type}
                  className="ml-auto px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                >
                  {saving === type ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
