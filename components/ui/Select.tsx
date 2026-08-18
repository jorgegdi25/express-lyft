'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  /** Optional dot color shown before the label — used for status pills. */
  color?: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  /** Shown when the current value matches no option (e.g. an empty filter). */
  placeholder?: string
  /** Icon rendered inside the trigger, before the label. */
  icon?: React.ReactNode
  /** 'md' for toolbars and forms, 'sm' for inline chips on cards. */
  size?: 'sm' | 'md'
  /** Tints the trigger — used by status/driver chips that carry their own color. */
  tone?: { bg: string; fg: string; border: string }
  className?: string
  ariaLabel?: string
}

export default function Select({
  value, options, onChange, placeholder = 'Select…',
  icon, size = 'md', tone, className = '', ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [dropUp, setDropUp] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  // Flip the menu above the trigger when there isn't room below, so options
  // never get clipped at the bottom of the viewport.
  const toggle = () => {
    if (!open && rootRef.current) {
      const { bottom } = rootRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - bottom < Math.min(options.length * 40 + 16, 280))
    }
    setOpen((v) => !v)
  }

  const isSm = size === 'sm'

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        className={`w-full flex items-center gap-2 rounded-[10px] border transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40 ${
          isSm ? 'px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest' : 'px-3.5 py-2.5 text-sm'
        }`}
        style={
          tone
            ? { background: tone.bg, color: tone.fg, borderColor: tone.border }
            : { background: 'var(--surface-raised)', color: 'var(--text)', borderColor: 'var(--border)' }
        }
      >
        {icon && <span className="shrink-0 opacity-70">{icon}</span>}
        <span className="flex-1 text-left truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown size={isSm ? 11 : 15} className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="listbox"
          className={`absolute z-50 min-w-full w-max max-w-[280px] max-h-[260px] overflow-y-auto rounded-xl p-1 shadow-2xl ${
            dropUp ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{ background: 'var(--surface)', border: '1px solid var(--border-soft)' }}
        >
          {options.map((o) => {
            const active = o.value === value
            return (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors hover:bg-[var(--surface-alt)]"
                style={{ color: active ? 'var(--gold-light)' : 'var(--text-subtle)' }}
              >
                {o.color && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: o.color }} />}
                <span className="flex-1 truncate">{o.label}</span>
                {active && <Check size={14} className="shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
