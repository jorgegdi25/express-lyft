'use client'

import React, { useMemo, useState } from 'react'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

// TODO: replace with the real jet ski business phone/WhatsApp number once
// the client provides one — this currently reuses the main Express Lyft line.
const WHATSAPP_NUMBER = '19546236207'

// From the client's real price sheet. Boats/yacht charters are on the same
// sheet but out of scope here unless the client asks to expand beyond jet
// skis. Two Jet Skis (two separate machines) has no 1-hour option on the
// sheet — only 2hr/half-day/full-day — so it's left out of that type's price map.
type JetskiType = 'single' | 'double' | 'two_machines'
type Duration = '1hr' | '2hr' | 'half_day' | 'full_day'

const JETSKI_TYPES: { value: JetskiType; label: string; note: string; machines: number }[] = [
  { value: 'single', label: 'Single Jet Ski', note: '1 rider', machines: 1 },
  { value: 'double', label: 'Double Jet Ski', note: '2-seater — 2 riders, 1 machine', machines: 1 },
  { value: 'two_machines', label: 'Two Jet Skis', note: '2 separate machines', machines: 2 },
]

const DURATIONS: { value: Duration; label: string }[] = [
  { value: '1hr', label: '1 Hour' },
  { value: '2hr', label: '2 Hours' },
  { value: 'half_day', label: 'Half Day (4 hrs)' },
  { value: 'full_day', label: 'Full Day (8 hrs)' },
]

const RENTAL_PRICING: Record<JetskiType, Partial<Record<Duration, number>>> = {
  single: { '1hr': 150, '2hr': 300, half_day: 450, full_day: 800 },
  double: { '1hr': 150, '2hr': 300, half_day: 450, full_day: 800 },
  two_machines: { '2hr': 500, half_day: 800, full_day: 1200 },
}

const TRANSPORT_ONE_WAY = 10
const TRANSPORT_ROUND_TRIP = 20
const MAX_MACHINES_PER_SLOT = 4

// Florida law: boaters/PWC renters born on or after Jan 1, 1988 must pass
// this test before riding. Link includes the client's affiliate/tracking id
// (mcid) — keep it as given, don't strip it.
const COURSE_INFO_URL = 'https://boattests101.com/united-states/florida/florida-rental?mcid=fhrkkTjV'
const COURSE_PRICE = 13.95
const COURSE_CUTOFF_YEAR = 1988

type TransportOption = 'none' | 'one_way' | 'round_trip'
type BornAfterCutoff = 'yes' | 'no' | null

const LABEL_CLASS = 'text-sm font-semibold mb-2 block'
const LABEL_COLOR = { color: '#BBBBBB' }
const INPUT_CLASS = 'w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors'
const INPUT_STYLE = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff' }
const CARD_STYLE = { background: '#161616', border: '1px solid #2a2a2a' }

function todayNY(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

export default function JetskiBookingWidget({ timeSlots, meetingAddress }: { timeSlots: string[]; meetingAddress: string }) {
  const [date, setDate] = useState(todayNY())
  const [timeSlot, setTimeSlot] = useState(timeSlots[0])
  const [jetskiType, setJetskiType] = useState<JetskiType>('single')
  const availableDurations = DURATIONS.filter(d => RENTAL_PRICING[jetskiType][d.value] !== undefined)
  const [duration, setDuration] = useState<Duration>('1hr')
  const [transport, setTransport] = useState<TransportOption>('none')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [bornAfterCutoff, setBornAfterCutoff] = useState<BornAfterCutoff>(null)
  const [courseAck, setCourseAck] = useState(false)

  function selectJetskiType(type: JetskiType) {
    setJetskiType(type)
    const stillValid = DURATIONS.filter(d => RENTAL_PRICING[type][d.value] !== undefined)
    if (!stillValid.some(d => d.value === duration)) setDuration(stillValid[0].value)
  }

  const machinesUsed = JETSKI_TYPES.find(t => t.value === jetskiType)!.machines
  const transportCost = transport === 'one_way' ? TRANSPORT_ONE_WAY : transport === 'round_trip' ? TRANSPORT_ROUND_TRIP : 0
  const rentalCost = RENTAL_PRICING[jetskiType][duration] ?? 0
  const total = rentalCost + transportCost

  const courseRequired = bornAfterCutoff === 'yes'
  const canSubmit = Boolean(name.trim() && email.trim() && phone && bornAfterCutoff && (!courseRequired || courseAck))

  const jetskiTypeLabel = JETSKI_TYPES.find(t => t.value === jetskiType)!.label
  const durationLabel = DURATIONS.find(d => d.value === duration)!.label

  const whatsappUrl = useMemo(() => {
    const lines = [
      `Hi! I'd like to reserve a jet ski.`,
      `Date: ${date}`,
      `Start time: ${timeSlot}`,
      `Rental: ${jetskiTypeLabel} — ${durationLabel}`,
      `Transport: ${transport === 'none' ? 'None' : transport === 'one_way' ? 'One-way ($10)' : 'Round trip ($20)'}`,
      `Estimated total: $${total}`,
      `Driver born ${COURSE_CUTOFF_YEAR}+: ${bornAfterCutoff === 'yes' ? 'Yes — will complete boater safety course' : 'No'}`,
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Meeting address: ${meetingAddress}`,
    ]
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`
  }, [date, timeSlot, jetskiTypeLabel, durationLabel, transport, total, bornAfterCutoff, name, email, phone, meetingAddress])

  return (
    <div className="flex flex-col gap-6">
      {/* ── Age requirements — must be seen before booking, not buried ── */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(184,150,12,0.1)', border: '1px solid rgba(184,150,12,0.4)' }}>
        <p className="text-sm font-bold mb-2" style={{ color: '#D4AF37' }}>Age requirements — Florida law</p>
        <ul className="text-sm text-white leading-relaxed list-disc pl-5 space-y-1">
          <li>You must be <strong>at least 18</strong> to rent a jet ski.</li>
          <li>Whoever is driving must be <strong>at least 14</strong>.</li>
          <li>Drivers born on or after January 1, {COURSE_CUTOFF_YEAR} must also pass a <strong>${COURSE_PRICE.toFixed(2)} boater safety test</strong> (details below).</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.3fr_1fr] gap-6">
      {/* ── Left: booking details ─────────────────────────── */}
      <div className="flex flex-col gap-5">
        <div>
          <label className={LABEL_CLASS} style={LABEL_COLOR}>Date</label>
          <input
            type="date"
            min={todayNY()}
            value={date}
            onChange={e => setDate(e.target.value)}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        <div>
          <label className={LABEL_CLASS} style={LABEL_COLOR}>Time Slot</label>
          <div className="flex flex-wrap gap-2">
            {timeSlots.map(slot => (
              <button
                key={slot}
                type="button"
                onClick={() => setTimeSlot(slot)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={
                  timeSlot === slot
                    ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }
                    : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }
                }
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS} style={LABEL_COLOR}>Jet Ski Type</label>
          <div className="flex flex-col gap-2">
            {JETSKI_TYPES.map(t => (
              <label
                key={t.value}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
                style={jetskiType === t.value ? { background: 'rgba(184,150,12,0.08)', border: '1px solid rgba(184,150,12,0.4)' } : { background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <span className="flex items-center gap-3">
                  <input type="radio" name="jetskiType" checked={jetskiType === t.value} onChange={() => selectJetskiType(t.value)} />
                  <span>
                    <span className="block text-sm text-white">{t.label}</span>
                    <span className="block text-xs text-[#888]">{t.note}</span>
                  </span>
                </span>
              </label>
            ))}
          </div>
          {machinesUsed >= MAX_MACHINES_PER_SLOT && (
            <p className="text-xs mt-2" style={{ color: '#D4AF37' }}>
              This uses {machinesUsed} of the {MAX_MACHINES_PER_SLOT} machines available in this hour. For a bigger group, call us directly and we&apos;ll check availability.
            </p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS} style={LABEL_COLOR}>Duration</label>
          <div className="flex flex-wrap gap-2">
            {availableDurations.map(d => (
              <button
                key={d.value}
                type="button"
                onClick={() => setDuration(d.value)}
                className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                style={
                  duration === d.value
                    ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }
                    : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }
                }
              >
                {d.label}
              </button>
            ))}
          </div>
          {duration !== '1hr' && (
            <p className="text-xs mt-2 text-[#888]">
              Your start time is the {timeSlot} slot — we&apos;ll confirm your exact return time when we get your request.
            </p>
          )}
        </div>

        <div>
          <label className={LABEL_CLASS} style={LABEL_COLOR}>Transportation</label>
          <div className="flex flex-col gap-2">
            {([
              { value: 'none', label: 'No transportation needed', price: null },
              { value: 'one_way', label: 'One-way ride to the marina', price: TRANSPORT_ONE_WAY },
              { value: 'round_trip', label: 'Round trip (there and back)', price: TRANSPORT_ROUND_TRIP },
            ] as const).map(opt => (
              <label
                key={opt.value}
                className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer"
                style={transport === opt.value ? { background: 'rgba(184,150,12,0.08)', border: '1px solid rgba(184,150,12,0.4)' } : { background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="transport"
                    checked={transport === opt.value}
                    onChange={() => setTransport(opt.value)}
                  />
                  <span className="text-sm text-white">{opt.label}</span>
                </span>
                {opt.price !== null && <span className="text-sm font-semibold" style={{ color: '#D4AF37' }}>${opt.price}</span>}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS} style={LABEL_COLOR}>Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="Jane Doe" />
          </div>
          <div>
            <label className={LABEL_CLASS} style={LABEL_COLOR}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={INPUT_CLASS} style={INPUT_STYLE} placeholder="jane@email.com" />
          </div>
        </div>
        <div>
          <label className={LABEL_CLASS} style={LABEL_COLOR}>Phone</label>
          <PhoneInput
            international
            defaultCountry="US"
            value={phone}
            onChange={v => setPhone(v || '')}
            className={`${INPUT_CLASS} phone-input-override`}
            style={INPUT_STYLE}
          />
        </div>

        {/* ── Boater safety course disclosure (FL law: required only for drivers born on/after 1988) ── */}
        <div className="rounded-xl p-4" style={{ background: 'rgba(184,150,12,0.06)', border: '1px solid rgba(184,150,12,0.3)' }}>
          <p className="text-sm font-bold mb-1" style={{ color: '#D4AF37' }}>Florida boater safety requirement</p>
          <p className="text-sm text-[#ccc] leading-relaxed mb-3">
            Under Florida law, anyone driving who was born on or after January 1, {COURSE_CUTOFF_YEAR} must pass the Florida
            Temporary Boating Certificate test before riding. It costs <strong>${COURSE_PRICE.toFixed(2)}</strong> and is
            paid separately, directly on{' '}
            <a href={COURSE_INFO_URL} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: '#D4AF37' }}>
              boattests101.com
            </a>{' '}
            — it is not included in your rental payment.
          </p>

          <div className="flex flex-col gap-2 mb-1">
            <span className="text-sm text-white">Was the driver born on or after January 1, {COURSE_CUTOFF_YEAR}?</span>
            <div className="flex gap-2">
              {(['yes', 'no'] as const).map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => { setBornAfterCutoff(v); if (v === 'no') setCourseAck(false) }}
                  className="px-4 py-2 rounded-lg text-sm font-semibold transition-colors capitalize"
                  style={
                    bornAfterCutoff === v
                      ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }
                      : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }
                  }
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {courseRequired && (
            <label className="flex items-start gap-2 cursor-pointer mt-3">
              <input type="checkbox" checked={courseAck} onChange={e => setCourseAck(e.target.checked)} className="mt-1" />
              <span className="text-sm text-white">
                I understand I&apos;ll need to pass the ${COURSE_PRICE.toFixed(2)} boater safety test separately before riding.
              </span>
            </label>
          )}
          {bornAfterCutoff === 'no' && (
            <p className="text-xs mt-2" style={{ color: '#999' }}>
              No boater safety course required under Florida law for this driver.
            </p>
          )}
        </div>
      </div>

      {/* ── Right: price summary ──────────────────────────── */}
      <div className="rounded-2xl p-5 flex flex-col gap-4 h-fit" style={CARD_STYLE}>
        <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>Price Summary</h3>
        <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(184,150,12,0.08)', border: '1px solid rgba(184,150,12,0.25)' }}>
          <p className="text-xs text-[#999] mb-0.5">Meet us at</p>
          <p className="text-sm font-semibold text-white">{meetingAddress}</p>
        </div>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between text-[#ccc]">
            <span>{jetskiTypeLabel} — {durationLabel}</span>
            <span>${rentalCost}</span>
          </div>
          <div className="flex justify-between text-[#ccc]">
            <span>Transportation</span>
            <span>{transportCost ? `$${transportCost}` : '—'}</span>
          </div>
          <div className="h-px my-1" style={{ background: '#2a2a2a' }} />
          <div className="flex justify-between text-white font-bold text-base">
            <span>Estimated Total</span>
            <span>${total}</span>
          </div>
          <p className="text-xs text-[#888]">
            {bornAfterCutoff === null
              ? `May not include the $${COURSE_PRICE.toFixed(2)} boater safety course — depends on the driver's birth year.`
              : courseRequired
                ? `Does not include the $${COURSE_PRICE.toFixed(2)} boater safety course, paid separately.`
                : `No boater safety course fee applies for a driver born before ${COURSE_CUTOFF_YEAR}.`}
          </p>
        </div>

        <a
          href={canSubmit ? whatsappUrl : undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!canSubmit}
          onClick={e => { if (!canSubmit) e.preventDefault() }}
          className="w-full text-center px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all"
          style={
            canSubmit
              ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a', cursor: 'pointer' }
              : { background: '#2a2a2a', color: '#666', cursor: 'not-allowed' }
          }
        >
          Reserve via WhatsApp
        </a>
        {!canSubmit && (
          <p className="text-xs text-center text-[#888]">Fill in your name, email, phone, and the driver&apos;s birth year question to continue.</p>
        )}
      </div>
      </div>
    </div>
  )
}
