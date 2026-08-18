'use client'

import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export default function SearchInput({
  value, onChange, placeholder = 'Search…', className = '',
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={15}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--text-faint)' }}
      />
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[10px] pl-9 pr-9 py-2.5 text-sm outline-none transition-colors focus:border-[var(--gold)] focus-visible:ring-2 focus-visible:ring-[var(--gold)]/20"
        style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text)' }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors hover:bg-[var(--surface-alt)]"
          style={{ color: 'var(--text-faint)' }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
