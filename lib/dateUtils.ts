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
  const match = time.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return Infinity
  let hours = parseInt(match[1], 10) % 12
  if (/pm/i.test(match[3])) hours += 12
  return hours * 60 + parseInt(match[2], 10)
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
