'use client'

import { useState } from 'react'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import { Plus, ArrowUpDown, ArrowRight, Sparkles } from 'lucide-react'

export default function UiPreview() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('newest')
  const [cardStatus, setCardStatus] = useState('pending_payment')
  const [driver, setDriver] = useState('')

  return (
    <div className="min-h-screen p-8" style={{ background: 'var(--bg-deep)' }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-8">

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Sales Pipeline &amp; Leads</h1>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage leads, follow-ups, and track conversions.</p>
          </div>
          <Button variant="primary" icon={<Plus size={14} />} className="shrink-0">New Reservation</Button>
        </div>

        <div
          className="flex flex-col md:flex-row md:items-center gap-3 rounded-2xl p-3"
          style={{ background: 'var(--bg)', border: '1px solid var(--border-faint)' }}
        >
          <SearchInput value={search} onChange={setSearch} placeholder="Search name, email, phone…" className="flex-1 min-w-0" />
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending_payment', label: 'Abandoned Carts', color: '#f87171' },
                { value: 'paid', label: 'Paid Bookings', color: '#34d399' },
                { value: 'invoice_sent', label: 'Invoice Sent', color: '#60a5fa' },
              ]}
              className="w-[170px]"
            />
            <Select
              icon={<ArrowUpDown size={14} />}
              value={sort}
              onChange={setSort}
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'amount_high', label: 'Amount: High to Low' },
              ]}
              className="w-[180px]"
            />
          </div>
        </div>

        {/* Lead card replica */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl p-5 flex flex-col gap-3.5 border border-[var(--border)] bg-[var(--bg)]">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white truncate">Jorge Gonzalez</h3>
                  <span className="text-[10px] bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/30 font-bold shrink-0">CO</span>
                </div>
                <p className="text-xs text-[var(--text-dim)] truncate">jorgegdi12@gmail.com</p>
              </div>
              <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider shrink-0 mt-0.5">10D AGO</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-white pt-3.5 border-t border-[#222]">
              <span className="truncate">B Ocean Hotel Resort</span>
              <ArrowRight size={13} className="shrink-0" style={{ color: 'var(--text-faint)' }} />
              <span className="truncate">Fort Lauderdale Airport</span>
              <span className="ml-auto shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded" style={{ background: '#33333340', color: 'var(--text-muted)' }}>One Way</span>
            </div>

            <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>08/17/2026 · 5:00 AM</span>
              <span>2 PAX · <span className="font-bold" style={{ color: 'var(--gold-light)' }}>Sedan &amp; SUV</span></span>
            </div>

            <span className="self-start text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: '#B8960C20', color: 'var(--gold-light)', border: '1px solid #B8960C50' }}>
              <Sparkles size={11} /> VIP Meet &amp; Greet <span style={{ color: '#4ade80' }}>+$25</span>
            </span>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--text-faint)] font-mono">+573127697168</span>
              <Button variant="success" size="sm">WhatsApp</Button>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-[#222]">
              <div>
                <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-widest font-bold block">Est. Total</span>
                <p className="text-lg font-bold" style={{ color: '#4ade80' }}>$40</p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <Select
                  size="sm"
                  value={cardStatus}
                  onChange={setCardStatus}
                  options={[
                    { value: 'new', label: 'Manual (New)', color: '#888888' },
                    { value: 'pending_payment', label: 'Abandoned', color: '#f87171' },
                    { value: 'paid', label: 'Paid', color: '#34d399' },
                  ]}
                  tone={{ bg: '#7f1d1d30', fg: '#f87171', border: '#7f1d1d80' }}
                  className="w-[150px]"
                />
                <Select
                  size="sm"
                  value={driver}
                  onChange={setDriver}
                  options={[
                    { value: '', label: 'Unassigned' },
                    { value: 'd1', label: 'Carlos Ramirez' },
                    { value: 'd2', label: 'Dennis Torres' },
                  ]}
                  tone={{ bg: 'var(--surface)', fg: 'var(--text)', border: 'var(--border-soft)' }}
                  className="w-[150px]"
                />
                <div className="flex items-center gap-2 mt-0.5">
                  <Button variant="ghost" size="sm">+ Add Note</Button>
                </div>
              </div>
            </div>
          </div>

          {/* Button variants */}
          <div className="rounded-xl p-5 flex flex-col gap-4 border border-[var(--border)] bg-[var(--bg)]">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Button variants</p>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" size="sm">Primary sm</Button>
              <Button variant="secondary" size="sm">Secondary sm</Button>
              <Button variant="danger" size="sm">Danger sm</Button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
