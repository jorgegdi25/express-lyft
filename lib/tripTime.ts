// Shared by every cron job that needs to know "how many hours until this
// lead's pickup" — payment reminders (12h before) and pickup-instructions
// reminders (24h before) both need the exact same date/time math.

// Returns the UTC offset (in hours, negative) that America/New_York has on
// the given calendar date, so DST is handled correctly without adding a
// timezone library — trips are always Florida-local time.
export function getNYOffsetHours(dateStr: string): number {
  const probe = new Date(`${dateStr}T12:00:00Z`)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    timeZoneName: 'shortOffset',
  }).formatToParts(probe)
  const offsetPart = parts.find(p => p.type === 'timeZoneName')?.value || 'GMT-5'
  const match = offsetPart.match(/GMT([+-]\d+)/)
  return match ? parseInt(match[1], 10) : -5
}

// Combines a lead's separate date ("YYYY-MM-DD") and time fields — both
// stored as America/New_York wall-clock — into a real UTC Date. The time is
// usually "h:mm AM/PM", but manual entries also come in as "05pm", "5:30pm"
// "400 AM", or 24h "17:00"; anything unparseable returns null (and gets skipped).
export function leadPickupToUTC(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null
  const match = timeStr.trim().match(/^(\d{1,2})(?::?(\d{2}))?\s*([AaPp])?\.?\s*[Mm]?\.?$/)
  if (!match) return null
  let hours = parseInt(match[1], 10)
  const minutes = match[2] ? parseInt(match[2], 10) : 0
  const meridiem = match[3]?.toUpperCase()
  if (!meridiem && !match[2]) return null // a bare "5" is ambiguous
  if (hours > 23 || minutes > 59 || (meridiem && (hours < 1 || hours > 12))) return null
  if (meridiem === 'P' && hours < 12) hours += 12
  if (meridiem === 'A' && hours === 12) hours = 0

  const [year, month, day] = dateStr.split('-').map(Number)
  const offset = getNYOffsetHours(dateStr)
  return new Date(Date.UTC(year, month - 1, day, hours - offset, minutes))
}
