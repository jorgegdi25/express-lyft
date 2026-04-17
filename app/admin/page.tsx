'use client'

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

/* ── Sample Client Data ─────────────────────────────── */

const SAMPLE_CLIENTS: Client[] = [
  {
    id: 'c1',
    name: 'James Whitmore',
    email: 'james.whitmore@gmail.com',
    phone: '+1 (954) 555-0123',
    hotel: 'B Ocean Resort',
    totalTrips: 12,
    totalSpent: 2340,
    status: 'vip',
    lastTrip: '2026-04-15',
    notes: 'Prefers SUV. Always tips well. Requests water bottles.',
  },
  {
    id: 'c2',
    name: 'María García',
    email: 'maria.garcia@outlook.com',
    phone: '+1 (305) 555-0456',
    hotel: 'Ritz-Carlton Miami',
    totalTrips: 5,
    totalSpent: 980,
    status: 'active',
    lastTrip: '2026-04-12',
    notes: 'Bilingual (ES/EN). Frequent cruise passenger.',
  },
  {
    id: 'c3',
    name: 'Robert Chen',
    email: 'r.chen@icloud.com',
    phone: '+1 (786) 555-0789',
    hotel: 'B Ocean Resort',
    totalTrips: 3,
    totalSpent: 540,
    status: 'active',
    lastTrip: '2026-03-28',
    notes: 'Group traveler, usually 6+ passengers. Needs Sprinter.',
  },
  {
    id: 'c4',
    name: 'Linda Thompson',
    email: 'linda.t@yahoo.com',
    phone: '+1 (954) 555-0321',
    hotel: 'B Ocean Resort',
    totalTrips: 8,
    totalSpent: 1760,
    status: 'vip',
    lastTrip: '2026-04-10',
    notes: 'Corporate client. Needs receipts for every trip.',
  },
  {
    id: 'c5',
    name: 'David Park',
    email: 'd.park@gmail.com',
    phone: '+1 (305) 555-0654',
    hotel: 'B Ocean Resort',
    totalTrips: 1,
    totalSpent: 180,
    status: 'inactive',
    lastTrip: '2026-02-14',
    notes: 'One-time visitor. Arrived late, may need follow-up.',
  },
]

/* ── Sample Bookings Data ───────────────────────────── */

const SAMPLE_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    hotel_slug: 'bocean-resort',
    vehicle_type: 'suv',
    amount_usd: 195,
    status: 'paid',
    date: '2026-04-15',
    created_at: '2026-04-14T18:30:00Z',
    pickup: 'B Ocean Resort',
    destination: 'Miami International Airport',
    customer_name: 'James Whitmore',
    customer_email: 'james.whitmore@gmail.com',
  },
  {
    id: 'b2',
    hotel_slug: 'bocean-resort',
    vehicle_type: 'minivan',
    amount_usd: 220,
    status: 'paid',
    date: '2026-04-14',
    created_at: '2026-04-13T09:15:00Z',
    pickup: 'B Ocean Resort',
    destination: 'Port Everglades (Cruise Terminal)',
    customer_name: 'María García',
    customer_email: 'maria.garcia@outlook.com',
  },
  {
    id: 'b3',
    hotel_slug: 'bocean-resort',
    vehicle_type: 'sprinter',
    amount_usd: 340,
    status: 'paid',
    date: '2026-04-12',
    created_at: '2026-04-11T14:00:00Z',
    pickup: 'B Ocean Resort',
    destination: 'Fort Lauderdale Airport (FLL)',
    customer_name: 'Robert Chen',
    customer_email: 'r.chen@icloud.com',
  },
  {
    id: 'b4',
    hotel_slug: 'bocean-resort',
    vehicle_type: 'suv',
    amount_usd: 175,
    status: 'paid',
    date: '2026-04-10',
    created_at: '2026-04-09T20:45:00Z',
    pickup: 'B Ocean Resort',
    destination: 'Miami International Airport',
    customer_name: 'Linda Thompson',
    customer_email: 'linda.t@yahoo.com',
  },
  {
    id: 'b5',
    hotel_slug: 'bocean-resort',
    vehicle_type: 'suv',
    amount_usd: 195,
    status: 'paid',
    date: '2026-04-08',
    created_at: '2026-04-07T11:30:00Z',
    pickup: 'B Ocean Resort',
    destination: 'Port Everglades (Cruise Terminal)',
    customer_name: 'James Whitmore',
    customer_email: 'james.whitmore@gmail.com',
  },
  {
    id: 'b6',
    hotel_slug: 'bocean-resort',
    vehicle_type: 'suv',
    amount_usd: 180,
    status: 'pending',
    date: '2026-04-16',
    created_at: '2026-04-16T08:00:00Z',
    pickup: 'B Ocean Resort',
    destination: 'Fort Lauderdale Airport (FLL)',
    customer_name: 'Sarah Williams',
    customer_email: 'sarah.w@gmail.com',
  },
]

/* ── Sample Leads Data ──────────────────────────────── */

const SAMPLE_LEADS: Lead[] = [
  {
    id: 'l1',
    hotel_slug: 'bocean-resort',
    customer_name: 'Michael Brown',
    customer_email: 'mbrown@hotmail.com',
    pickup: 'B Ocean Resort',
    destination: 'Miami International Airport',
    vehicle_type: 'suv',
    created_at: '2026-04-16T14:22:00Z',
  },
  {
    id: 'l2',
    hotel_slug: 'bocean-resort',
    customer_name: 'Jennifer Lee',
    customer_email: 'jlee@gmail.com',
    pickup: 'B Ocean Resort',
    destination: 'Port Everglades (Cruise Terminal)',
    vehicle_type: 'minivan',
    created_at: '2026-04-15T10:05:00Z',
  },
  {
    id: 'l3',
    hotel_slug: 'bocean-resort',
    customer_name: 'Carlos Rodríguez',
    customer_email: 'carlos.r@yahoo.com',
    pickup: 'B Ocean Resort',
    destination: 'Fort Lauderdale Airport (FLL)',
    vehicle_type: 'sprinter',
    created_at: '2026-04-14T16:40:00Z',
  },
  {
    id: 'l4',
    hotel_slug: 'bocean-resort',
    customer_name: '',
    customer_email: 'anon.user@temp.com',
    pickup: 'B Ocean Resort',
    destination: 'Miami International Airport',
    vehicle_type: 'suv',
    created_at: '2026-04-13T08:15:00Z',
  },
]

/* ── Sample Routes Data ─────────────────────────────── */

const SAMPLE_ROUTES: RoutePricing[] = [
  {
    id: 'r1',
    hotel_slug: 'bocean-resort',
    pickup: 'The Hotel',
    destination: 'Miami International Airport (MIA)',
    sedan_suv_price: 155,
    suburban_price: 200,
    sprinter_price: 280,
    minibus_price: 450,
    coachbus_price: 800,
  },
  {
    id: 'r2',
    hotel_slug: 'bocean-resort',
    pickup: 'The Hotel',
    destination: 'Fort Lauderdale Airport (FLL)',
    sedan_suv_price: 180,
    suburban_price: 220,
    sprinter_price: 310,
    minibus_price: 500,
    coachbus_price: 850,
  },
  {
    id: 'r3',
    hotel_slug: 'bocean-resort',
    pickup: 'The Hotel',
    destination: 'Port Everglades (Cruise Terminal)',
    sedan_suv_price: 120,
    suburban_price: 160,
    sprinter_price: 250,
    minibus_price: 480,
    coachbus_price: 820,
  },
]

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

  const [bookings, setBookings] = useState<Booking[]>(SAMPLE_BOOKINGS)
  const [loadingBookings, setLoadingBookings] = useState(false)

  const [qrSlug, setQrSlug] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const [leads, setLeads] = useState<Lead[]>(SAMPLE_LEADS)
  const [addingLead, setAddingLead] = useState(false)
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
  const [clients, setClients] = useState<Client[]>(SAMPLE_CLIENTS)
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



  async function fetchBookings(pw: string) {
    const res = await fetch('/api/admin/bookings', {
      headers: { authorization: `Bearer ${pw}` },
    })
    if (!res.ok) return []
    return res.json() as Promise<Booking[]>
  }

  async function fetchRoutes(pw: string) {
    const res = await fetch('/api/admin/routes', {
      headers: { authorization: `Bearer ${pw}` },
    })
    if (!res.ok) return []
    return res.json() as Promise<RoutePricing[]>
  }

  async function fetchLeads(pw: string) {
    const res = await fetch('/api/admin/leads', {
      headers: { authorization: `Bearer ${pw}` },
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

    setBookings([...bk, ...SAMPLE_BOOKINGS])
    const mergedRoutes = [...rt, ...SAMPLE_ROUTES]
    setRoutePrices(mergedRoutes)
    setLeads([...ld, ...SAMPLE_LEADS])
    setEditRoutePrices(
      Object.fromEntries(
        mergedRoutes.map((r) => [
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
    await fetch('/api/admin/routes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${password}`,
      },
      body: JSON.stringify(newRoute),
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
    setAddingRoute(false)
    setNewRoute((prev) => ({ ...prev, pickup: '', destination: '' }))
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
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newLead)
    })
    const data = await fetchLeads(password)
    setLeads([...data])
    setAddingLead(false)
    setNewLead({ hotelSlug: 'bocean-resort', customerName: '', customerEmail: '', customerPhone: '', pickup: '', destination: '', vehicleType: 'sedan_suv', status: 'new', notes: '' })
  }

  async function updateLead(id: string, updates: Partial<Lead>) {
    // Optimistic UI update
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
    await fetch('/api/leads', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
      body: JSON.stringify({ id, ...updates })
    }).catch((e) => console.error('Failed to update lead', e))
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
                          <td className="py-3 pr-4 text-white">{b.date}</td>
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
                    { label: 'Hotel', key: 'hotel' as const, type: 'text', placeholder: 'B Ocean Resort' },
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
                          <td className="py-3 pr-4 text-white">{b.date}</td>
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

            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              {leads.length === 0 ? (
                <p className="text-sm italic" style={{ color: '#888' }}>
                  No leads captured yet. Data will appear when users start the booking process.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ color: '#888' }}>
                        {['Customer', 'Route', 'Details', 'Pipeline', 'Date'].map((h) => (
                          <th key={h} className="py-2 pr-4 text-xs uppercase tracking-widest font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((l) => (
                        <tr key={l.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                          <td className="py-4 pr-4">
                            <p className="text-white font-bold">{l.customer_name || 'Anonymous'}</p>
                            <p className="text-xs text-[#888]">{l.customer_email || 'No email'}</p>
                            {l.customer_phone && <p className="text-xs text-[#B8960C]">{l.customer_phone}</p>}
                          </td>
                          <td className="py-4 pr-4 text-xs text-white break-words max-w-[150px]">{l.pickup} <br/><span className="text-[#888]">to</span><br/> {l.destination}</td>
                          <td className="py-4 pr-4">
                            <span className="text-xs uppercase font-bold tracking-widest block mb-1" style={{ color: '#D4AF37' }}>{l.vehicle_type}</span>
                            <span className="text-xs uppercase text-[#888]">{l.hotel_slug}</span>
                          </td>
                          <td className="py-4 pr-4">
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
                                placeholder="Add notes..."
                                onBlur={(e) => updateLead(l.id, { notes: e.target.value })}
                                className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-1.5 text-[#888] outline-none focus:border-[#B8960C] focus:text-white"
                              />
                            </div>
                          </td>
                          <td className="py-4 text-xs" style={{ color: '#888' }}>{new Date(l.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                      
                      {/* Add New Lead */}
                      <tr style={{ borderTop: '1px solid #1a1a1a' }}>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-2">
                            <input type="text" placeholder="Name" value={newLead.customerName} onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                            <input type="email" placeholder="Email" value={newLead.customerEmail} onChange={(e) => setNewLead({ ...newLead, customerEmail: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                            <input type="tel" placeholder="Phone" value={newLead.customerPhone} onChange={(e) => setNewLead({ ...newLead, customerPhone: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-2">
                            <input type="text" placeholder="Pickup (e.g. B Ocean Resort)" value={newLead.pickup} onChange={(e) => setNewLead({ ...newLead, pickup: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                            <input type="text" placeholder="Destination" value={newLead.destination} onChange={(e) => setNewLead({ ...newLead, destination: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <select value={newLead.vehicleType} onChange={(e) => setNewLead({ ...newLead, vehicleType: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C] mb-2">
                            <option value="sedan_suv">Sedan & SUV</option>
                            <option value="suburban">Suburban</option>
                            <option value="sprinter">Sprinter</option>
                            <option value="minibus">Mini Bus</option>
                            <option value="coachbus">Coach Bus</option>
                          </select>
                          <input type="text" placeholder="Hotel Slug" value={newLead.hotelSlug} onChange={(e) => setNewLead({ ...newLead, hotelSlug: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-[#666] outline-none" />
                        </td>
                        <td className="py-4 pr-4">
                           <p className="text-xs text-[#666] italic mb-1">Status and notes edit available after adding.</p>
                        </td>
                        <td className="py-4 text-right">
                          <button
                            onClick={addLead}
                            disabled={addingLead || !newLead.customerName || !newLead.pickup}
                            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                            style={{ border: '2px dashed #B8960C', color: '#B8960C' }}
                          >
                            {addingLead ? 'Wait…' : '+ Add'}
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
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
                  placeholder="hotel-slug (e.g. ritz-carlton-miami)"
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
                    <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
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
