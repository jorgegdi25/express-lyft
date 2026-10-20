// Shared by every calendar UI on the site (admin filters, admin forms, and
// the public booking forms) so the "YYYY-MM-DD in, US format out" and
// "6-week month grid" logic only lives in one place.

export function formatDateUS(dateStr: string | undefined | null) {
  if (!dateStr) return '—'
  if (dateStr.includes('T')) { // ISO Timestamp
    const d = new Date(dateStr)
    return `${String(d.getUTCMonth() + 1).padStart(2, '0')}/${String(d.getUTCDate()).padStart(2, '0')}/${d.getUTCFullYear()}`
  }
  if (dateStr.includes('-')) { // YYYY-MM-DD
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[1]}/${parts[2]}/${parts[0]}`
  }
  return dateStr
}

// Converts a free-text "7:30 PM" / "10:00 AM" time (as typed into the
// booking form or CRM) into minutes-since-midnight, for sorting a day's
// reservations chronologically instead of by whatever order they happen to
// be in (e.g. creation order). Unparseable/missing values sort to the end
// rather than crashing the sort or landing at the top.
export function timeStringToMinutes(time: string | undefined | null): number {
  if (!time) return Infinity
  // Same formats as leadPickupToUTC: "10:00 AM", "05pm", "400 AM", "17:00".
  const match = time.trim().match(/^(\d{1,2})(?::?(\d{2}))?\s*([AaPp])?\.?\s*[Mm]?\.?$/)
  if (!match) return Infinity
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const meridiem = match[3]?.toUpperCase()
  if (!meridiem && !match[2]) return Infinity
  let hours = parseInt(match[1], 10)
  if (meridiem) hours = (hours % 12) + (meridiem === 'P' ? 12 : 0)
  return hours * 60 + minutes
}

// Builds a 6-week, Sunday-start grid for the given month so the calendar
// view always shows a fixed 42-cell layout (same shape every month).
export function getMonthGridDays(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay())
  const days: { date: Date; dateStr: string; inMonth: boolean }[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    days.push({ date: d, dateStr, inMonth: d.getMonth() === month })
  }
  return days
}

// Minutes since midnight → "h:mm AM/PM", the canonical format every trip
// time is stored in.
export function minutesToTimeString(total: number): string {
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
}

// Rewrites a hand-typed time ("05pm", "400 AM", "17:00") into "h:mm AM/PM";
// anything it can't read comes back unchanged so nothing is silently lost.
export function normalizeTimeString(time: string | null | undefined): string {
  const mins = timeStringToMinutes(time)
  return Number.isFinite(mins) ? minutesToTimeString(mins) : (time || '')
}

// Every 15 minutes, round the clock — the admin CRM books 4 AM cruise and
// airport runs the public forms' 5 AM–11:30 PM list doesn't offer.
export const ADMIN_TIME_SLOTS: string[] = Array.from({ length: 96 }, (_, i) => minutesToTimeString(i * 15))
