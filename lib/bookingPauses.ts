// Booking pauses (28 oct 2026): staff pause online bookings for a time
// window from the CRM when they're saturated (e.g. Oct 30, 9–10 AM). Only
// the pickup time (and a round trip's return time) is checked — a ride that
// starts before the window isn't blocked. Admin "Add Reservation" entries
// are never blocked. Shared by the public forms, the CRM and /api/leads.

export type BookingPauseService = 'transport' | 'jet_ski' | 'all'

export interface BookingPause {
  id: string
  service_type: BookingPauseService
  // Miami wall-clock, normalized to "YYYY-MM-DD HH:mm" (same shape as
  // jetskiSlotSortKey / nyNowPlusMinutes so plain string compares work).
  start_at: string
  end_at: string
  reason?: string | null
}

// Postgres `timestamp` comes back as "2026-10-30T09:00:00" — trim to minutes.
export function normalizePauseTimestamp(value: string): string {
  return String(value || '').replace('T', ' ').slice(0, 16)
}

// "9:30 AM" -> "09:30"; null when the label isn't a time.
function timeLabelTo24h(timeLabel: string): string | null {
  const m = String(timeLabel || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i)
  if (!m) return null
  let hour = parseInt(m[1], 10)
  const ampm = m[3].toUpperCase()
  if (ampm === 'PM' && hour !== 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0
  return `${String(hour).padStart(2, '0')}:${m[2]}`
}

// The pause that covers this pickup (window is [start, end)), or null.
export function findPauseFor(
  pauses: BookingPause[],
  service: 'transport' | 'jet_ski',
  date: string,
  timeLabel: string
): BookingPause | null {
  if (!date || !timeLabel) return null
  const hhmm = timeLabelTo24h(timeLabel)
  if (!hhmm) return null
  const key = `${date} ${hhmm}`
  return pauses.find(p =>
    (p.service_type === 'all' || p.service_type === service) &&
    key >= normalizePauseTimestamp(p.start_at) &&
    key < normalizePauseTimestamp(p.end_at)
  ) || null
}

// "2026-10-30 09:00" -> "Oct 30, 9:00 AM"
export function formatPauseMoment(value: string): string {
  const [d, t] = normalizePauseTimestamp(value).split(' ')
  const [y, mo, da] = d.split('-').map(Number)
  const [h, mi] = (t || '00:00').split(':').map(Number)
  const month = new Date(y, mo - 1, da).toLocaleString('en-US', { month: 'short' })
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${month} ${da}, ${h12}:${String(mi).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

export function formatPauseRange(p: Pick<BookingPause, 'start_at' | 'end_at'>): string {
  const start = formatPauseMoment(p.start_at)
  const end = formatPauseMoment(p.end_at)
  const sameDay = normalizePauseTimestamp(p.start_at).slice(0, 10) === normalizePauseTimestamp(p.end_at).slice(0, 10)
  return sameDay ? `${start} – ${end.split(', ')[1]}` : `${start} – ${end}`
}

export const PAUSED_SLOT_MESSAGE = 'Online booking is paused for that time. Please call or WhatsApp us and we’ll do our best to fit you in.'
