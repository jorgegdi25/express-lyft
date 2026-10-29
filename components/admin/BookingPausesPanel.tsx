'use client'

import { useCallback, useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { ADMIN_TIME_SLOTS, timeStringToMinutes } from '@/lib/dateUtils'
import { formatPauseRange, type BookingPause, type BookingPauseService } from '@/lib/bookingPauses'
import { nyNowPlusMinutes } from '@/lib/jetskiPricing'

// CRM "Availability" tab: pause online bookings for a time window (e.g.
// Oct 30, 9–10 AM) when the team is saturated. The public forms grey out
// those pickup times and /api/leads rejects them; manual CRM reservations
// are never blocked.

const SERVICE_LABELS: Record<BookingPauseService, string> = {
  all: 'All services',
  transport: 'Transportation',
  jet_ski: 'Jet Ski',
}

const INPUT = 'rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2.5 text-white outline-none focus:border-[var(--gold)]'

// "9:30 AM" -> "09:30"
function to24h(label: string): string {
  const mins = timeStringToMinutes(label)
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
}

export default function BookingPausesPanel({
  password,
  notify,
  confirm,
}: {
  password: string
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  confirm: (message: string, options?: { danger?: boolean }) => Promise<boolean>
}) {
  const today = nyNowPlusMinutes(0).slice(0, 10)
  const [pauses, setPauses] = useState<(BookingPause & { reason?: string | null })[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [service, setService] = useState<BookingPauseService>('all')
  const [startDate, setStartDate] = useState(today)
  const [startTime, setStartTime] = useState('9:00 AM')
  const [endDate, setEndDate] = useState(today)
  const [endTime, setEndTime] = useState('10:00 AM')
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/booking-pauses', { headers: { authorization: `Bearer ${password}` }, cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not load pauses')
      setPauses(data)
    } catch (err: any) {
      notify(err.message || 'Could not load pauses', 'error')
    } finally {
      setLoading(false)
    }
  }, [password, notify])

  useEffect(() => { load() }, [load])

  const startKey = `${startDate} ${to24h(startTime)}`
  const endKey = `${endDate} ${to24h(endTime)}`
  const rangeInvalid = !startDate || !endDate || endKey <= startKey

  const create = async () => {
    if (rangeInvalid) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/booking-pauses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
        body: JSON.stringify({ service_type: service, start_at: startKey, end_at: endKey, reason }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not create pause')
      notify(`Online bookings paused: ${formatPauseRange({ start_at: startKey, end_at: endKey })}`, 'success')
      setReason('')
      load()
    } catch (err: any) {
      notify(err.message || 'Could not create pause', 'error')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (p: BookingPause) => {
    if (!(await confirm(`Remove the pause for ${formatPauseRange(p)}? Online bookings reopen for that window right away.`, { danger: true }))) return
    const res = await fetch(`/api/admin/booking-pauses?id=${p.id}`, { method: 'DELETE', headers: { authorization: `Bearer ${password}` } })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      notify(data.error || 'Could not remove pause', 'error')
      return
    }
    setPauses(prev => prev.filter(x => x.id !== p.id))
    notify('Pause removed', 'success')
  }

  const now = nyNowPlusMinutes(0)
  const upcoming = pauses.filter(p => p.end_at > now)
  const past = pauses.filter(p => p.end_at <= now).reverse()

  const renderRow = (p: BookingPause & { reason?: string | null }, isPast: boolean) => {
    const active = p.start_at <= now && p.end_at > now
    return (
      <tr key={p.id} style={{ borderTop: '1px solid var(--surface)', opacity: isPast ? 0.55 : 1 }}>
        <td className="py-3 pr-4 font-semibold text-white whitespace-nowrap">
          {formatPauseRange(p)}
          {active && <span className="ml-2 text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'rgba(248,113,113,0.15)', color: '#f87171' }}>Active now</span>}
        </td>
        <td className="py-3 pr-4" style={{ color: 'var(--text-dim)' }}>{SERVICE_LABELS[p.service_type] || p.service_type}</td>
        <td className="py-3 pr-4" style={{ color: 'var(--text-muted)' }}>{p.reason || '—'}</td>
        <td className="py-3 text-right">
          {!isPast && <Button size="sm" variant="danger" onClick={() => remove(p)}>Remove</Button>}
        </td>
      </tr>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Availability / Pauses</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Stop online bookings for a time window when the team is fully booked. Guests can’t pick a pickup (or round-trip return) time inside the window on the main site, hotel pages or /jetski, and are asked to call or WhatsApp instead. Reservations you add here in the CRM are never blocked. Times are Miami time.
        </p>
      </div>

      <section className="rounded-xl p-6 flex flex-col gap-4" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
        <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: 'var(--gold-light)' }}>New pause</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-3">
          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Service
            <select value={service} onChange={e => setService(e.target.value as BookingPauseService)} className={INPUT}>
              {(Object.keys(SERVICE_LABELS) as BookingPauseService[]).map(s => <option key={s} value={s}>{SERVICE_LABELS[s]}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            From date
            <input type="date" value={startDate} min={today} onChange={e => { const v = e.target.value; setStartDate(v); if (!endDate || endDate < v) setEndDate(v) }} className={INPUT} />
          </label>
          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            From time
            <select value={startTime} onChange={e => setStartTime(e.target.value)} className={INPUT}>
              {ADMIN_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Until date
            <input type="date" value={endDate} min={startDate || today} onChange={e => setEndDate(e.target.value)} className={INPUT} />
          </label>
          <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Until time
            <select value={endTime} onChange={e => setEndTime(e.target.value)} className={INPUT}>
              {ADMIN_TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
          Reason (internal, optional)
          <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Fully booked — all drivers out" className={INPUT} />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={create} disabled={saving || rangeInvalid}>{saving ? 'Saving…' : 'Pause bookings'}</Button>
          <span className="text-xs" style={{ color: rangeInvalid ? '#f87171' : 'var(--text-muted)' }}>
            {rangeInvalid ? 'The end must be after the start.' : `Blocks pickups from ${formatPauseRange({ start_at: startKey, end_at: endKey })} (the end time itself stays open).`}
          </span>
        </div>
      </section>

      <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
        <h2 className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-light)' }}>Upcoming & active</h2>
        {loading ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No pauses scheduled — online booking is open at all times.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr style={{ color: 'var(--text-muted)' }}>
                  <th className="py-2 pr-4 text-xs uppercase tracking-widest">Window</th>
                  <th className="py-2 pr-4 text-xs uppercase tracking-widest">Service</th>
                  <th className="py-2 pr-4 text-xs uppercase tracking-widest">Reason</th>
                  <th className="py-2 text-xs uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody>{upcoming.map(p => renderRow(p, false))}</tbody>
            </table>
          </div>
        )}
        {past.length > 0 && (
          <>
            <h3 className="text-xs font-bold uppercase tracking-widest mt-6 mb-2" style={{ color: 'var(--text-muted)' }}>Ended (last 14 days)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left"><tbody>{past.map(p => renderRow(p, true))}</tbody></table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
