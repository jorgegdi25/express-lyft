// Canonical jet ski pricing for the public /jetski checkout — mirrors the
// jet_ski half of WATERCRAFT_CATALOG in app/admin/page.tsx (Dennis's real
// price sheet). Kept separate rather than imported from the admin page
// because that file is a client component; this one is read server-side in
// app/api/leads/route.ts to price public bookings without trusting the
// amount the browser sends.
export const JETSKI_PACKAGES = {
  'Single Jet Ski': {
    machines: 1,
    durations: { '1 Hour': 150, '2 Hours': 300, 'Half Day (4 hrs)': 450, 'Full Day (8 hrs)': 800 },
  },
  'Double Jet Ski (2-seater)': {
    machines: 1,
    durations: { '1 Hour': 150, '2 Hours': 300, 'Half Day (4 hrs)': 450, 'Full Day (8 hrs)': 800 },
  },
  'Two Jet Skis (two machines)': {
    machines: 2,
    durations: { '2 Hours': 500, 'Half Day (4 hrs)': 800, 'Full Day (8 hrs)': 1200 },
  },
} as const

export type JetskiPackageName = keyof typeof JETSKI_PACKAGES

export function jetskiPackagePrice(pkg: string, duration: string): number | null {
  const p = JETSKI_PACKAGES[pkg as JetskiPackageName]
  if (!p) return null
  const price = (p.durations as Record<string, number>)[duration]
  return price ?? null
}

export function jetskiMachineCount(pkg: string): number {
  return JETSKI_PACKAGES[pkg as JetskiPackageName]?.machines ?? 1
}

export const JETSKI_TRANSPORT_PRICES = {
  none: 0,
  one_way: 10,
  round_trip: 20,
} as const

export type JetskiTransportOption = keyof typeof JETSKI_TRANSPORT_PRICES

export const JETSKI_MAX_MACHINES_PER_SLOT = 4
export const JETSKI_MEETING_ADDRESS = '919 N Birch Rd, Fort Lauderdale, FL 33304'

// Client requirement (27 ago 2026): online bookings need at least 2 hours'
// notice — a customer at 12:00 can't book the 1:00 slot, earliest is 2:00.
// Only enforced for public bookings; staff can still override for a phone
// call by using the admin "Add Reservation" flow.
export const JETSKI_MIN_NOTICE_MINUTES = 120

// Real UTC arithmetic (add minutes to the actual current instant), then
// formatted into the business's timezone — correct across a DST boundary,
// unlike doing the math on wall-clock strings directly.
export function nyNowPlusMinutes(minutes: number): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(Date.now() + minutes * 60000))
  const get = (t: string) => parts.find(p => p.type === t)?.value || '00'
  // hour12:false gives "24" for midnight instead of "00" in some engines —
  // normalize so the string still sorts correctly against slotSortKey.
  const hour = get('hour') === '24' ? '00' : get('hour')
  return `${get('year')}-${get('month')}-${get('day')} ${hour}:${get('minute')}`
}

// `date` is "YYYY-MM-DD" (already an NY-local calendar date — see
// todayNY() in the widget), `timeLabel` is "2:00 PM" — combined into the
// same "YYYY-MM-DD HH:mm" shape as nyNowPlusMinutes() so the two can be
// compared with a plain string comparison.
export function jetskiSlotSortKey(date: string, timeLabel: string): string {
  const m = timeLabel.match(/(\d+):(\d+)\s*(AM|PM)/i)
  if (!m) return `${date} 00:00`
  let hour = parseInt(m[1], 10)
  const minute = m[2]
  const ampm = m[3].toUpperCase()
  if (ampm === 'PM' && hour !== 12) hour += 12
  if (ampm === 'AM' && hour === 12) hour = 0
  return `${date} ${String(hour).padStart(2, '0')}:${minute}`
}
