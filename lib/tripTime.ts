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

// Combines a lead's separate date ("YYYY-MM-DD") and time ("h:mm AM/PM")
// fields — both stored as America/New_York wall-clock — into a real UTC Date.
export function leadPickupToUTC(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null
  const [time, ampm] = timeStr.split(' ')
  if (!time || !ampm) return null
  let [hours, minutes] = time.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  if (ampm === 'PM' && hours < 12) hours += 12
  if (ampm === 'AM' && hours === 12) hours = 0

  const [year, month, day] = dateStr.split('-').map(Number)
  const offset = getNYOffsetHours(dateStr)
  return new Date(Date.UTC(year, month - 1, day, hours - offset, minutes))
}
