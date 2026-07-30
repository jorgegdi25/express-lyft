'use client'

import { useState, type CSSProperties } from 'react'
import { formatDateUS, getMonthGridDays } from '@/lib/dateUtils'

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
)

function MonthNav({ viewMonth, onPrev, onNext }: { viewMonth: Date; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <button type="button" onClick={onPrev} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#B8960C] transition-colors">&larr;</button>
      <span className="text-xs font-bold text-white" style={{ fontFamily: 'Georgia, serif' }}>
        {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </span>
      <button type="button" onClick={onNext} className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#2a2a2a] text-[#aaa] hover:text-white hover:border-[#B8960C] transition-colors">&rarr;</button>
    </div>
  )
}

function WeekdayHeader() {
  return (
    <div className="grid grid-cols-7 mb-1">
      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
        <div key={i} className="text-center text-[9px] uppercase font-bold text-[#666] py-1">{d}</div>
      ))}
    </div>
  )
}

function monthOf(dateStr: string | undefined) {
  const base = dateStr ? new Date(`${dateStr}T00:00:00`) : new Date()
  base.setDate(1)
  return base
}

// Single-date picker — a drop-in visual replacement for <input type="date">.
// Pass `className`/`style` to match whatever surrounding form fields already
// look like (admin CRM and the public booking forms use slightly different
// tokens for the same dark/gold theme).
export function CalendarDatePicker({
  value,
  onChange,
  min,
  placeholder = 'Select date',
  className,
  style,
}: {
  value: string
  onChange: (value: string) => void
  min?: string
  placeholder?: string
  className?: string
  style?: CSSProperties
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => monthOf(value || min))

  function open() {
    setViewMonth(monthOf(value || min))
    setIsOpen(true)
  }

  function handleDayClick(dateStr: string) {
    if (min && dateStr < min) return
    onChange(dateStr)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className={className || 'w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors focus:border-[#B8960C] text-left flex items-center justify-between gap-2'}
        style={style || { background: '#0e0e0e', border: '1px solid #333333', color: value ? '#FFFFFF' : '#777777' }}
      >
        <span>{value ? formatDateUS(value) : placeholder}</span>
        <CalendarIcon />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute z-50 mt-2 left-0 w-72 max-w-[90vw] rounded-xl p-3 shadow-2xl"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <MonthNav
              viewMonth={viewMonth}
              onPrev={() => { const d = new Date(viewMonth); d.setMonth(d.getMonth() - 1); setViewMonth(d); }}
              onNext={() => { const d = new Date(viewMonth); d.setMonth(d.getMonth() + 1); setViewMonth(d); }}
            />
            <WeekdayHeader />
            <div className="grid grid-cols-7 gap-0.5">
              {getMonthGridDays(viewMonth).map(({ date, dateStr, inMonth }) => {
                const isDisabled = !!min && dateStr < min
                const isSelected = dateStr === value
                const isToday = dateStr === new Date().toLocaleDateString('en-CA')
                return (
                  <button
                    key={dateStr}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => handleDayClick(dateStr)}
                    className="text-[11px] rounded-lg py-1.5 transition-colors hover:brightness-125 disabled:hover:brightness-100 disabled:cursor-not-allowed"
                    style={{
                      opacity: isDisabled ? 0.25 : inMonth ? 1 : 0.3,
                      background: isSelected ? '#B8960C' : 'transparent',
                      color: isSelected ? '#0a0a0a' : '#ccc',
                      fontWeight: isSelected || isToday ? 700 : 400,
                      boxShadow: isToday && !isSelected ? 'inset 0 0 0 1px #D4AF37' : 'none',
                    }}
                  >{date.getDate()}</button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Range picker used by list-filter toolbars (Bookings, Sales Pipeline). Click
// one day to filter to just that day; click a second day to turn it into a
// range (order doesn't matter, it sorts them). Clicking the same day twice
// re-confirms a single-day filter and closes the popover.
export function CalendarRangeFilter({ from, to, onChange }: { from: string; to: string; onChange: (from: string, to: string) => void }) {
  const [isOpen, setIsOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(() => monthOf(from))
  const [pendingStart, setPendingStart] = useState<string | null>(null)

  const label = !from && !to
    ? 'All Dates'
    : from === to
    ? formatDateUS(from)
    : `${formatDateUS(from)} – ${formatDateUS(to)}`

  function open() {
    setPendingStart(null)
    setViewMonth(monthOf(from))
    setIsOpen(true)
  }

  function handleDayClick(dateStr: string) {
    if (!pendingStart) {
      setPendingStart(dateStr)
      onChange(dateStr, dateStr)
    } else {
      const start = pendingStart <= dateStr ? pendingStart : dateStr
      const end = pendingStart <= dateStr ? dateStr : pendingStart
      onChange(start, end)
      setPendingStart(null)
      setIsOpen(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        className="rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-[#111] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors flex items-center gap-2 whitespace-nowrap"
      >
        <CalendarIcon />
        {label}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute z-50 mt-2 right-0 w-72 max-w-[90vw] rounded-xl p-3 shadow-2xl"
            style={{ background: '#161616', border: '1px solid #2a2a2a' }}
            onClick={(e) => e.stopPropagation()}
          >
            <MonthNav
              viewMonth={viewMonth}
              onPrev={() => { const d = new Date(viewMonth); d.setMonth(d.getMonth() - 1); setViewMonth(d); }}
              onNext={() => { const d = new Date(viewMonth); d.setMonth(d.getMonth() + 1); setViewMonth(d); }}
            />
            <WeekdayHeader />
            <div className="grid grid-cols-7 gap-0.5">
              {getMonthGridDays(viewMonth).map(({ date, dateStr, inMonth }) => {
                const inRange = !!from && !!to && dateStr >= from && dateStr <= to
                const isEdge = dateStr === from || dateStr === to
                const isToday = dateStr === new Date().toLocaleDateString('en-CA')
                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleDayClick(dateStr)}
                    className="text-[11px] rounded-lg py-1.5 transition-colors hover:brightness-125"
                    style={{
                      opacity: inMonth ? 1 : 0.3,
                      background: isEdge ? '#B8960C' : inRange ? '#B8960C30' : 'transparent',
                      color: isEdge ? '#0a0a0a' : '#ccc',
                      fontWeight: isEdge || isToday ? 700 : 400,
                      boxShadow: isToday && !isEdge ? 'inset 0 0 0 1px #D4AF37' : 'none',
                    }}
                  >{date.getDate()}</button>
                )
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2a2a]">
              <button type="button" onClick={() => { onChange('', ''); setPendingStart(null); }} className="text-xs text-[#888] hover:text-red-400 transition-colors">Clear</button>
              <button type="button" onClick={() => setIsOpen(false)} className="text-xs text-[#B8960C] hover:underline font-bold">Done</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
