'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'

/* -- Interfaces --------------------------------------- */


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
  customer_phone?: string
  time?: string
  passengers?: number
  trip_type?: string
  assigned_driver_id?: string
  airline?: string
  flight_number?: string
  meeting_type?: string
  meet_greet_fee?: number
  car_seats_requested?: number
  luggage_count?: number
}

interface Driver {
  id: string
  name: string
  phone: string
  vehicle_type: string
  license_plate: string
  status: string
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
  customer_country?: string
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
  amount_paid?: number
  amount_remaining?: number
  trip_type?: string
  assigned_driver_id?: string | null
  airline?: string
  flight_number?: string
  meeting_type?: string
  meet_greet_fee?: number
  car_seats_requested?: number
  luggage_count?: number
  wait_time_minutes?: number
  wait_time_fee?: number
}

interface Client {
  id: string
  name: string
  email: string
  phone: string
  hotel_slug: string
  total_trips: number
  total_spent: number
  status: 'active' | 'vip' | 'inactive'
  last_trip_date: string
  notes: string
}

const VEHICLE_LABELS: Record<string, string> = {
  sedan_suv: 'Sedan & SUV',
  suburban: 'Chevy Suburban',
  sprinter: 'Mercedes-Benz Sprinter',
  minibus: '31 Passenger Mini Bus',
  coachbus: '55 Passenger Bus',
}

type TabKey = 'dashboard' | 'clients' | 'routes' | 'bookings' | 'leads' | 'quotes' | 'qr' | 'revenue' | 'drivers' | 'dispatch' | 'assign'





/* -- Sidebar Icon Components -------------------------- */

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
function IconAssign() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
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
function IconQuotes() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
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
function IconRevenue() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}
function IconDrivers() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <circle cx="12" cy="13" r="2" />
      <path d="M8 21v-2a4 4 0 0 1 8 0v2" />
    </svg>
  )
}
function IconDispatch() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="14" x2="16" y2="14" />
      <line x1="8" y1="18" x2="12" y2="18" />
    </svg>
  )
}

/* -- Main Admin Page ---------------------------------- */

export default function AdminPage() {
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(false)

  const [qrSlug, setQrSlug] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

  const [showDriverForm, setShowDriverForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
  const [savingDriver, setSavingDriver] = useState(false)
  const [newDriver, setNewDriver] = useState({
    name: '',
    phone: '',
    vehicle_type: 'sedan_suv',
    license_plate: '',
    status: 'available'
  })

  const [metrics, setMetrics] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [addingLead, setAddingLead] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null)
  const [newLead, setNewLead] = useState({
    hotelSlug: 'bocean-resort', 
    customerName: '', 
    customerEmail: '', 
    customerPhone: '', 
    customerCountry: '',
    pickup: '', 
    destination: '', 
    vehicleType: 'sedan_suv', 
    status: 'new', 
    notes: '',
    passengers: 1,
    date: '',
    time: '',
    amountUsd: 0,
    tripType: 'one-way' as 'one-way' | 'round-trip'
  })

  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [expandedNotes, setExpandedNotes] = useState<string[]>([])

  const [routePrices, setRoutePrices] = useState<RoutePricing[]>([])
  const [editRouteData, setEditRouteData] = useState<Record<string, { pickup: string; destination: string; hotel_slug: string; sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }>>({})
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

  const uniqueLocationsList = useMemo(() => {
    const locs = new Set<string>()
    // Add default popular locations
    locs.add('The Hotel')
    locs.add('Miami International Airport (MIA)')
    locs.add('Fort Lauderdale Airport (FLL)')
    locs.add('PortMiami (Cruise Terminal)')
    locs.add('Port Everglades (Cruise Terminal)')
    
    // Add locations from current routes to ensure we list existing ones
    routePrices.forEach((rp) => {
      if (rp.pickup) locs.add(rp.pickup.trim())
      if (rp.destination) locs.add(rp.destination.trim())
    })
    
    return Array.from(locs)
  }, [routePrices])

  // Client CRUD state
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [showClientForm, setShowClientForm] = useState(false)
  const [clientForm, setClientForm] = useState<Omit<Client, 'id'>>({
    name: '',
    email: '',
    phone: '',
    hotel_slug: '',
    total_trips: 0,
    total_spent: 0,
    status: 'active',
    last_trip_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  // Bookings pagination & search
  const [bookingsSearch, setBookingsSearch] = useState('')
  const [bookingsPage, setBookingsPage] = useState(1)
  const bookingsPerPage = 15

  // Leads pagination, search & sort
  const [leadsPage, setLeadsPage] = useState(1)
  const [leadsSearch, setLeadsSearch] = useState('')
  const [leadsStatusFilter, setLeadsStatusFilter] = useState('all')
  const [leadsSortBy, setLeadsSortBy] = useState('newest')
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const leadsPerPage = 15

  // Dynamic Stripe link generation state
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)

  // Revenue computations
  const revenueStats = useMemo(() => {
    // 1. Bookings (Confirmed Trips)
    const bookingsTotal = bookings.reduce((sum, b) => sum + (b.amount_usd || 0), 0)
    
    // 2. Leads (Deposit Paid)
    const depositLeads = leads.filter(l => l.status === 'deposit_paid')
    const depositPaidOnline = depositLeads.reduce((sum, l) => sum + (l.amount_paid || 0), 0)
    const depositRemainingCash = depositLeads.reduce((sum, l) => sum + (l.amount_remaining || 0), 0)

    // 3. Gross Revenue
    const grossRevenue = bookingsTotal + depositPaidOnline + depositRemainingCash

    // 4. Monthly Breakdown
    const monthlyData: Record<string, number> = {}
    bookings.forEach(b => {
      if (!b.date) return
      const month = b.date.substring(0, 7) // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + (b.amount_usd || 0)
    })

    // 5. Top Routes
    const routesData: Record<string, { count: number; revenue: number }> = {}
    bookings.forEach(b => {
      const routeKey = `${b.pickup} -> ${b.destination}`
      if (!routesData[routeKey]) routesData[routeKey] = { count: 0, revenue: 0 }
      routesData[routeKey].count += 1
      routesData[routeKey].revenue += (b.amount_usd || 0)
    })

    const topRoutes = Object.entries(routesData)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)

    return {
      bookingsTotal,
      depositPaidOnline,
      depositRemainingCash,
      grossRevenue,
      monthlyData: Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])),
      topRoutes
    }
  }, [bookings, leads])

  /* -- API Fetchers -- */

  
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

  function timeAgo(dateStr: string) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
    let interval = Math.floor(seconds / 31536000)
    if (interval >= 1) return interval + 'y ago'
    interval = Math.floor(seconds / 2592000)
    if (interval >= 1) return interval + 'mo ago'
    interval = Math.floor(seconds / 86400)
    if (interval >= 1) return interval + 'd ago'
    interval = Math.floor(seconds / 3600)
    if (interval >= 1) return interval + 'h ago'
    interval = Math.floor(seconds / 60)
    if (interval >= 1) return interval + 'm ago'
    return 'Just now'
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
    const data = await res.json() as RoutePricing[]
    return data.sort((a, b) => 
      a.pickup.localeCompare(b.pickup) || a.destination.localeCompare(b.destination)
    )
  }

  async function fetchLeads(pw: string) {
    const res = await fetch(`/api/leads?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<Lead[]>
  }

  async function fetchClients(pw: string) {
    const res = await fetch(`/api/admin/clients?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<Client[]>
  }

  async function fetchDrivers(pw: string) {
    const res = await fetch(`/api/admin/drivers?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<Driver[]>
  }

  /* -- Auth -- */

  useEffect(() => {
    const savedPass = localStorage.getItem('admin_pass')
    if (savedPass) {
      setPassword(savedPass)
      performLogin(savedPass).finally(() => setCheckingSession(false))
    } else {
      setCheckingSession(false)
    }
  }, [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    await performLogin(password)
  }

  async function performLogin(pw: string) {
    setAuthError('')

    // First, just verify the password by checking if the API accepts it
    const testRes = await fetch('/api/admin/prices', {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })

    // 401 means wrong password; anything else (200, 500) means password was accepted
    if (testRes.status === 401) {
      setAuthError('Incorrect password.')
      localStorage.removeItem('admin_pass')
      return
    }

    localStorage.setItem('admin_pass', pw)
    setAuthed(true)
    setLoadingBookings(true)

    // Try to load data, but don't fail if Supabase tables are missing
    let bk: Booking[] = []
    let rt: RoutePricing[] = []
    let ld: Lead[] = []
    let cl: Client[] = []

    try {
      const [bData, rData, lData, cData, dData] = await Promise.all([
        fetchBookings(pw),
        fetchRoutes(pw),
        fetchLeads(pw),
        fetchClients(pw),
        fetchDrivers(pw)
      ])
      
      setBookings(bData)
      setRoutePrices(rData)
      setLeads(lData)
      setClients(cData)
      setDrivers(dData)
      bk = bData
      rt = rData
      ld = lData
      cl = cData
    } catch {
      // Data loading failed, continue with sample data
    }

    setBookings(bk)
    setRoutePrices(rt)
    setLeads(ld)
    setClients(cl)
    setEditRouteData(
      Object.fromEntries(
        rt.map((r) => [
          r.id,
          { pickup: r.pickup, destination: r.destination, hotel_slug: r.hotel_slug, sedan_suv: r.sedan_suv_price, suburban: r.suburban_price, sprinter: r.sprinter_price, minibus: r.minibus_price, coachbus: r.coachbus_price },
        ])
      )
    )
    setLoadingBookings(false)
  }

  function handleLogout() {
    localStorage.removeItem('admin_pass')
    setPassword('')
    setAuthed(false)
  }

  /* -- Route CRUD -- */

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
    setEditRouteData(
      Object.fromEntries(
        data.map((r) => [
          r.id,
          { pickup: r.pickup, destination: r.destination, hotel_slug: r.hotel_slug, sedan_suv: r.sedan_suv_price, suburban: r.suburban_price, sprinter: r.sprinter_price, minibus: r.minibus_price, coachbus: r.coachbus_price },
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
      setEditRouteData(
        Object.fromEntries(
          data.map((r) => [
            r.id,
            { pickup: r.pickup, destination: r.destination, hotel_slug: r.hotel_slug, sedan_suv: r.sedan_suv_price, suburban: r.suburban_price, sprinter: r.sprinter_price, minibus: r.minibus_price, coachbus: r.coachbus_price },
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
    if (!confirm('⚠️ Are you sure you want to PERMANENTLY DELETE this route?')) return
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
        headers: { 
          'Content-Type': 'application/json',
          authorization: `Bearer ${password}`
        },
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
      setNewLead({ 
        hotelSlug: 'bocean-resort', 
        customerName: '', 
        customerEmail: '', 
        customerPhone: '', 
        customerCountry: '',
        pickup: '', 
        destination: '', 
        vehicleType: 'sedan_suv', 
        status: 'new', 
        notes: '',
        passengers: 1,
        date: '',
        time: '',
        amountUsd: 0,
        tripType: 'one-way'
      })
    } catch (err) {
      alert(`Network error adding lead: ${err}`)
    }
    setAddingLead(false)
  }

  async function updateLead(id: string, updates: Partial<Lead>) {
    // Optimistic UI update
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, ...updates } : l)))
    try {
      // Map camelCase to snake_case if necessary for the API
      const payload = { 
        id, 
        ...updates,
        amountUsd: updates.amount_usd,
        tripType: updates.trip_type,
        customerName: updates.customer_name,
        customerEmail: updates.customer_email,
        customerPhone: updates.customer_phone,
        vehicleType: updates.vehicle_type,
        returnDate: updates.return_date,
        returnTime: updates.return_time
      }
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
        body: JSON.stringify(payload)
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
    } catch (e: any) {
      alert(e.message)
    }
  }

  async function sendInvoice(leadId: string) {
    if (!confirm('Are you sure you want to send an invoice via email to this customer?')) return
    setSendingInvoice(leadId)
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ leadId })
      })
      const data = await res.json()
      if (data.success) {
        alert('Invoice sent successfully!')
        updateLead(leadId, { status: 'invoice_sent' })
      } else {
        alert('Error: ' + data.error)
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setSendingInvoice(null)
    }
  }

  async function generateStripeLink(leadId: string) {
    setGeneratingLink(leadId)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId })
      })
      const data = await res.json()
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        alert('Stripe Payment Link generated and copied to clipboard!')
        fetchLeads(password).then(setLeads)
      } else {
        alert('Failed to generate Stripe link: ' + (data.error || 'Unknown error'))
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setGeneratingLink(null)
    }
  }

  async function generateRemainingStripeLink(leadId: string) {
    setGeneratingLink(leadId)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, generateRemainingLink: true })
      })
      const data = await res.json()
      if (data.url) {
        await navigator.clipboard.writeText(data.url)
        alert('Stripe Payment Link for REMAINING BALANCE generated and copied to clipboard!')
      } else {
        alert('Failed to generate Stripe link: ' + (data.error || 'Unknown error'))
      }
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setGeneratingLink(null)
    }
  }


  /* -- QR -- */

  /* -- WhatsApp -- */
  const openWhatsApp = (phone: string | null | undefined, message: string) => {
    if (!phone) return;
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '1' + cleanPhone;
    }
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const [qrUrl, setQrUrl] = useState('')

  async function generateQR() {
    if (!qrSlug) return

    // Calculate short prefix for domain
    let prefix = 'www';
    if (qrSlug === 'bocean-resort') {
      prefix = 'bo';
    } else {
      // For example: 'hilton-miami' -> 'hm'
      prefix = qrSlug.trim().split('-').map(word => word ? word[0] : '').join('');
    }

    const url = `https://${prefix.toLowerCase()}.explyft.com`;
    setQrUrl(url);
    const dataUrl = await QRCode.toDataURL(url, {
      width: 800,
      margin: 2,
      color: { dark: '#111111', light: '#FFFFFF' },
    })
    setQrDataUrl(dataUrl)
  }

  /* -- Client CRUD (DB Connected) -- */

  async function handleSaveClient() {
    setLoadingClients(true)
    try {
      if (editingClient) {
        const res = await fetch('/api/admin/clients', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${password}`
          },
          body: JSON.stringify({ ...clientForm, id: editingClient.id })
        })
        if (res.ok) {
          const { client } = await res.json()
          setClients(prev => prev.map(c => c.id === client.id ? client : c))
        }
      } else {
        const res = await fetch('/api/admin/clients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${password}`
          },
          body: JSON.stringify(clientForm)
        })
        if (res.ok) {
          const { client } = await res.json()
          setClients(prev => [client, ...prev])
        }
      }
      resetClientForm()
    } catch (err) {
      console.error('Error saving client:', err)
    } finally {
      setLoadingClients(false)
    }
  }

  function handleEditClient(client: Client) {
    setEditingClient(client)
    setClientForm({
      name: client.name,
      email: client.email,
      phone: client.phone || '',
      hotel_slug: client.hotel_slug || '',
      total_trips: client.total_trips || 0,
      total_spent: client.total_spent || 0,
      status: client.status || 'active',
      last_trip_date: client.last_trip_date || new Date().toISOString().split('T')[0],
      notes: client.notes || '',
    })
    setShowClientForm(true)
  }

  async function handleDeleteClient(id: string) {
    if (!confirm('Are you sure you want to remove this client?')) return
    setLoadingClients(true)
    try {
      const res = await fetch(`/api/admin/clients?id=${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${password}` }
      })
      if (res.ok) {
        setClients(prev => prev.filter(c => c.id !== id))
      }
    } catch (err) {
      console.error('Error deleting client:', err)
    } finally {
      setLoadingClients(false)
    }
  }

  function resetClientForm() {
    setShowClientForm(false)
    setEditingClient(null)
    setClientForm({
      name: '',
      email: '',
      phone: '',
      hotel_slug: '',
      total_trips: 0,
      total_spent: 0,
      status: 'active',
      last_trip_date: new Date().toISOString().split('T')[0],
      notes: '',
    })
  }

  /* -- Driver CRUD -- */

  async function handleSaveDriver() {
    setSavingDriver(true)
    try {
      if (editingDriver) {
        const res = await fetch('/api/admin/drivers', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${password}`
          },
          body: JSON.stringify({ ...newDriver, id: editingDriver.id })
        })
        if (res.ok) {
          const { driver } = await res.json()
          setDrivers(prev => prev.map(d => d.id === driver.id ? driver : d))
        }
      } else {
        const res = await fetch('/api/admin/drivers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${password}`
          },
          body: JSON.stringify(newDriver)
        })
        if (res.ok) {
          const { driver } = await res.json()
          setDrivers(prev => [...prev, driver])
        }
      }
      resetDriverForm()
    } catch (err) {
      console.error('Error saving driver:', err)
    } finally {
      setSavingDriver(false)
    }
  }

  function handleEditDriver(driver: Driver) {
    setEditingDriver(driver)
    setNewDriver({
      name: driver.name,
      phone: driver.phone,
      vehicle_type: driver.vehicle_type,
      license_plate: driver.license_plate,
      status: driver.status
    })
    setShowDriverForm(true)
  }

  async function handleDeleteDriver(id: string) {
    if (!confirm('Are you sure you want to remove this driver?')) return
    setSavingDriver(true)
    try {
      const res = await fetch(`/api/admin/drivers?id=${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${password}` }
      })
      if (res.ok) {
        setDrivers(prev => prev.filter(d => d.id !== id))
      }
    } catch (err) {
      console.error('Error deleting driver:', err)
    } finally {
      setSavingDriver(false)
    }
  }

  function resetDriverForm() {
    setShowDriverForm(false)
    setEditingDriver(null)
    setNewDriver({
      name: '',
      phone: '',
      vehicle_type: 'sedan_suv',
      license_plate: '',
      status: 'available'
    })
  }

  /* -- Status Badge -- */

  function StatusBadge({ status }: { status: string }) {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      vip:            { bg: 'rgba(234, 179, 8, 0.1)',  text: '#EAB308',  border: 'rgba(234, 179, 8, 0.25)' },
      active:         { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ade80',  border: 'rgba(74, 222, 128, 0.25)' },
      inactive:       { bg: 'rgba(148, 163, 184, 0.1)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' },
      paid:           { bg: 'rgba(74, 222, 128, 0.1)', text: '#4ade80',  border: 'rgba(74, 222, 128, 0.25)' },
      pending:        { bg: 'rgba(248, 113, 113, 0.1)', text: '#f87171', border: 'rgba(248, 113, 113, 0.25)' },
      deposit_paid:   { bg: 'rgba(251, 191, 36, 0.1)', text: '#FBBF24', border: 'rgba(251, 191, 36, 0.25)' },
    }
    const c = colors[status] || colors.inactive
    const displayLabel = status === 'deposit_paid' ? 'Deposit Paid' : status
    return (
      <span
        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest"
        style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      >
        {displayLabel}
      </span>
    )
  }

  /* -- Sidebar Items -- */

  const sidebarItems: { key: TabKey; label: string; icon: React.ReactNode; getBadge?: () => number }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: <IconDashboard /> },
    { key: 'revenue',   label: 'Revenue & Finance', icon: <IconRevenue /> },
    { key: 'clients',   label: 'Hotel Partners',   icon: <IconClients /> },
    { key: 'routes',    label: 'Routes & Prices',     icon: <IconRoutes /> },
    { key: 'bookings',  label: 'Confirmed Trips',   icon: <IconBookings /> },
    { key: 'leads',     label: 'Sales Pipeline', icon: <IconLeads />, getBadge: () => leads.filter(l => l.status !== 'quote_requested').length },
    { key: 'quotes',    label: 'Coach Bus Quotes', icon: <IconQuotes />, getBadge: () => leads.filter(l => l.status === 'quote_requested').length },
    { key: 'drivers',   label: 'Drivers', icon: <IconDrivers /> },
    { key: 'dispatch',  label: 'Dispatch Calendar', icon: <IconDispatch /> },
    { key: 'qr',        label: 'QR Codes',   icon: <IconQR /> },
    { key: 'assign',    label: 'Available to Talk?', icon: <IconAssign />, getBadge: () => leads.filter(l => l.status === 'pending_assignment').length },
  ]

  /* =================================================== */
  /*  LOGIN SCREEN                                       */
  /* =================================================== */

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-[#E5E5E5] font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-[#B8960C] border-t-transparent animate-spin"></div>
      </div>
    )
  }

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

  // Filter & paginate bookings
  const filteredBookings = bookings.filter((b) => {
    const term = bookingsSearch.toLowerCase()
    return (
      (b.customer_name || '').toLowerCase().includes(term) ||
      (b.customer_email || '').toLowerCase().includes(term) ||
      (b.hotel_slug || '').toLowerCase().includes(term) ||
      (b.pickup || '').toLowerCase().includes(term) ||
      (b.destination || '').toLowerCase().includes(term)
    )
  })
  const bookingsStartIndex = (bookingsPage - 1) * bookingsPerPage
  const paginatedBookings = filteredBookings.slice(bookingsStartIndex, bookingsStartIndex + bookingsPerPage)
  const bookingsTotalPages = Math.ceil(filteredBookings.length / bookingsPerPage)

  // Filter & paginate leads
  const baseLeads = activeTab === 'quotes' 
    ? leads.filter((l) => l.status === 'quote_requested') 
    : leads.filter((l) => l.status !== 'quote_requested')

  const filteredLeads = baseLeads
    .filter((l) => {
      const term = leadsSearch.toLowerCase()
      const matchesSearch = (
        (l.customer_name || '').toLowerCase().includes(term) ||
        (l.customer_email || '').toLowerCase().includes(term) ||
        (l.hotel_slug || '').toLowerCase().includes(term) ||
        (l.pickup || '').toLowerCase().includes(term) ||
        (l.destination || '').toLowerCase().includes(term) ||
        (l.status || '').toLowerCase().includes(term)
      )
      const matchesStatus = leadsStatusFilter === 'all' || l.status === leadsStatusFilter
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (leadsSortBy === 'newest') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      if (leadsSortBy === 'oldest') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      }
      if (leadsSortBy === 'amount_high') {
        return (b.amount_usd || 0) - (a.amount_usd || 0)
      }
      if (leadsSortBy === 'amount_low') {
        return (a.amount_usd || 0) - (b.amount_usd || 0)
      }
      return 0
    })
  const leadsStartIndex = (leadsPage - 1) * leadsPerPage
  const paginatedLeads = filteredLeads.slice(leadsStartIndex, leadsStartIndex + leadsPerPage)
  const leadsTotalPages = Math.ceil(filteredLeads.length / leadsPerPage)

  /* =================================================== */
  /*  MAIN DASHBOARD LAYOUT                              */
  /* =================================================== */


  return (
    <div className="flex min-h-screen" style={{ background: '#0a0a0a', color: '#FFFFFF' }}>

      {/* -- Sidebar -- */}
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
              className="flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm transition-all"
              style={{
                background: activeTab === item.key ? 'rgba(184, 150, 12, 0.08)' : 'transparent',
                color: activeTab === item.key ? '#D4AF37' : '#555',
                borderLeft: activeTab === item.key ? '2px solid #B8960C' : '2px solid transparent',
              }}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span className="font-medium tracking-wide">{item.label}</span>
              </div>
              {item.getBadge && item.getBadge() > 0 && (
                <span className="text-[10px] font-bold bg-[#B8960C] text-black px-1.5 py-0.5 rounded-full">
                  {item.getBadge!()}
                </span>
              )}
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
              onClick={handleLogout}
              className="text-xs uppercase tracking-widest hover:text-red-400 transition-colors"
              style={{ color: '#999' }}
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* -- Main Content -- */}
      <main className="flex-1 ml-[240px] p-8 max-w-6xl">

        {/* ------- DASHBOARD TAB ------- */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Dashboard</h1>
              <p className="text-sm" style={{ color: '#888' }}>Command center - Overview of your transportation business</p>
            </div>

            {/* LEAD ALERT BANNER */}
            {leads.filter(l => l.status === 'pending_payment').length > 0 && (
              <section
                onClick={() => setActiveTab('leads')}
                className="rounded-xl p-5 flex items-center gap-5 cursor-pointer hover:brightness-110 transition-all"
                style={{ background: 'linear-gradient(135deg, #B8960C15, #D4AF3720)', border: '2px solid #B8960C' }}
              >
                <div className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#B8960C' }}>
                  <span className="text-2xl font-black text-black">{leads.filter(l => l.status === 'pending_payment').length}</span>
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-white">
                    You have {leads.filter(l => l.status === 'pending_payment').length} abandoned cart{leads.filter(l => l.status === 'pending_payment').length > 1 ? 's' : ''} waiting!
                  </p>
                  <p className="text-sm text-[#999]">Click here to view incomplete reservations and send payment links</p>
                </div>
                <span className="text-sm font-bold text-[#B8960C] uppercase tracking-wider">Go to Leads &rarr;</span>
              </section>
            )}

            {/* Stats Grid */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Total Revenue', value: `$${bookings.reduce((s, b) => s + (b.amount_usd || 0), 0).toLocaleString()}`, sub: 'Paid bookings', color: '#4ade80', icon: '$' },
                { label: 'Bookings', value: bookings.length, sub: 'Completed trips', color: '#60a5fa', icon: 'B' },
                { label: 'Abandoned Carts', value: leads.filter(l => l.status === 'pending_payment').length, sub: 'Awaiting checkout', color: '#f87171', icon: 'AC' },
                { label: 'Manual Leads', value: leads.filter(l => l.status === 'new').length, sub: 'Created by admin', color: '#c084fc', icon: 'ML' },
              ].map((s) => (
                <div
                   key={s.label}
                   className="rounded-xl p-6 flex flex-col gap-3"
                   style={{ background: '#111', border: '1px solid #1a1a1a' }}
                 >
                   <p className="text-sm uppercase tracking-wider font-semibold" style={{ color: '#888' }}>
                     {s.label}
                   </p>
                   <p className="text-3xl font-bold" style={{ color: s.color }}>
                     {s.value}
                   </p>
                   <p className="text-xs uppercase tracking-wider" style={{ color: '#666' }}>
                     {s.sub}
                   </p>
                 </div>
              ))}
            </section>


            {/* Pipeline Summary */}
            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <p className="text-sm font-bold uppercase tracking-wider mb-5" style={{ color: '#888' }}>Lead Funnel / Activity</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {[
                  { status: 'new', label: 'Manual Leads', color: '#c084fc', bg: '#c084fc15', getCount: () => leads.filter(l => l.status === 'new').length },
                  { status: 'pending_payment', label: 'Abandoned Carts', color: '#f87171', bg: '#f8717115', getCount: () => leads.filter(l => l.status === 'pending_payment').length },
                  { status: 'invoice_sent', label: 'Invoices Sent', color: '#60a5fa', bg: '#60a5fa15', getCount: () => leads.filter(l => l.status === 'invoice_sent').length },
                  { status: 'deposit_paid', label: 'Deposit Paid', color: '#FBBF24', bg: '#FBBF2415', getCount: () => leads.filter(l => l.status === 'deposit_paid').length },
                  { status: 'paid', label: 'Paid Bookings', color: '#4ade80', bg: '#4ade8015', getCount: () => bookings.length },
                  { status: 'lost', label: 'Lost / Cancelled', color: '#94a3b8', bg: '#94a3b815', getCount: () => leads.filter(l => l.status === 'lost').length },
                ].map((p) => {
                  const count = p.getCount();
                  return (
                    <div key={p.status} className="rounded-xl p-4 text-center" style={{ background: p.bg, border: `1px solid ${p.color}30` }}>
                      <p className="text-2xl font-bold" style={{ color: p.color }}>{count}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: p.color }}>{p.label}</p>
                    </div>
                  );
                })}
              </div>
            </section>


            {/* RECENT LEADS - latest 5 */}
            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#888' }}>Recent Leads</p>
                <button
                  onClick={() => setActiveTab('leads')}
                  className="text-sm font-bold transition-colors hover:text-[#D4AF37] px-4 py-2 rounded-lg border border-[#333] hover:border-[#B8960C]"
                  style={{ color: '#999' }}
                >
                  View All Leads &rarr;
                </button>
              </div>
              {leads.length === 0 ? (
                <p className="text-base italic py-8 text-center" style={{ color: '#666' }}>
                  No leads yet. New booking requests will appear here automatically.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {leads.slice(0, 5).map((l) => (
                    <div
                      key={l.id}
                      className="rounded-xl p-5 flex items-center gap-5 hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                      style={{ background: '#0a0a0a', border: l.status === 'new' ? '1px solid #B8960C50' : '1px solid #1a1a1a' }}
                      onClick={() => { setActiveTab('leads'); setEditingLead(l); }}
                    >
                      {/* Status dot */}
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
                        background: l.status === 'new' ? '#c084fc' : l.status === 'pending_payment' ? '#f87171' : l.status === 'invoice_sent' ? '#60a5fa' : l.status === 'lost' ? '#94a3b8' : '#D4AF37'
                      }} />
                      {/* Customer info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <p className="text-base font-bold text-white truncate">{l.customer_name || 'Anonymous'}</p>
                          {l.status === 'new' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#c084fc20] text-[#c084fc] px-2 py-0.5 rounded-full border border-[#c084fc30]">MANUAL</span>
                          )}
                          {l.status === 'pending_payment' && (
                            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f8717120] text-[#f87171] px-2 py-0.5 rounded-full border border-[#f8717130]">ABANDONED</span>
                          )}

                          {l.customer_country && (
                            <span className="text-xs bg-blue-900/20 text-blue-400 px-2 py-0.5 rounded border border-blue-800/30 font-bold">{l.customer_country}</span>
                          )}
                        </div>
                        <p className="text-sm text-[#888] truncate">{l.pickup} &rarr; {l.destination}</p>
                      </div>
                      {/* Trip details */}
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold" style={{ color: '#4ade80' }}>{l.amount_usd ? `$${l.amount_usd}` : '--'}</p>
                        <p className="text-xs text-[#666]">{l.date ? formatDateUS(l.date) : 'No date'}</p>
                      </div>
                      {/* Status badge */}
                      <div className="flex-shrink-0">
                        <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg" style={{
                          background: l.status === 'invoice_sent' ? '#1e3a8a30' : l.status === 'pending_payment' ? '#7f1d1d30' : l.status === 'lost' ? '#33161630' : '#1a1a1a',
                          color: l.status === 'invoice_sent' ? '#60a5fa' : l.status === 'pending_payment' ? '#f87171' : l.status === 'lost' ? '#f87171' : '#999'
                        }}>{l.status === 'pending_payment' ? 'abandoned' : l.status === 'invoice_sent' ? 'invoice sent' : l.status}</span>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Recent Bookings Preview */}
            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-bold uppercase tracking-wider" style={{ color: '#888' }}>Latest Bookings</p>
                <button
                  onClick={() => setActiveTab('bookings')}
                  className="text-sm font-bold transition-colors hover:text-[#D4AF37] px-4 py-2 rounded-lg border border-[#333] hover:border-[#B8960C]"
                  style={{ color: '#999' }}
                >
                  View All &rarr;
                </button>
              </div>
              {bookings.length === 0 ? (
                <p className="text-base italic py-4" style={{ color: '#666' }}>
                  No bookings yet. They will appear here after the first completed payment.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead>
                      <tr style={{ color: '#888' }}>
                        {['Date', 'Passenger', 'Route', 'Amount', 'Status'].map((h) => (
                          <th key={h} className="text-left py-3 pr-6 text-sm uppercase tracking-wider font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.slice(0, 5).map((b) => (
                        <tr key={b.id} style={{ borderTop: '1px solid #1a1a1a' }}>
                          <td className="py-4 pr-6 text-white">{formatDateUS(b.date)}</td>
                          <td className="py-4 pr-6 text-white">{b.customer_name || 'Guest'}</td>
                          <td className="py-4 pr-6 text-sm" style={{ color: '#999' }}>{b.pickup} &rarr; {b.destination}</td>
                          <td className="py-4 pr-6 font-bold" style={{ color: '#D4AF37' }}>${b.amount_usd}</td>
                          <td className="py-4"><StatusBadge status={b.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ------- CLIENTS TAB ------- */}
        {activeTab === 'clients' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Hotel Partners</h1>
                <p className="text-sm" style={{ color: '#888' }}>Manage your B2B hotel partners and affiliates. {clients.length} total partners.</p>
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
                    { label: 'Hotel', key: 'hotel_slug' as const, type: 'text', placeholder: 'Partner Hotel' },
                  ].map(({ label, key, type, placeholder }) => (
                    <div key={key} className="flex flex-col gap-1.5">
                      <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={clientForm[key] as string}
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
                    <input type="number" value={clientForm.total_trips} onChange={(e) => setClientForm({ ...clientForm, total_trips: parseInt(e.target.value) || 0 })} className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: '#999' }}>Total Spent ($)</label>
                    <input type="number" value={clientForm.total_spent} onChange={(e) => setClientForm({ ...clientForm, total_spent: parseInt(e.target.value) || 0 })} className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: '#fff' }} />
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
                  disabled={!clientForm.name || !clientForm.email || loadingClients}
                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                >
                  {loadingClients ? 'Saving...' : (editingClient ? 'Save Changes' : 'Create Client')}
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
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs text-[#aaa]">{c.email}</p>
                            {c.phone && (
                              <button
                                onClick={() => openWhatsApp(c.phone, `Hi ${c.name}, this is Express Lyft. How can we help you today?`)}
                                className="text-[10px] bg-green-900/30 text-green-400 px-1.5 py-0.5 rounded border border-green-800/50 hover:bg-green-800/40 transition-all flex items-center gap-1"
                              >
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L22 2l-2.5 5.5Z"/></svg>
                                WhatsApp
                              </button>
                            )}
                          </div>
                          {c.phone && <p className="text-[10px] text-[#555] font-mono">{c.phone}</p>}
                        </td>
                        <td className="py-4 pr-4">
                          <p className="text-xs text-white">{c.hotel_slug}</p>
                        </td>
                        <td className="py-4 pr-4 text-white font-bold">{c.total_trips}</td>
                        <td className="py-4 pr-4 text-[#4ade80] font-mono">${c.total_spent}</td>
                        <td className="py-4 pr-4"><StatusBadge status={c.status} /></td>
                        <td className="py-4 pr-4">
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

        {/* ------- ROUTES TAB ------- */}
        {activeTab === 'routes' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Routes & Prices</h1>
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
                          <div className="flex flex-col gap-1.5 max-w-[280px]">
                            <div className="flex flex-wrap items-center gap-1.5 text-white font-semibold text-xs leading-relaxed">
                              <span className="bg-[#161616] border border-[#222] px-2.5 py-1 rounded text-gray-200">{rp.pickup}</span>
                              <span className="text-[#B8960C] font-bold">→</span>
                              <span className="bg-[#161616] border border-[#222] px-2.5 py-1 rounded text-gray-200">{rp.destination}</span>
                            </div>
                            <span className="inline-block self-start px-1.5 py-0.5 rounded bg-[#1a1708] text-[9px] text-[#B8960C] font-bold uppercase tracking-wider border border-[#332b0a]">
                              {rp.hotel_slug}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[#888]">$</span>
                            <input
                              type="number"
                              value={editRouteData[rp.id]?.sedan_suv ?? rp.sedan_suv_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
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
                              value={editRouteData[rp.id]?.suburban ?? rp.suburban_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
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
                              value={editRouteData[rp.id]?.sprinter ?? rp.sprinter_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
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
                              value={editRouteData[rp.id]?.minibus ?? rp.minibus_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
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
                              value={editRouteData[rp.id]?.coachbus ?? rp.coachbus_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
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
                                    pickup: editRouteData[rp.id]?.pickup ?? rp.pickup,
                                    destination: editRouteData[rp.id]?.destination ?? rp.destination,
                                    hotel_slug: editRouteData[rp.id]?.hotel_slug ?? rp.hotel_slug,
                                    sedan_suv_price: editRouteData[rp.id]?.sedan_suv ?? rp.sedan_suv_price,
                                    suburban_price: editRouteData[rp.id]?.suburban ?? rp.suburban_price,
                                    sprinter_price: editRouteData[rp.id]?.sprinter ?? rp.sprinter_price,
                                    minibus_price: editRouteData[rp.id]?.minibus ?? rp.minibus_price,
                                    coachbus_price: editRouteData[rp.id]?.coachbus ?? rp.coachbus_price,
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
                          <input type="text" placeholder="Pickup" value={newRoute.pickup} onChange={(e) => setNewRoute({ ...newRoute, pickup: e.target.value })} list="route-locations" className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          <input type="text" placeholder="Destination" value={newRoute.destination} onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })} list="route-locations" className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]" />
                          <select value={newRoute.hotel_slug} onChange={(e) => setNewRoute({ ...newRoute, hotel_slug: e.target.value })} className="w-full text-xs rounded-lg border border-[#1e1e1e] bg-[#0a0a0a] p-2 text-white outline-none focus:border-[#B8960C]">
                            <option value="bocean-resort">B Ocean Resort (bocean-resort)</option>
                            <option value="ritz-carlton-miami">Ritz-Carlton, Miami (ritz-carlton-miami)</option>
                            <option value="demo">Demo Hotel (demo)</option>
                          </select>
                        </div>
                        <datalist id="route-locations">
                          {uniqueLocationsList.map((loc) => (
                            <option key={loc} value={loc} />
                          ))}
                        </datalist>
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

        {/* ------- BOOKINGS TAB ------- */}
        {activeTab === 'bookings' && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Confirmed Trips</h1>
                <p className="text-sm" style={{ color: '#888' }}>Fully paid and confirmed trips. {filteredBookings.length} found ({bookings.length} total)</p>
              </div>
              <input
                type="text"
                placeholder="Search bookings..."
                value={bookingsSearch}
                onChange={(e) => { setBookingsSearch(e.target.value); setBookingsPage(1); }}
                className="rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-[#111] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors w-full md:max-w-xs"
              />
            </div>

            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              {loadingBookings ? (
                <p className="text-sm italic" style={{ color: '#888' }}>Loading…</p>
              ) : filteredBookings.length === 0 ? (
                <p className="text-sm italic" style={{ color: '#888' }}>No bookings found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ color: '#888' }}>
                        {['Date & Time', 'Passenger info', 'Route / Travel Details', 'Vehicle details', 'Price', 'Status & Action'].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-xs uppercase tracking-widest font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBookings.map((b) => (
                        <tr key={b.id} style={{ borderTop: '1px solid #1a1a1a' }} className="hover:bg-[#1a1a1a40] transition-colors">
                          <td className="py-4 pr-4 text-white">
                            <span className="font-bold block">{formatDateUS(b.date)}</span>
                            <span className="text-xs text-[#888]">{b.time || '—'}</span>
                          </td>
                          <td className="py-4 pr-4">
                            <p className="text-white text-xs font-bold">{b.customer_name || 'Guest'}</p>
                            <p className="text-xs text-[#888]">{b.customer_email || '—'}</p>
                            {b.customer_phone && <p className="text-[11px] text-[#666] font-mono">{b.customer_phone}</p>}
                          </td>
                          <td className="py-4 pr-4 text-xs" style={{ color: '#999' }}>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#33333340] text-[#888] w-fit">
                                {b.trip_type === 'round-trip' ? 'Round Trip' : 'One Way'}
                              </span>
                              <p className="text-white">{b.pickup} &rarr; {b.destination}</p>
                              {b.hotel_slug && <span className="text-[10px] text-[#555] uppercase font-semibold">Hotel: {b.hotel_slug}</span>}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-xs uppercase font-bold block" style={{ color: '#D4AF37' }}>
                              {VEHICLE_LABELS[b.vehicle_type] ?? b.vehicle_type}
                            </span>
                            <span className="text-[11px] text-[#888]">{b.passengers || 1} PAX</span>
                          </td>
                          <td className="py-4 pr-4 font-bold text-base" style={{ color: '#4ade80' }}>
                            ${b.amount_usd}
                          </td>
                          <td className="py-4 flex items-center gap-3">
                            <StatusBadge status={b.status} />
                            {b.customer_phone && (
                              <button
                                onClick={() => openWhatsApp(b.customer_phone, `Hi ${b.customer_name || 'Guest'}, this is Express Lyft. Your transfer from ${b.pickup} to ${b.destination} on ${formatDateUS(b.date)} at ${b.time} is confirmed. We look forward to picking you up!`)}
                                className="text-[11px] bg-green-900/30 text-green-400 px-2.5 py-1.5 rounded-lg border border-green-800/50 hover:bg-green-800/40 transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-7.6 8.38 8.38 0 0 1 3.8.9L22 2l-2.5 5.5Z"/></svg>
                                WhatsApp
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination controls */}
              {bookingsTotalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1a1a1a]">
                  <button
                    disabled={bookingsPage === 1}
                    onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#333] text-xs font-semibold text-[#aaa] hover:text-white disabled:opacity-40 transition-all"
                  >
                    &larr; Prev
                  </button>
                  <span className="text-xs text-[#666]">Page {bookingsPage} of {bookingsTotalPages}</span>
                  <button
                    disabled={bookingsPage === bookingsTotalPages}
                    onClick={() => setBookingsPage(p => Math.min(bookingsTotalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-[#333] text-xs font-semibold text-[#aaa] hover:text-white disabled:opacity-40 transition-all"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </section>
          </div>
        )}


        {/* ------- LEADS & QUOTES TAB ------- */}
        {(activeTab === 'leads' || activeTab === 'quotes') && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                  {activeTab === 'quotes' ? 'Coach Bus Quotes' : 'Sales Pipeline'}
                </h1>
                <p className="text-sm" style={{ color: '#888' }}>
                  {activeTab === 'quotes' 
                    ? `Manage large group requests and manual quotes. ${filteredLeads.length} found.` 
                    : `Pending reservations, abandoned carts, and leads. ${filteredLeads.length} found (${leads.length} total)`}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowAddLeadModal(true)}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                >
                  + New Reservation
                </button>
                <select
                  value={leadsStatusFilter}
                  onChange={(e) => { setLeadsStatusFilter(e.target.value); setLeadsPage(1); }}
                  className="rounded-xl px-3 py-2.5 text-sm outline-none bg-[#111] border border-[#2a2a2a] text-white focus:border-[#B8960C] transition-colors"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending_payment">Abandoned Carts</option>
                  <option value="new">Manual Leads</option>
                  <option value="deposit_paid">Deposit Paid</option>
                  <option value="paid">Paid Bookings</option>
                  <option value="invoice_sent">Invoice Sent</option>
                  <option value="lost">Lost / Cancelled</option>
                </select>
                <select
                  value={leadsSortBy}
                  onChange={(e) => { setLeadsSortBy(e.target.value); setLeadsPage(1); }}
                  className="rounded-xl px-3 py-2.5 text-sm outline-none bg-[#111] border border-[#2a2a2a] text-[#888] focus:border-[#B8960C] transition-colors"
                >
                  <option value="newest">Sort: Newest First</option>
                  <option value="oldest">Sort: Oldest First</option>
                  <option value="amount_high">Sort: Amount (High to Low)</option>
                  <option value="amount_low">Sort: Amount (Low to High)</option>
                </select>
                <input
                  type="text"
                  placeholder="Search..."
                  value={leadsSearch}
                  onChange={(e) => { setLeadsSearch(e.target.value); setLeadsPage(1); }}
                  className="rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-[#111] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors w-full sm:w-48"
                />
              </div>
            </div>

            {/* Add Lead Modal */}
            {showAddLeadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
                <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 my-auto" style={{ background: '#151515', border: '1px solid #B8960C' }}>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">+ Add New Reservation</h2>
                    <button onClick={() => setShowAddLeadModal(false)} className="text-sm text-[#aaa] hover:text-red-400 px-3 py-1 rounded-lg border border-[#333] hover:border-red-400 transition-all">x Close</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Name *</label>
                      <input type="text" placeholder="Full name" value={newLead.customerName} onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Email</label>
                      <input type="email" placeholder="email@example.com" value={newLead.customerEmail} onChange={(e) => setNewLead({ ...newLead, customerEmail: e.target.value })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Phone</label>
                      <input type="tel" placeholder="+1 (555) 123-4567" value={newLead.customerPhone} onChange={(e) => setNewLead({ ...newLead, customerPhone: e.target.value })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Country</label>
                      <input type="text" placeholder="e.g. Colombia" value={newLead.customerCountry} onChange={(e) => setNewLead({ ...newLead, customerCountry: e.target.value })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Route *</label>
                      <select value={`${newLead.pickup}|||${newLead.destination}`} onChange={(e) => { const [p, d] = e.target.value.split('|||'); setNewLead({ ...newLead, pickup: p || '', destination: d || '' }); }} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors">
                        <option value="|||">— Select Route —</option>
                        {routePrices.map((r) => (<option key={r.id} value={`${r.pickup}|||${r.destination}`}>{r.pickup} → {r.destination}</option>))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Trip Type</label>
                      <select value={newLead.tripType} onChange={(e) => setNewLead({ ...newLead, tripType: e.target.value as any })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors">
                        <option value="one-way">One Way</option>
                        <option value="round-trip">Round Trip</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Date</label>
                      <input type="date" value={newLead.date} onChange={(e) => setNewLead({ ...newLead, date: e.target.value })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Time</label>
                      <input type="text" placeholder="e.g. 11:00 AM" value={newLead.time} onChange={(e) => setNewLead({ ...newLead, time: e.target.value })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Passengers</label>
                      <input type="number" placeholder="1" value={newLead.passengers} onChange={(e) => setNewLead({ ...newLead, passengers: parseInt(e.target.value) || 1 })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Vehicle</label>
                      <select value={newLead.vehicleType} onChange={(e) => setNewLead({ ...newLead, vehicleType: e.target.value })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors">
                        <option value="sedan_suv">Sedan & SUV</option>
                        <option value="suburban">Suburban</option>
                        <option value="sprinter">Sprinter</option>
                        <option value="minibus">Mini Bus</option>
                        <option value="coachbus">Coach Bus</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[#aaa]">Estimated Total ($)</label>
                      <input type="number" placeholder="0" value={newLead.amountUsd} onChange={(e) => setNewLead({ ...newLead, amountUsd: parseInt(e.target.value) || 0 })} className="w-full text-sm rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-4 py-3 text-white outline-none focus:border-[#B8960C] transition-colors" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-[#2a2a2a]">
                    <button
                      onClick={() => { addLead(); setShowAddLeadModal(false); }}
                      disabled={addingLead || !newLead.customerName || !newLead.pickup || !newLead.destination}
                      className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                    >
                      {addingLead ? 'Saving…' : '+ Add Lead'}
                    </button>
                    <button onClick={() => setShowAddLeadModal(false)} className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border border-[#333] text-[#aaa] hover:text-white hover:border-[#555] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Lead Modal */}
            {editingLead && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8" style={{ background: '#151515', border: '2px solid #B8960C' }}>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Editing: {editingLead.customer_name}</h2>
                    <button onClick={() => setEditingLead(null)} className="text-sm text-[#aaa] hover:text-red-400 px-3 py-1 rounded-lg border border-[#333] hover:border-red-400 transition-all">x Close</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Full Name</label>
                      <input type="text" value={editingLead.customer_name || ''} onChange={(e) => setEditingLead({...editingLead, customer_name: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Email</label>
                      <input type="email" value={editingLead.customer_email || ''} onChange={(e) => setEditingLead({...editingLead, customer_email: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Phone</label>
                      <input type="tel" value={editingLead.customer_phone || ''} onChange={(e) => setEditingLead({...editingLead, customer_phone: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Passengers</label>
                      <input type="number" value={editingLead.passengers || 1} onChange={(e) => setEditingLead({...editingLead, passengers: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Trip Type</label>
                      <select value={editingLead.trip_type || 'one-way'} onChange={(e) => setEditingLead({...editingLead, trip_type: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors">
                        <option value="one-way">One Way</option>
                        <option value="round-trip">Round Trip</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Amount (USD)</label>
                      <input type="number" value={editingLead.amount_usd || 0} onChange={(e) => setEditingLead({...editingLead, amount_usd: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Date</label>
                      <input type="date" value={editingLead.date || ''} onChange={(e) => setEditingLead({...editingLead, date: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Time</label>
                      <input type="text" placeholder="e.g. 10:00 AM" value={editingLead.time || ''} onChange={(e) => setEditingLead({...editingLead, time: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Pickup</label>
                      <input type="text" value={editingLead.pickup || ''} onChange={(e) => setEditingLead({...editingLead, pickup: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Destination</label>
                      <input type="text" value={editingLead.destination || ''} onChange={(e) => setEditingLead({...editingLead, destination: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Airline</label>
                      <input type="text" value={editingLead.airline || ''} onChange={(e) => setEditingLead({...editingLead, airline: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Flight Number</label>
                      <input type="text" value={editingLead.flight_number || ''} onChange={(e) => setEditingLead({...editingLead, flight_number: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Meeting Type</label>
                      <select value={editingLead.meeting_type || 'curbside'} onChange={(e) => setEditingLead({...editingLead, meeting_type: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors">
                        <option value="curbside">Curbside</option>
                        <option value="meet_greet">Meet & Greet (+$25)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Meet & Greet Fee</label>
                      <input type="number" value={editingLead.meet_greet_fee || 0} onChange={(e) => setEditingLead({...editingLead, meet_greet_fee: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Luggage Count</label>
                      <input type="number" value={editingLead.luggage_count || 0} onChange={(e) => setEditingLead({...editingLead, luggage_count: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Car Seats</label>
                      <input type="number" value={editingLead.car_seats_requested || 0} onChange={(e) => setEditingLead({...editingLead, car_seats_requested: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Wait Time (Mins)</label>
                      <input type="number" value={editingLead.wait_time_minutes || 0} onChange={(e) => {
                        const mins = parseInt(e.target.value) || 0
                        const fee = mins > 30 ? Math.ceil((mins - 30) / 60) * 20 : 0
                        setEditingLead({...editingLead, wait_time_minutes: mins, wait_time_fee: fee})
                      }} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[#aaa]">Wait Time Fee ($)</label>
                      <input type="number" value={editingLead.wait_time_fee || 0} onChange={(e) => setEditingLead({...editingLead, wait_time_fee: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[#0a0a0a] border border-[#2a2a2a] focus:border-[#B8960C] transition-colors" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-[#2a2a2a]">
                    <button
                      onClick={async () => {
                        await updateLead(editingLead.id, {
                          customer_name: editingLead.customer_name,
                          customer_email: editingLead.customer_email,
                          customer_phone: editingLead.customer_phone,
                          pickup: editingLead.pickup,
                          destination: editingLead.destination,
                          passengers: editingLead.passengers,
                          amount_usd: editingLead.amount_usd,
                          trip_type: editingLead.trip_type,
                          date: editingLead.date,
                          time: editingLead.time,
                          airline: editingLead.airline,
                          flight_number: editingLead.flight_number,
                          meeting_type: editingLead.meeting_type,
                          meet_greet_fee: editingLead.meet_greet_fee,
                          car_seats_requested: editingLead.car_seats_requested,
                          luggage_count: editingLead.luggage_count,
                          wait_time_minutes: editingLead.wait_time_minutes,
                          wait_time_fee: editingLead.wait_time_fee
                        })
                        setEditingLead(null)
                      }}
                      className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:brightness-110"
                      style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                    >
                      Save Changes
                    </button>
                    <button onClick={() => setEditingLead(null)} className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border border-[#333] text-[#aaa] hover:text-white hover:border-[#555] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLeads.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm italic" style={{ color: '#888' }}>
                  No reservations found.
                </div>
              )}
              {paginatedLeads.map((l) => (
                <div key={l.id} className="rounded-xl p-6 relative flex flex-col justify-between gap-5 border border-[#2a2a2a] bg-[#111] shadow-2xl hover:border-[#444] transition-colors">
                  
                  {/* Top Bar: Time Ago & Actions */}
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-[#888] uppercase tracking-wider">{timeAgo(l.created_at)}</span>
                    <div className="relative" onMouseLeave={() => setOpenMenuId(null)}>
                      <button onClick={() => setOpenMenuId(openMenuId === l.id ? null : l.id)} className="p-1.5 rounded-lg bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#888] hover:text-white transition-colors border border-[#333]" title="Actions">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>
                      </button>
                      {openMenuId === l.id && (
                        <div className="absolute right-0 top-10 w-56 bg-[#161616] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                           {l.status !== 'paid' && l.status !== 'deposit_paid' && (
                             <>
                               <button onClick={() => { generateStripeLink(l.id); setOpenMenuId(null); }} className="px-4 py-3 text-left text-sm text-[#D4AF37] hover:bg-[#222] font-semibold border-b border-[#222] flex items-center gap-2">
                                 💳 Generate Stripe Link
                               </button>
                               <button onClick={() => { sendInvoice(l.id); setOpenMenuId(null); }} className="px-4 py-3 text-left text-sm text-[#10B981] hover:bg-[#222] font-semibold border-b border-[#222] flex items-center gap-2">
                                 📧 Send Invoice
                               </button>
                             </>
                           )}
                           {l.status === 'deposit_paid' && (
                             <>
                               <button onClick={() => { generateRemainingStripeLink(l.id); setOpenMenuId(null); }} className="px-4 py-3 text-left text-sm text-[#D4AF37] hover:bg-[#222] font-semibold border-b border-[#222] flex items-center gap-2">
                                 💳 Stripe Link (Remaining)
                               </button>
                               <button onClick={() => { 
                                 if(confirm(`Mark remaining as paid in cash?`)) { updateLead(l.id, { status: 'paid', amount_paid: l.amount_usd, amount_remaining: 0 } as any); setOpenMenuId(null); }
                               }} className="px-4 py-3 text-left text-sm text-[#FBBF24] hover:bg-[#222] font-semibold border-b border-[#222] flex items-center gap-2">
                                 💵 Mark Paid (Cash)
                               </button>
                             </>
                           )}
                           <button onClick={() => { setEditingLead(l); setOpenMenuId(null); }} className="px-4 py-3 text-left text-sm text-white hover:bg-[#222] font-semibold border-b border-[#222] flex items-center gap-2">
                             ✏️ Edit Reservation
                           </button>
                           <button onClick={() => { deleteLead(l.id); setOpenMenuId(null); }} className="px-4 py-3 text-left text-sm text-[#F44336] hover:bg-[#331616] font-semibold flex items-center gap-2">
                             🗑️ Delete
                           </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex flex-col gap-1 -mt-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white truncate">{l.customer_name || 'Anonymous'}</h3>
                      {l.customer_country && <span className="text-[10px] bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/30 font-bold">{l.customer_country}</span>}
                    </div>
                    <p className="text-xs text-[#999] truncate">{l.customer_email || 'No email'}</p>
                    {l.customer_phone && (
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="text-xs text-[#666] font-mono">{l.customer_phone}</span>
                        <button onClick={() => openWhatsApp(l.customer_phone!, `Hi ${l.customer_name || 'Guest'}, this is Express Lyft. I saw you were looking for a transfer from ${l.pickup} to ${l.destination}. Would you like to complete your reservation?`)} className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-800/50 hover:bg-green-800/40 transition-all flex items-center gap-1 font-semibold">
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Route & Date */}
                  <div className="bg-[#151515] rounded-xl p-4 border border-[#1a1a1a] flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#666] uppercase tracking-widest font-bold mb-1">Route</span>
                        <p className="text-sm text-white font-medium leading-tight">{l.pickup} <br/><span className="text-[#888]">↓</span><br/> {l.destination}</p>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded" style={{ background: l.trip_type === 'round-trip' ? '#B8960C20' : '#33333340', color: l.trip_type === 'round-trip' ? '#B8960C' : '#888' }}>
                        {l.trip_type === 'round-trip' ? 'Round Trip' : 'One Way'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-[#222]">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-[#666] uppercase tracking-widest font-bold mb-0.5">Date & Time</span>
                        <p className="text-xs text-white font-bold">{formatDateUS(l.date)}</p>
                        <p className="text-xs text-[#888]">{l.time || '—'}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-[#666] uppercase tracking-widest font-bold mb-0.5">Vehicle</span>
                        <p className="text-xs font-bold text-white">{l.passengers || 1} PAX</p>
                        <p className="text-[10px] uppercase font-bold text-[#D4AF37]">{VEHICLE_LABELS[l.vehicle_type] ?? l.vehicle_type}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payment & Status */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col gap-0.5 w-1/3">
                      <span className="text-[10px] text-[#666] uppercase tracking-widest font-bold">Est. Total</span>
                      <p className="text-xl font-bold" style={{ color: '#4ade80' }}>${l.amount_usd || 0}</p>
                      {l.status === 'deposit_paid' && (
                        <div className="w-full bg-[#2a2a2a] rounded-full h-1 mt-1" title="20% Deposit Paid">
                          <div className="bg-[#FBBF24] h-1 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-2 w-2/3">
                      <div className="relative inline-block">
                        <select 
                          value={l.status || 'new'} 
                          onChange={(e) => updateLead(l.id, { status: e.target.value })}
                          className="appearance-none pr-8 pl-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer border hover:brightness-110 transition-all text-right w-full"
                          style={{ 
                            backgroundColor: l.status === 'invoice_sent' ? '#1e3a8a30' : l.status === 'lost' ? '#33161630' : l.status === 'pending_payment' ? '#7f1d1d30' : l.status === 'deposit_paid' ? '#B8960C30' : l.status === 'paid' ? '#065f4630' : '#1a1a1a',
                            color: l.status === 'invoice_sent' ? '#60a5fa' : l.status === 'lost' ? '#F44336' : l.status === 'pending_payment' ? '#f87171' : l.status === 'deposit_paid' ? '#FBBF24' : l.status === 'paid' ? '#34d399' : '#FFFFFF',
                            borderColor: l.status === 'invoice_sent' ? '#1e3a8a80' : l.status === 'lost' ? '#33161680' : l.status === 'pending_payment' ? '#7f1d1d80' : l.status === 'deposit_paid' ? '#B8960C80' : l.status === 'paid' ? '#065f4680' : '#333'
                          }}
                        >
                          <option value="new" style={{color: '#fff', background: '#111'}}>Manual (New)</option>
                          <option value="pending_payment" style={{color: '#fff', background: '#111'}}>Abandoned</option>
                          <option value="invoice_sent" style={{color: '#fff', background: '#111'}}>Invoice Sent</option>
                          <option value="deposit_paid" style={{color: '#fff', background: '#111'}}>Deposit Paid</option>
                          <option value="paid" style={{color: '#fff', background: '#111'}}>Paid</option>
                          <option value="lost" style={{color: '#fff', background: '#111'}}>Lost/Cancel</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>

                      {/* Driver Assignment */}
                      <div className="relative inline-block w-full mt-2">
                        <select 
                          value={l.assigned_driver_id || ''} 
                          onChange={(e) => updateLead(l.id, { assigned_driver_id: e.target.value || null })}
                          className="appearance-none pr-8 pl-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer border hover:brightness-110 transition-all text-right w-full"
                          style={{ 
                            backgroundColor: l.assigned_driver_id ? '#B8960C15' : '#1a1a1a',
                            color: l.assigned_driver_id ? '#D4AF37' : '#888',
                            borderColor: l.assigned_driver_id ? '#B8960C40' : '#333'
                          }}
                        >
                          <option value="" style={{color: '#888', background: '#111'}}>Unassigned</option>
                          {drivers.map(d => (
                            <option key={d.id} value={d.id} style={{color: '#fff', background: '#111'}}>{d.name}</option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                      
                      {l.assigned_driver_id && drivers.find(d => d.id === l.assigned_driver_id)?.phone && (
                        <div className="w-full flex justify-end mt-1">
                          <button onClick={() => {
                            const driver = drivers.find(d => d.id === l.assigned_driver_id);
                            if(driver) {
                              openWhatsApp(driver.phone, `Hi ${driver.name}, you have a new trip assigned:\n\nPassenger: ${l.customer_name}\nDate: ${formatDateUS(l.date)}\nTime: ${l.time}\nPickup: ${l.pickup}\nDropoff: ${l.destination}\nVehicle: ${VEHICLE_LABELS[l.vehicle_type] ?? l.vehicle_type}`);
                            }
                          }} className="text-[10px] bg-green-900/30 text-green-400 px-2 py-1 rounded border border-green-800/50 hover:bg-green-800/40 transition-all flex items-center gap-1 font-semibold">
                            Notify Driver
                          </button>
                        </div>
                      )}

                      {/* Notes toggle inline */}
                      <div className="flex flex-col items-end w-full">
                        <button onClick={() => setExpandedNotes(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id])} className="text-[10px] font-bold uppercase tracking-widest text-[#888] hover:text-[#D4AF37] transition-colors flex items-center gap-1">
                          {l.notes ? (expandedNotes.includes(l.id) ? 'Hide Notes' : 'View Notes') : '+ Add Note'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Notes Section */}
                  {expandedNotes.includes(l.id) && (
                    <div className="mt-2 border-t border-[#222] pt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <textarea 
                        rows={3}
                        defaultValue={l.notes}
                        placeholder="Type notes here..."
                        onBlur={(e) => {
                          updateLead(l.id, { notes: e.target.value })
                          if(!e.target.value) setExpandedNotes(prev => prev.filter(id => id !== l.id))
                        }}
                        className="w-full text-xs rounded-xl border border-[#2a2a2a] bg-[#0a0a0a] px-3 py-2 text-white outline-none focus:border-[#B8960C] transition-colors resize-y"
                      />
                    </div>
                  )}
                  
                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {leadsTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#1a1a1a]">
                <button
                  disabled={leadsPage === 1}
                  onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-[#333] text-xs font-bold uppercase tracking-widest text-[#aaa] hover:text-white hover:border-[#555] disabled:opacity-40 transition-all bg-[#111]"
                >
                  &larr; Prev
                </button>
                <span className="text-xs text-[#666] font-bold uppercase tracking-widest">Page {leadsPage} of {leadsTotalPages}</span>
                <button
                  disabled={leadsPage === leadsTotalPages}
                  onClick={() => setLeadsPage(p => Math.min(leadsTotalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-[#333] text-xs font-bold uppercase tracking-widest text-[#aaa] hover:text-white hover:border-[#555] disabled:opacity-40 transition-all bg-[#111]"
                >
                  Next &rarr;
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------- REVENUE TAB ------- */}
        {activeTab === 'revenue' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Revenue & Finance</h1>
              <p className="text-sm" style={{ color: '#888' }}>Overview of gross income and cash flow</p>
            </div>

            {/* Top Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[#888]">Gross Revenue</p>
                <p className="text-4xl font-bold" style={{ color: '#4ade80' }}>${revenueStats.grossRevenue.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[#666]">All confirmed income</p>
              </div>
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[#888]">Stripe / Online</p>
                <p className="text-4xl font-bold" style={{ color: '#60a5fa' }}>${(revenueStats.bookingsTotal + revenueStats.depositPaidOnline).toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[#666]">Direct to bank</p>
              </div>
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[#888]">Cash Pending</p>
                <p className="text-4xl font-bold" style={{ color: '#FBBF24' }}>${revenueStats.depositRemainingCash.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[#666]">To collect from drivers</p>
              </div>
            </section>

            {/* Monthly Trend */}
            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <p className="text-sm font-bold uppercase tracking-wider mb-5 text-[#888]">Monthly Revenue Trend</p>
              {revenueStats.monthlyData.length === 0 ? (
                <p className="text-sm italic text-[#666]">No data available yet.</p>
              ) : (
                <div className="flex items-stretch gap-4 h-48 mt-4">
                  {revenueStats.monthlyData.map(([month, amount]) => {
                    const maxAmount = Math.max(...revenueStats.monthlyData.map(m => m[1]), 1)
                    const heightPercent = Math.max((amount / maxAmount) * 100, 5)
                    return (
                      <div key={month} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="relative w-full flex-1 flex justify-center items-end">
                          <div 
                            className="w-full max-w-[60px] rounded-t-sm transition-all duration-500 ease-out group-hover:brightness-125"
                            style={{ height: `${heightPercent}%`, background: '#B8960C' }}
                          ></div>
                          <span className="absolute -top-6 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            ${amount.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[#888]">{month}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Top Routes */}
            <section className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-bold uppercase tracking-wider text-[#888]">Top Routes (By Revenue)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: '#888' }}>
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">Route</th>
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">Trips</th>
                      <th className="text-right py-2 text-xs uppercase tracking-widest font-medium">Revenue generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueStats.topRoutes.map(([route, stats], idx) => (
                      <tr key={route} style={{ borderTop: '1px solid #1a1a1a' }}>
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold text-xs">{route.split(' -> ')[0]}</p>
                          <p className="text-[#888] text-[10px] mt-0.5">to {route.split(' -> ')[1]}</p>
                        </td>
                        <td className="py-4 pr-4 text-[#aaa] font-bold text-xs">{stats.count}</td>
                        <td className="py-4 text-right font-bold" style={{ color: '#4ade80' }}>${stats.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {revenueStats.topRoutes.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-[#888] text-xs italic">No routes recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* ------- DRIVERS TAB ------- */}
        {activeTab === 'drivers' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Drivers</h1>
                <p className="text-sm" style={{ color: '#888' }}>Manage your fleet and personnel</p>
              </div>
              <button
                onClick={() => setShowDriverForm(true)}
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
              >
                + New Driver
              </button>
            </div>

            {showDriverForm && (
              <section className="p-6 rounded-2xl relative" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                <button
                  onClick={resetDriverForm}
                  className="absolute top-6 right-6 text-[#888] hover:text-white transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h2 className="text-lg font-bold mb-6 text-white">{editingDriver ? 'Edit Driver' : 'New Driver'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#888] mb-2 font-bold">Driver Name</label>
                    <input
                      type="text"
                      value={newDriver.name}
                      onChange={e => setNewDriver(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[#B8960C]"
                      style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'white' }}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#888] mb-2 font-bold">Phone Number</label>
                    <input
                      type="text"
                      value={newDriver.phone}
                      onChange={e => setNewDriver(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[#B8960C]"
                      style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'white' }}
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#888] mb-2 font-bold">Vehicle Type</label>
                    <select
                      value={newDriver.vehicle_type}
                      onChange={e => setNewDriver(p => ({ ...p, vehicle_type: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[#B8960C]"
                      style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'white' }}
                    >
                      {Object.entries(VEHICLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#888] mb-2 font-bold">License Plate</label>
                    <input
                      type="text"
                      value={newDriver.license_plate}
                      onChange={e => setNewDriver(p => ({ ...p, license_plate: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[#B8960C]"
                      style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'white' }}
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[#888] mb-2 font-bold">Status</label>
                    <select
                      value={newDriver.status}
                      onChange={e => setNewDriver(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[#B8960C]"
                      style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', color: 'white' }}
                    >
                      <option value="available">Available</option>
                      <option value="on_trip">On Trip</option>
                      <option value="off_duty">Off Duty</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSaveDriver}
                    disabled={savingDriver || !newDriver.name || !newDriver.phone}
                    className="px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50 hover:brightness-110"
                    style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                  >
                    {savingDriver ? 'Saving...' : 'Save Driver'}
                  </button>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.length === 0 && !loadingDrivers && (
                <div className="col-span-full p-10 text-center rounded-2xl" style={{ border: '1px dashed #333' }}>
                  <p className="text-[#888] mb-4">No drivers registered yet.</p>
                </div>
              )}
              {drivers.map(driver => (
                <div key={driver.id} className="rounded-2xl p-6 relative group" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditDriver(driver)} className="p-2 bg-[#222] text-[#888] hover:text-white rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteDriver(driver.id)} className="p-2 bg-[#222] text-[#888] hover:text-red-400 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#222] border border-[#333]">
                      <IconDrivers />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{driver.name}</h3>
                      <p className="text-xs text-[#888]">{driver.phone}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#666] tracking-wider mb-1">Vehicle</p>
                      <p className="text-sm text-[#ddd]">{VEHICLE_LABELS[driver.vehicle_type] || driver.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#666] tracking-wider mb-1">Plate</p>
                      <p className="text-sm text-[#ddd] uppercase">{driver.license_plate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[#666] tracking-wider mb-1">Status</p>
                      <span className="text-xs px-2 py-1 rounded border capitalize" style={{
                        borderColor: driver.status === 'available' ? '#166534' : driver.status === 'on_trip' ? '#854d0e' : '#3f3f46',
                        color: driver.status === 'available' ? '#4ade80' : driver.status === 'on_trip' ? '#facc15' : '#a1a1aa',
                        background: driver.status === 'available' ? '#052e16' : driver.status === 'on_trip' ? '#422006' : '#18181b'
                      }}>
                        {driver.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------- DISPATCH CALENDAR TAB ------- */}
        {activeTab === 'dispatch' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Dispatch Calendar</h1>
                <p className="text-sm" style={{ color: '#888' }}>View assigned trips and detect conflicts</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {['Today', 'Tomorrow', 'Upcoming'].map(dayGroup => {
                const todayStr = new Date().toLocaleDateString('en-CA')
                const tomorrowDate = new Date()
                tomorrowDate.setDate(tomorrowDate.getDate() + 1)
                const tomorrowStr = tomorrowDate.toLocaleDateString('en-CA')
                
                let groupLeads = leads.filter(l => l.status === 'deposit_paid' || l.status === 'paid' || l.status === 'new')
                if (dayGroup === 'Today') {
                  groupLeads = groupLeads.filter(l => l.date === todayStr)
                } else if (dayGroup === 'Tomorrow') {
                  groupLeads = groupLeads.filter(l => l.date === tomorrowStr)
                } else {
                  groupLeads = groupLeads.filter(l => l.date !== todayStr && l.date !== tomorrowStr)
                }
                
                // Sort by time
                groupLeads.sort((a, b) => (a.time || '').localeCompare(b.time || ''))

                if (groupLeads.length === 0) return null

                return (
                  <section key={dayGroup} className="rounded-xl p-6" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-5 text-[#888]">{dayGroup}</h3>
                    <div className="flex flex-col gap-3">
                      {groupLeads.map(lead => {
                        const driver = drivers.find(d => d.id === lead.assigned_driver_id)
                        return (
                          <div key={lead.id} className="p-4 rounded-lg flex items-center justify-between" style={{ background: '#1a1a1a' }}>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-[#0a0a0a] rounded flex flex-col items-center justify-center border border-[#333]">
                                <span className="text-xs text-[#888] uppercase">{formatDateUS(lead.date || '')}</span>
                                <span className="text-sm font-bold text-white">{lead.time}</span>
                              </div>
                              <div>
                                <p className="text-white font-bold">{lead.pickup} <span className="text-[#666] font-normal mx-1">→</span> {lead.destination}</p>
                                <p className="text-xs text-[#888] mt-1">{lead.customer_name} • {VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {driver ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#B8960C] bg-[#B8960C]/10 text-[#D4AF37] text-xs font-bold">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                  {driver.name}
                                </div>
                              ) : (
                                <span className="inline-block px-3 py-1 rounded-full border border-[#333] bg-[#222] text-[#888] text-xs font-bold">
                                  UNASSIGNED
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
              
              {leads.filter(l => l.status === 'deposit_paid' || l.status === 'paid' || l.status === 'new').length === 0 && (
                 <div className="p-10 text-center rounded-2xl" style={{ border: '1px dashed #333' }}>
                 <p className="text-[#888]">No active trips to dispatch.</p>
               </div>
              )}
            </div>
          </div>
        )}

        {/* ------- ASSIGN DRIVERS TAB ------- */}
        {activeTab === 'assign' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Available to Talk?</h1>
                <p className="text-sm" style={{ color: '#888' }}>Assign drivers to promotional and pending trips</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {leads.filter(l => l.status === 'pending_assignment').length === 0 ? (
                <div className="p-10 text-center rounded-2xl" style={{ border: '1px dashed #333' }}>
                  <p className="text-[#888]">No pending assignments. All trips are dispatched.</p>
                </div>
              ) : (
                leads.filter(l => l.status === 'pending_assignment').map(lead => {
                  const message = `Hello, are you available for a trip?\n\n*Route:* ${lead.pickup} to ${lead.destination}\n*Date:* ${lead.date}\n*Time:* ${lead.time}\n*Passengers:* ${lead.passengers}\n*Vehicle:* ${VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type}`;
                  const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

                  return (
                    <div key={lead.id} className="p-6 rounded-xl flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between" style={{ background: '#111', border: '1px solid #1a1a1a' }}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold bg-[#B8960C]/20 text-[#D4AF37] px-2 py-1 rounded border border-[#B8960C]/30 uppercase tracking-wider">NEEDS DRIVER</span>
                          <p className="text-white font-bold text-lg">{lead.customer_name}</p>
                        </div>
                        <p className="text-[#aaa] text-sm"><span className="font-semibold text-[#ccc]">{formatDateUS(lead.date || '')} at {lead.time}</span></p>
                        <p className="text-[#888] text-sm">{lead.pickup} <span className="mx-1">→</span> {lead.destination}</p>
                        <p className="text-[#888] text-sm">{lead.passengers} passengers • {VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type}</p>
                      </div>

                      <div className="flex flex-col gap-3 w-full sm:w-auto">
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all bg-[#128C7E] hover:bg-[#075E54] text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          Ask Drivers
                        </a>
                        
                        <div className="flex items-center gap-2">
                          <select 
                            className="bg-[#0a0a0a] border border-[#333] text-white text-sm rounded-lg px-3 py-2.5 flex-1 outline-none focus:border-[#B8960C]"
                            onChange={(e) => {
                              const driverId = e.target.value;
                              if (driverId) {
                                if (confirm('Are you sure you want to assign this driver? The trip will be moved to Confirmed Trips.')) {
                                  updateLead(lead.id, { assigned_driver_id: driverId, status: 'paid' });
                                }
                                e.target.value = ""; // Reset
                              }
                            }}
                          >
                            <option value="">Assign Driver...</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>{d.name} ({VEHICLE_LABELS[d.vehicle_type] || d.vehicle_type})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ------- QR CODES TAB ------- */}
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
                  <div className="bg-[#1a1a1a] p-3 rounded-lg border border-[#333] w-full max-w-sm">
                    <p className="text-xs text-[#888] mb-1 uppercase tracking-wider font-bold">QR Destination URL:</p>
                    <p className="text-sm font-mono text-[#B8960C] break-all">{qrUrl}</p>
                  </div>
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
