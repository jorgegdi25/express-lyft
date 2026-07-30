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
