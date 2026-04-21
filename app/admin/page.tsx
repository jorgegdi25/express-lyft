'use client'

import Image from 'next/image'
import { useState } from 'react'
import QRCode from 'qrcode'

/* ── Interfaces ─────────────────────────────────────── */


interface Booking {
  id: string
  hotel_slug: string
  vehicle_type: string
  amount_usd: number
  status: string
  date: string
  created_at: string
  pickup: string
  destination: string
  customer_name?: string
  customer_email?: string
}

interface RoutePricing {
  id: string
  hotel_slug: string
  pickup: string
  destination: string
  sedan_suv_price: number
  suburban_price: number
  sprinter_price: number
  minibus_price: number
  coachbus_price: number
}

interface Lead {
  id: string
  hotel_slug: string
  customer_name: string
  customer_email: string
  customer_phone?: string
  pickup: string
  destination: string
  vehicle_type: string
  status?: string
  notes?: string
  created_at: string
  passengers?: number
  date?: string
  time?: string
  return_date?: string
  return_time?: string
  amount_usd?: number
  trip_type?: string
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  hotel: string
  totalTrips: number
  totalSpent: number
  status: 'active' | 'vip' | 'inactive'
  lastTrip: string
  notes: string
}

const VEHICLE_LABELS: Record<string, string> = {
  sedan_suv: 'Sedan & SUV',
  suburban: 'Chevy Suburban',
  sprinter: 'Mercedes-Benz Sprinter',
  minibus: '31 Passenger Mini Bus',
  coachbus: '55 Passenger Bus',
}

type TabKey = 'dashboard' | 'clients' | 'routes' | 'bookings' | 'leads' | 'qr'





/* ── Sidebar Icon Components ────────────────────────── */

function IconDashboard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}
function IconClients() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function IconRoutes() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  )
}
function IconBookings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}
function IconLeads() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  )
}
function IconQR() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="21" y1="14" x2="21" y2="14.01" />
      <line x1="21" y1="21" x2="21" y2="21.01" />
    </svg>
  )
}

/* ── Main Admin Page ────────────────────────────────── */

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)

  const [qrSlug, setQrSlug] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const [leads, setLeads] = useState<Lead[]>([])
  const [addingLead, setAddingLead] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [newLead, setNewLead] = useState({
    hotelSlug: 'bocean-resort', customerName: '', customerEmail: '', customerPhone: '', pickup: '', destination: '', vehicleType: 'sedan_suv', status: 'new', notes: ''
  })

  const [routePrices, setRoutePrices] = useState<RoutePricing[]>([])
  const [editRoutePrices, setEditRoutePrices] = useState<Record<string, { sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }>>({})
  const [savingRoute, setSavingRoute] = useState<string | null>(null)
  const [addingRoute, setAddingRoute] = useState(false)
  const [newRoute, setNewRoute] = useState({
    hotel_slug: 'bocean-resort',
    pickup: 'The Hotel',
    destination: 'Port Everglades (Cruise Terminal)',
    sedan_suv_price: 150,
    suburban_price: 200,
    sprinter_price: 280,
    minibus_price: 450,
    coachbus_price: 800,
  })

  // Client CRUD state
  const [clients, setClients] = useState<Client[]>([])
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showClientForm, setShowClientForm] = useState(false)
  const [clientForm, setClientForm] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    hotel: '',
    totalTrips: 0,
    totalSpent: 0,
    status: 'active',
    lastTrip: new Date().toISOString().split('T')[0],
    notes: '',
  })

  /* ── API Fetchers ── */
  
  function formatDateUS(dateStr: string | undefined | null) {
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



  async function fetchBookings(pw: string) {
    const res = await fetch(`/api/admin/bookings?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<Booking[]>
  }

  async function fetchRoutes(pw: string) {
    const res = await fetch(`/api/admin/routes?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<RoutePricing[]>
  }

  async function fetchLeads(pw: string) {
    const res = await fetch(`/api/admin/leads?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<Lead[]>
  }

  /* ── Auth ── */

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setAuthError('')

    // First, just verify the password by checking if the API accepts it
    const testRes = await fetch('/api/admin/prices', {
      headers: { authorization: `Bearer ${password}` },
    })

    // 401 means wrong password; anything else (200, 500) means password was accepted
    if (testRes.status === 401) {
      setAuthError('Incorrect password.')
      return
    }

    setAuthed(true)
    setLoadingBookings(true)

    // Try to load data, but don't fail if Supabase tables are missing
    let bk: Booking[] = []
    let rt: RoutePricing[] = []
    let ld: Lead[] = []

    try {
      const [bkRes, rtRes, ldRes] = await Promise.all([
        fetchBookings(password),
        fetchRoutes(password),
        fetchLeads(password),
      ])
      bk = bkRes
      rt = rtRes
      ld = ldRes
    } catch {
      // Data loading failed, continue with sample data
    }

    setBookings(bk)
    setRoutePrices(rt)
    setLeads(ld)
    setEditRoutePrices(
      Object.fromEntries(
        rt.map((r) => [
          r.id,
          { sedan_suv: r.sedan_suv_price, suburban: r.suburban_price, sprinter: r.sprinter_price, minibus: r.minibus_price, coachbus: r.coachbus_price },
        ])
      )
    )
    setLoadingBookings(false)
  }

  /* ── Route CRUD ── */

  async function saveRoute(route: RoutePricing) {
    setSavingRoute(route.id)
    await fetch('/api/admin/routes', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${password}`,
      },
      body: JSON.stringify(route),
    })
    const data = await fetchRoutes(password)
    setRoutePrices(data)
    setEditRoutePrices(
      Object.fromEntries(
        data.map((r) => [
          r.id,
          { sedan_suv: r.sedan_suv_price, suburban: r.suburban_price, sprinter: r.sprinter_price, minibus: r.minibus_price, coachbus: r.coachbus_price },
        ])
      )
    )
    setSavingRoute(null)
  }

  async function addRoute() {
    setAddingRoute(true)
    try {
      const res = await fetch('/api/admin/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${password}`,
        },
        body: JSON.stringify(newRoute),
      })
      const result = await res.json()
      if (!res.ok) {
        alert(`Error adding route: ${result.error || 'Unknown error'}`)
        setAddingRoute(false)
        return
      }
      const data = await fetchRoutes(password)
      setRoutePrices(data)
      setEditRoutePrices(
        Object.fromEntries(
          data.map((r) => [
            r.id,
            { sedan_suv: r.sedan_suv_price, suburban: r.suburban_price, sprinter: r.sprinter_price, minibus: r.minibus_price, coachbus: r.coachbus_price },
          ])
        )
      )
      setNewRoute((prev) => ({ ...prev, pickup: '', destination: '' }))
    } catch (err) {
      alert(`Network error adding route: ${err}`)
    }
    setAddingRoute(false)
  }

  async function deleteRoute(id: string) {
    if (!confirm('Are you sure you want to delete this route?')) return
    await fetch(`/api/admin/routes?id=${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${password}` },
    })
    const data = await fetchRoutes(password)
    setRoutePrices(data)
  }

  async function addLead() {
    setAddingLead(true)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead)
      })
      const result = await res.json()
      if (!res.ok) {
        alert(`Error adding lead: ${result.error || 'Unknown error'}`)
        setAddingLead(false)
        return
      }
      const data = await fetchLeads(password)
      setLeads(data)
      setNewLead({ hotelSlug: 'bocean-resort', customerName: '', customerEmail: '', customerPhone: '', pickup: '', destination: '', vehicleType: 'sedan_suv', status: 'new', notes: '' })
    } catch (err) {
      alert(`Network error adding lead: ${err}`)
    }
    setAddingLead(false)
  }

  async function updateLead(id: string, updates: Partial<Lead>) {
    // Optimistic UI update
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
        body: JSON.stringify({ id, ...updates })
      })
      const result = await res.json()
      if (!res.ok) {
        alert(`Error updating lead: ${result.error || 'Unknown error'}`)
        // Revert UI optimistic update by refreshing from server
        fetchLeads(password).then(setLeads)
      }
    } catch (e) {
      alert(`Network error updating lead: ${e}`)
      fetchLeads(password).then(setLeads)
    }
  }

  async function deleteLead(id: string) {
    if (!confirm('Are you sure you want to delete this lead?')) return
    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${password}` },
      })
      if (!res.ok) throw new Error('Failed to delete lead')
      setLeads((prev) => prev.filter((l) => l.id !== id))
    } catch (err) {
      alert(`Error deleting lead: ${err}`)
    }
  }

  /* ── QR ── */

  async function generateQR() {
    if (!qrSlug) return
    const url = `https://expresslift.com/hotel/${qrSlug}`
    const dataUrl = await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      color: { dark: '#111111', light: '#FFFFFF' },
    })
    setQrDataUrl(dataUrl)
  }

  /* ── Client CRUD (local state for demo) ── */

  function handleSaveClient() {
    if (editingClient) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id ? { ...clientForm, id: editingClient.id } : c
        )
      )
    } else {
      setClients((prev) => [
        ...prev,
        { ...clientForm, id: `c${Date.now()}` },
      ])
    }
    resetClientForm()
  }

  function handleEditClient(client: Client) {
    setEditingClient(client)
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone,
      hotel: client.hotel,
      totalTrips: client.totalTrips,
      totalSpent: client.totalSpent,
      status: client.status,
      lastTrip: client.lastTrip,
      notes: client.notes,
    })
    setShowClientForm(true)
  }

  function handleDeleteClient(id: string) {
    if (!confirm('Are you sure you want to remove this client?')) return
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  function resetClientForm() {
    setShowClientForm(false)
    setEditingClient(null)
    setClientForm({
      name: '',
      email: '',
      phone: '',
      hotel: '',
      totalTrips: 0,
      totalSpent: 0,
      status: 'active',
      lastTrip: new Date().toISOString().split('T')[0],
      notes: '',
    })
  }

  /* ── Status Badge ── */

  function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      vip:      { bg: 'rgba(234, 179, 8, 0.1)',  text: '#EAB308',  border: 'rgba(234, 179, 8, 0.25)' },
      active:   { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ade80',  border: 'rgba(74, 222, 128, 0.25)' },
      inactive: { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' },
      paid:     { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ade80',  border: 'rgba(74, 222, 128, 0.25)' },
      pending:  { bg: 'rgba(248, 113, 113, 0.1)', text: '#f87171', border: 'rgba(248, 113, 113, 0.25)' },
    }
    const c = colors[status] || colors.inactive
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      >
        {status}
      </span>
    )
  }

  /* ── Sidebar Items ── */

  const sidebarItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { key: 'clients',   label: 'Clients',   icon: <IconClients /> },
    { key: 'routes',    label: 'Routes',     icon: <IconRoutes /> },
    { key: 'bookings',  label: 'Bookings',   icon: <IconBookings /> },
    { key: 'leads',     label: 'Leads',      icon: <IconLeads /> },
    { key: 'qr',        label: 'QR Codes',   icon: <IconQR /> },
  ]

  /* ═══════════════════════════════════════════════════ */
  /*  LOGIN SCREEN                                       */
  /* ═══════════════════════════════════════════════════ */

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-5 w-full max-w-sm p-10 rounded-2xl"
          style={{ background: '#111111', border: '1px solid #1e1e1e', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: '#B8960C' }}>
              <span className="text-black font-bold text-sm">EL</span>
            </div>
            <div>
              <p className="text-base font-bold tracking-[3px] uppercase" style={{ color: '#B8960C', fontFamily: 'Georgia, serif' }}>
                Express Lyft
              </p>
              <p className="text-xs uppercase tracking-[2px]" style={{ color: '#888' }}>
                Admin Console
              </p>
            </div>
          </div>

          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#B8960C]"
            style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#FFFFFF' }}
          />
          {authError && <p className="text-sm text-red-400">{authError}</p>}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Authenticate
          </button>
        </form>
      </main>
    )
  }

  /* ═══════════════════════════════════════════════════ */
  /*  MAIN DASHBOARD LAYOUT                              */
  /* ═══════════════════════════════════════════════════ */

  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0a', color: '#FFFFFF' }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-[240px] min-h-screen flex flex-col py-6 px-4 fixed left-0 top-0"
        style={{ background: '#0f0f0f', borderRight: '1px solid #1a1a1a' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: '#B8960C' }}>
            <span className="text-black font-bold text-xs">EL</span>
          </div>
          <div>
            <p className="text-sm font-bold tracking-[2px] uppercase" style={{ color: '#B8960C', fontFamily: 'Georgia, serif' }}>
              Express Lyft
            </p>
            <p className="text-[9px] uppercase tracking-[1.5px]" style={{ color: '#999' }}>
              Management
            </p>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-1 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActiveTab(item.key)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-left text-sm transition-all"
              style={{
                background: activeTab === item.key ? 'rgba(184, 150, 12, 0.08)' : 'transparent',
                color: activeTab === item.key ? '#D4AF37' : '#555',
                borderLeft: activeTab === item.key ? '2px solid #B8960C' : '2px solid transparent',
              }}
            >
              {item.icon}
              <span className="font-medium tracking-wide">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User / Logout */}
        <div
          className="mt-auto pt-4 px-2"
          style={{ borderTop: '1px solid #1a1a1a' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: '#1a1a1a', color: '#999' }}>
                A
              </div>
              <span className="text-[11px] text-[#aaa]">Admin</span>
            </div>
            <button
              onClick={() => setAuthed(false)}
              className="text-xs uppercase tracking-widest hover:text-red-400 transition-colors"
              style={{ color: '#999' }}
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 ml-[240px] p-8 max-w-6xl">

        {/* ─────── DASHBOARD TAB ─────── */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</h1>
              <p className="text-sm" style={{ color: '#888' }}>Overview of your transportation business</p>
            </div>

            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Total Revenue', value: `$${bookings.reduce((s, b) => s + (b.amount_usd || 0), 0).toLocaleString()}`, sub: 'All time', color: '#4ade80' },
                { label: 'Bookings', value: bookings.length, sub: 'Completed trips', color: '#60a5fa' },
                { label: 'Active Clients', value: clients.filter(c => c.status !== 'inactive').length, sub: `${clients.filter(c => c.status === 'vip').length} VIP`, color: '#D4AF37' },
                { label: 'Leads', value: leads.length, sub: 'Potential bookings', color: '#c084fc' },
              ].map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl p-5 flex flex-col gap-3 group"
                  style={{ background: '#111', border: '1px solid #1a1a1a' }}
                >
                  <p className="text-xs uppercase tracking-[2px]" style={{ color: '#888' }}>
                    {s.label}
                  </p>
                  <p className="text-3xl font-bold" style={{ color: s.color }}>
                    {s.value}
                  </p>
                  <p className="text-xs uppercase tracking-widest" style={{ color: '#999' }}>
                    {s.sub}
                  </p>
                </div>
              ))}
            </section>

            {/* Recent Bookings Preview */}
            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#888' }}>
                  Latest Bookings
                </p>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-xs uppercase tracking-widest font-bold transition-colors hover:text-[#D4AF37]"
                  style={{ color: '#999' }}
                >
                  View All →
                </button>
              </div>
              {bookings.length === 0 ? (
                <p className="text-sm italic" style={{ color: '#999' }}>
                  No bookings yet. They will appear here after the first completed payment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: '#888' }}>
                        {['Date', 'Passenger', 'Route', 'Amount', 'Status'].map((h) => (
                          <th key={h} className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                          <td className="py-3 pr-4 text-white">{formatDateUS(b.date)}</td>
                          <td className="py-3 pr-4 text-white text-xs">{b.customer_name || 'Guest'}</td>
                          <td className="py-3 pr-4 text-xs" style={{ color: '#999' }}>{b.pickup} → {b.destination}</td>
                          <td className="py-3 pr-4" style={{ color: '#D4AF37' }}>${b.amount_usd}</td>
                          <td className="py-3"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ─────── CLIENTS TAB ─────── */}
        {activeTab === 'clients' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Client Management</h1>
                <p className="text-sm" style={{ color: '#888' }}>{clients.length} total clients · {clients.filter(c => c.status === 'vip').length} VIP</p>
              </div>
              <button
                onClick={() => { resetClientForm(); setShowClientForm(true) }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
              >
                + New Client
              </button>
            </div>

            {/* Client Form Modal */}
            {showClientForm && (
              <div className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #B8960C30' }}>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#D4AF37' }}>
                    {editingClient ? 'Edit Client' : 'New Client'}
                  </p>
                  <button onClick={resetClientForm} className="text-xs text-[#aaa] hover:text-red-400 transition-colors">
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Full Name', key: 'name' as const, type: 'text', placeholder: 'John Smith' },
                    { label: 'Email', key: 'email' as const, type: 'email', placeholder: 'john@example.com' },
                    { label: 'Phone', key: 'phone' as const, type: 'tel', placeholder: '+1 (555) 000-0000' },
                    { label: 'Hotel', key: 'hotel' as const, type: 'text', placeholder: 'Partner Hotel' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={clientForm[key]}
                        onChange={(e) => setClientForm({ ...clientForm, [key]: e.target.value })}
                        className="rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[#B8960C]"
                        style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Status</label>
                    <select
                      value={clientForm.status}
                      onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as Client['status'] })}
                      className="rounded-lg px-4 py-3 text-sm outline-none"
                      style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff' }}
                    >
                      <option value="active">Active</option>
                      <option value="vip">VIP</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Total Trips</label>
                    <input type="number" value={clientForm.totalTrips} onChange={(e) => setClientForm({ ...clientForm, totalTrips: parseInt(e.target.value) || 0 })} className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Total Spent ($)</label>
                    <input type="number" value={clientForm.totalSpent} onChange={(e) => setClientForm({ ...clientForm, totalSpent: parseInt(e.target.value) || 0 })} className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff' }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mb-6">
                  <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Private notes about this client..."
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    className="rounded-lg px-4 py-3 text-sm outline-none resize-none"
                    style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff' }}
                  />
                </div>
                <button
                  onClick={handleSaveClient}
                  disabled={!clientForm.name || !clientForm.email}
                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                >
                  {editingClient ? 'Save Changes' : 'Create Client'}
                </button>
              </div>
            )}

            {/* Client Table */}
            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: '#888' }}>
                      {['Client', 'Hotel', 'Trips', 'Revenue', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold">{c.name}</p>
                          <p className="text-xs text-[#aaa]">{c.email}</p>
                          <p className="text-xs text-[#999]">{c.phone}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-xs text-white">{c.hotel}</p>
                        </td>
                        <td className="py-4 pr-4 text-white font-bold">{c.totalTrips}</td>
                        <td className="py-4 pr-4" style={{ color: '#D4AF37' }}>${c.totalSpent.toLocaleString()}</td>
                        <td className="py-4 pr-4"><StatusBadge status={c.status} /></td>
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleEditClient(c)}
                              className="text-xs uppercase tracking-widest font-bold transition-colors hover:text-[#D4AF37]"
                              style={{ color: '#999' }}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteClient(c.id)}
                              className="text-xs uppercase tracking-widest font-bold text-red-900 hover:text-red-400 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                          {c.notes && (
                            <p className="text-xs mt-2 italic" style={{ color: '#999' }}>
                              📝 {c.notes}
                            </p>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ─────── ROUTES TAB ─────── */}
        {activeTab === 'routes' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Route Pricing</h1>
              <p className="text-sm" style={{ color: '#888' }}>Manage per-route pricing by vehicle type</p>
            </div>

            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr style={{ color: '#888' }}>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Route</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Sedan/SUV</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Suburban</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Sprinter</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Mini Bus</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Coach Bus</th>
                      <th className="py-2 text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routePrices.map((rp) => (
                      <tr key={rp.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold">{rp.pickup} → {rp.destination}</p>
                          <p className="text-xs uppercase tracking-widest text-[#888]">{rp.hotel_slug}</p>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[#888]">$</span>
                            <input
                              type="number"
                              value={editRoutePrices[rp.id]?.sedan_suv ?? rp.sedan_suv_price}
                              onChange={(e) =>
                                setEditRoutePrices((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], sedan_suv: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[#888]">$</span>
                            <input
                              type="number"
                              value={editRoutePrices[rp.id]?.suburban ?? rp.suburban_price}
                              onChange={(e) =>
                                setEditRoutePrices((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], suburban: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[#888]">$</span>
                            <input
                              type="number"
                              value={editRoutePrices[rp.id]?.sprinter ?? rp.sprinter_price}
                              onChange={(e) =>
                                setEditRoutePrices((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], sprinter: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[#888]">$</span>
                            <input
                              type="number"
                              value={editRoutePrices[rp.id]?.minibus ?? rp.minibus_price}
                              onChange={(e) =>
                                setEditRoutePrices((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], minibus: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[#888]">$</span>
                            <input
                              type="number"
                              value={editRoutePrices[rp.id]?.coachbus ?? rp.coachbus_price}
                              onChange={(e) =>
                                setEditRoutePrices((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], coachbus: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]"
                            />
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          {savingRoute === rp.id ? (
                            <span className="text-[#B8960C] uppercase tracking-widest text-xs font-bold">Saving…</span>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() =>
                                  saveRoute({
                                    ...rp,
                                    sedan_suv_price: editRoutePrices[rp.id]?.sedan_suv ?? rp.sedan_suv_price,
                                    suburban_price: editRoutePrices[rp.id]?.suburban ?? rp.suburban_price,
                                    sprinter_price: editRoutePrices[rp.id]?.sprinter ?? rp.sprinter_price,
                                    minibus_price: editRoutePrices[rp.id]?.minibus ?? rp.minibus_price,
                                    coachbus_price: editRoutePrices[rp.id]?.coachbus ?? rp.coachbus_price,
                                  })
                                }
                                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                                style={{ background: '#B8960C', color: '#0a0a0a' }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => deleteRoute(rp.id)}
                                className="text-red-900 hover:text-red-400 text-xs font-bold uppercase tracking-widest"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {routePrices.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-4 text-center text-[#888] text-xs italic">
                          No routes configured yet.
                        </td>
                      </tr>
                    )}

                    {/* Add New Route */}
                    <tr style={{ borderTop: '1px solid #1a1a1a' }}>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col gap-2">
                          <input type="text" placeholder="Pickup" value={newRoute.pickup} onChange={(e) => setNewRoute({ ...newRoute, pickup: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          <input type="text" placeholder="Destination" value={newRoute.destination} onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          <input type="text" placeholder="Hotel Slug" value={newRoute.hotel_slug} onChange={(e) => setNewRoute({ ...newRoute, hotel_slug: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-1.5 text-[#666] outline-none" />
                        </div>
                      </td>
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[#888]">$</span><input type="number" value={newRoute.sedan_suv_price || ''} onChange={(e) => setNewRoute({ ...newRoute, sedan_suv_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]" /></div></td>
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[#888]">$</span><input type="number" value={newRoute.suburban_price || ''} onChange={(e) => setNewRoute({ ...newRoute, suburban_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]" /></div></td>
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[#888]">$</span><input type="number" value={newRoute.sprinter_price || ''} onChange={(e) => setNewRoute({ ...newRoute, sprinter_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]" /></div></td>
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[#888]">$</span><input type="number" value={newRoute.minibus_price || ''} onChange={(e) => setNewRoute({ ...newRoute, minibus_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]" /></div></td>
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[#888]">$</span><input type="number" value={newRoute.coachbus_price || ''} onChange={(e) => setNewRoute({ ...newRoute, coachbus_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[#0a0a0a] border border-[#1e1e1e] p-2 text-white outline-none focus:border-[#B8960C]" /></div></td>
                      <td className="py-4 text-right">
                        <button
                          onClick={addRoute}
                          disabled={addingRoute || !newRoute.pickup || !newRoute.destination}
                          className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                          style={{ border: '2px dashed #B8960C', color: '#B8960C' }}
                        >
                          {addingRoute ? 'Wait…' : '+ Add'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ─────── BOOKINGS TAB ─────── */}
        {activeTab === 'bookings' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Bookings</h1>
              <p className="text-sm" style={{ color: '#888' }}>{bookings.length} total bookings</p>
            </div>

            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              {loadingBookings ? (
                <p className="text-sm italic" style={{ color: '#888' }}>Loading…</p>
              ) : bookings.length === 0 ? (
                <p className="text-sm italic" style={{ color: '#888' }}>No bookings yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ color: '#888' }}>
                        {['Date', 'Passenger', 'Route', 'Vehicle', 'Amount', 'Status'].map((h) => (
                          <th key={h} className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map((b) => (
                        <tr key={b.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                          <td className="py-3 pr-4 text-white">{formatDateUS(b.date)}</td>
                          <td className="py-3 pr-4">
                            <p className="text-white text-xs font-bold">{b.customer_name || 'Guest'}</p>
                            <p className="text-xs text-[#888]">{b.customer_email || b.hotel_slug}</p>
                          </td>
                          <td className="py-3 pr-4 text-xs" style={{ color: '#999' }}>{b.pickup} → {b.destination}</td>
                          <td className="py-3 pr-4 text-white">{VEHICLE_LABELS[b.vehicle_type] ?? b.vehicle_type}</td>
                          <td className="py-3 pr-4" style={{ color: '#D4AF37' }}>${b.amount_usd}</td>
                          <td className="py-3"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ─────── LEADS TAB ─────── */}
        {activeTab === 'leads' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Leads</h1>
              <p className="text-sm" style={{ color: '#888' }}>Users who initiated a booking but haven&apos;t completed payment</p>
            </div>

            {/* Edit Lead Modal */}
            {editingLead && (
              <div className="rounded-xl p-6 mb-8" style={{ background: '#111', border: '1px solid #B8960C' }}>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#D4AF37' }}>
                    Edit Lead: {editingLead.customer_name}
                  </p>
                  <button onClick={() => setEditingLead(null)} className="text-xs text-[#aaa] hover:text-red-400 transition-colors">
                    Cancel
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Name</label>
                    <input type="text" value={editingLead.customer_name || ''} onChange={(e) => setEditingLead({...editingLead, customer_name: e.target.value})} className="rounded-lg px-4 py-3 text-sm outline-none bg-[#0a0a0a] border border-[#1e1e1e]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Email</label>
                    <input type="email" value={editingLead.customer_email || ''} onChange={(e) => setEditingLead({...editingLead, customer_email: e.target.value})} className="rounded-lg px-4 py-3 text-sm outline-none bg-[#0a0a0a] border border-[#1e1e1e]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Phone</label>
                    <input type="tel" value={editingLead.customer_phone || ''} onChange={(e) => setEditingLead({...editingLead, customer_phone: e.target.value})} className="rounded-lg px-4 py-3 text-sm outline-none bg-[#0a0a0a] border border-[#1e1e1e]" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Pickup</label>
                    <input type="text" value={editingLead.pickup || ''} onChange={(e) => setEditingLead({...editingLead, pickup: e.target.value})} className="rounded-lg px-4 py-3 text-sm outline-none bg-[#0a0a0a] border border-[#1e1e1e]" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Destination</label>
                    <input type="text" value={editingLead.destination || ''} onChange={(e) => setEditingLead({...editingLead, destination: e.target.value})} className="rounded-lg px-4 py-3 text-sm outline-none bg-[#0a0a0a] border border-[#1e1e1e]" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      await updateLead(editingLead.id, {
                        customer_name: editingLead.customer_name,
                        customer_email: editingLead.customer_email,
                        customer_phone: editingLead.customer_phone,
                        pickup: editingLead.pickup,
                        destination: editingLead.destination
                      })
                      setEditingLead(null)
                    }}
                    className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                  >
                    Save Changes
                  </button>
                  <button onClick={() => setEditingLead(null)} className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest border border-[#1e1e1e]">
                    Dismiss
                  </button>
                </div>
              </div>
            )}

            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr style={{ color: '#888' }}>
                      {['Customer', 'Trip / Route', 'Itinerary', 'Pax & Vehicle', 'Value', 'Pipeline'].map((h) => (
                        <th key={h} className="py-2 pr-4 text-xs uppercase tracking-widest font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.length === 0 && (
                      <tr><td colSpan={6} className="py-6 text-center text-sm italic" style={{ color: '#888' }}>No leads yet. Use the form below to add one manually.</td></tr>
                    )}
                    {leads.map((l) => (
                      <tr key={l.id} style={{ borderTop: '1px solid #1a1a1a' }} className="hover:bg-[#1a1a1a40] transition-colors">
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold">{l.customer_name || 'Anonymous'}</p>
                          <p className="text-xs text-[#888]">{l.customer_email || 'No email'}</p>
                          {l.customer_phone && <p className="text-xs text-[#B8960C] font-mono">{l.customer_phone}</p>}
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded" style={{ background: l.trip_type === 'round-trip' ? '#B8960C20' : '#88820', color: l.trip_type === 'round-trip' ? '#B8960C' : '#888', width: 'fit-content' }}>
                              {l.trip_type === 'round-trip' ? 'Round Trip' : 'One Way'}
                            </span>
                            <p className="text-xs text-white leading-relaxed">{l.pickup} <br/><span className="text-[#555] font-bold">→</span> {l.destination}</p>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-bold">{formatDateUS(l.date)}</span>
                              <span className="text-[10px] text-[#888]">{l.time || '—'}</span>
                            </div>
                            {l.trip_type === 'round-trip' && l.return_date && (
                              <div className="flex items-center gap-2 pt-1 border-t border-[#1a1a1a]">
                                <span className="text-[#888] font-bold text-xs">{formatDateUS(l.return_date)}</span>
                                <span className="text-[10px] text-[#555]">{l.return_time}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white">{l.passengers || 1} PAX</span>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest" style={{ color: '#D4AF37' }}>
                              {VEHICLE_LABELS[l.vehicle_type] ?? l.vehicle_type}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                           <p className="text-lg font-bold" style={{ color: '#4ade80' }}>
                             ${l.amount_usd || '—'}
                           </p>
                           <span className="text-[9px] uppercase tracking-widest text-[#555]">Estimated Total</span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-col gap-2">
                            <select 
                              value={l.status || 'new'} 
                              onChange={(e) => updateLead(l.id, { status: e.target.value })}
                              className="w-full text-xs rounded-lg border border-[#1e1e1e] p-1.5 outline-none font-bold tracking-wider uppercase disabled:opacity-50"
                              style={{ 
                                backgroundColor: l.status === 'converted' ? '#163316' : l.status === 'lost' ? '#331616' : '#0a0a0a',
                                color: l.status === 'converted' ? '#4CAF50' : l.status === 'lost' ? '#F44336' : '#FFFFFF' 
                              }}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="quoted">Quoted</option>
                              <option value="converted">Converted</option>
                              <option value="lost">Lost</option>
                            </select>
                            <input 
                              type="text"
                              defaultValue={l.notes || ''}
                              placeholder="Notes..."
                              onBlur={(e) => updateLead(l.id, { notes: e.target.value })}
                              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                              className="w-full text-[10px] rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-1.5 text-[#888] outline-none focus:border-[#B8960C] focus:text-white"
                            />
                            <div className="flex items-center justify-between mt-1">
                              <button 
                                onClick={() => setEditingLead(l)}
                                className="text-[10px] uppercase font-bold tracking-widest text-[#B8960C] hover:text-[#D4AF37] flex items-center gap-1"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Edit
                              </button>
                              <button 
                                onClick={() => deleteLead(l.id)}
                                className="text-[10px] uppercase font-bold tracking-widest text-red-500 hover:text-red-400 flex items-center gap-1"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                                Delete
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {/* ── ADD NEW LEAD ROW (always visible) ── */}
                    <tr style={{ borderTop: '2px dashed #B8960C' }}>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col gap-2">
                          <input type="text" placeholder="Name *" value={newLead.customerName} onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          <input type="email" placeholder="Email" value={newLead.customerEmail} onChange={(e) => setNewLead({ ...newLead, customerEmail: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          <input type="tel" placeholder="Phone" value={newLead.customerPhone} onChange={(e) => setNewLead({ ...newLead, customerPhone: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col gap-2">
                          <select
                            value={`${newLead.pickup}|||${newLead.destination}`}
                            onChange={(e) => {
                              const [p, d] = e.target.value.split('|||')
                              setNewLead({ ...newLead, pickup: p || '', destination: d || '' })
                            }}
                            className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]"
                          >
                            <option value="|||">— Select Route —</option>
                            {routePrices.map((r) => (
                              <option key={r.id} value={`${r.pickup}|||${r.destination}`}>
                                {r.pickup} → {r.destination}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <select value={newLead.vehicleType} onChange={(e) => setNewLead({ ...newLead, vehicleType: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]">
                          <option value="sedan_suv">Sedan & SUV</option>
                          <option value="suburban">Suburban</option>
                          <option value="sprinter">Sprinter</option>
                          <option value="minibus">Mini Bus</option>
                          <option value="coachbus">Coach Bus</option>
                        </select>
                      </td>
                      <td colSpan={2} className="py-4 text-right">
                        <button
                          onClick={addLead}
                          disabled={addingLead || !newLead.customerName || !newLead.pickup || !newLead.destination}
                          className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
                          style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                        >
                          {addingLead ? 'Saving…' : '+ Add Lead'}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ─────── QR CODES TAB ─────── */}
        {activeTab === 'qr' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>QR Code Generator</h1>
              <p className="text-sm" style={{ color: '#888' }}>Generate branded QR codes for hotel partners</p>
            </div>

            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  type="text"
                  placeholder="hotel-slug (e.g. partner-slug)"
                  value={qrSlug}
                  onChange={(e) => setQrSlug(e.target.value)}
                  className="flex-1 min-w-[220px] rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[#B8960C]"
                  style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#FFFFFF' }}
                />
                <button
                  onClick={generateQR}
                  className="px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                >
                  Generate QR
                </button>
              </div>
              {qrDataUrl && (
                <div className="mt-8 flex flex-col items-start gap-4">
                  <div className="p-4 bg-white rounded-xl">
                    <Image src={qrDataUrl} alt="QR Code" width={192} height={192} className="w-48 h-48" />
                  </div>
                  <a
                    href={qrDataUrl}
                    download={`expresslift-qr-${qrSlug}.png`}
                    className="text-xs uppercase tracking-widest font-bold transition-colors hover:text-[#D4AF37]"
                    style={{ color: '#B8960C' }}
                  >
                    ↓ Download PNG
                  </a>
                </div>
              )}
            </section>
          </div>
        )}

      </main>
    </div>
  )
}
