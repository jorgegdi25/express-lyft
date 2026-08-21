'use client'

import Image from 'next/image'
import { useState, useEffect, useMemo } from 'react'
import QRCode from 'qrcode'
import { applyTimeSurcharge, TIME_SLOTS } from '@/lib/pricing'
import { FL_TAX_RATE_PERCENT } from '@/lib/tax'
import { formatDateUS, getMonthGridDays } from '@/lib/dateUtils'
import { VEHICLE_LABELS } from '@/lib/vehicles'
import { CalendarDatePicker, CalendarRangeFilter } from '@/components/CalendarPicker'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmDialog'
import Select from '@/components/ui/Select'
import Button from '@/components/ui/Button'
import SearchInput from '@/components/ui/SearchInput'
import {
  StickyNote, AlertTriangle, Sparkles, Star, CheckCircle2, XCircle,
  Plane, Armchair, Luggage, X, Trash2, Mail, Receipt, CreditCard, Check,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Search, DollarSign,
  CalendarCheck, ListTodo, ArrowRight, Plus, ArrowUpDown,
} from 'lucide-react'
import { parsePhoneNumberFromString } from 'libphonenumber-js'
import countryNames from 'react-phone-number-input/locale/en.json'

/* -- Interfaces --------------------------------------- */


interface Booking {
  id: string
  hotel_slug: string
  vehicle_type: string
  amount_usd: number
  status: string
  date: string
  return_date?: string | null
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
  amount_paid?: number
  amount_remaining?: number
  payment_source?: string
  external_platform?: string | null
  external_reference?: string | null
  paid_at?: string | null
  tax_collected?: number
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

interface DiscountCode {
  id: string
  code: string
  type: 'percent' | 'fixed'
  value: number
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  min_amount: number | null
  active: boolean
  client_name: string | null
  notes: string | null
  created_at: string
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
  reminder_sent_at?: string | null
  trip_reminder_sent_at?: string | null
  trip_reminder_status?: string | null
  trip_reminder_status_at?: string | null
  payment_source?: string
  external_platform?: string | null
  external_reference?: string | null
  paid_at?: string | null
  tax_collected?: number
  booking_source?: 'website' | 'manual' | null
  created_by?: string | null
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

interface Review {
  id: string
  lead_id: string | null
  hotel_slug: string | null
  customer_name: string
  customer_email: string | null
  token: string
  status: 'requested' | 'pending' | 'approved' | 'rejected'
  rating: number | null
  would_recommend: boolean | null
  comment: string | null
  requested_at: string | null
  submitted_at: string | null
  reviewed_at: string | null
  created_at: string
}


type TabKey = 'dashboard' | 'bookings' | 'drivers' | 'dispatch' | 'leads' | 'quotes' | 'hotel_bookings' | 'clients' | 'revenue' | 'commissions' | 'reports' | 'routes' | 'qr' | 'settings' | 'support' | 'websites' | 'reviews' | 'stay' | 'discounts'

type SidebarItem = { key: TabKey; label: string; icon: React.ReactNode; getBadge?: () => number }

function IconHotel() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
      <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
      <path d="M10 9h.01" />
      <path d="M14 9h.01" />
      <path d="M10 13h.01" />
      <path d="M14 13h.01" />
    </svg>
  )
}

function IconWeb() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      <path d="M2 12h20" />
    </svg>
  )
}

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
function IconReviews() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
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
function IconDiscount() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2.59 12.59a2 2 0 0 1-.59-1.42V4a2 2 0 0 1 2-2h7.17a2 2 0 0 1 1.41.59l7.99 7.99a2 2 0 0 1 .01 2.83Z" />
      <circle cx="7.5" cy="7.5" r="1.5" />
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

/** Pill colors per lead status — bg / text / border, shared by the card chip
 *  and the status filter dots so both stay in sync. */
const STATUS_TONES: Record<string, { bg: string; fg: string; border: string }> = {
  invoice_sent:    { bg: '#1e3a8a30', fg: '#60a5fa',            border: '#1e3a8a80' },
  lost:            { bg: '#33161630', fg: '#F44336',            border: '#33161680' },
  pending_payment: { bg: '#7f1d1d30', fg: '#f87171',            border: '#7f1d1d80' },
  deposit_paid:    { bg: '#B8960C30', fg: '#FBBF24',            border: '#B8960C80' },
  paid:            { bg: '#065f4630', fg: '#34d399',            border: '#065f4680' },
  quote_requested: { bg: '#EF9F2730', fg: 'var(--gold-accent)', border: '#EF9F2780' },
}
const DEFAULT_STATUS_TONE = { bg: 'var(--surface)', fg: 'var(--text)', border: 'var(--border-soft)' }

const LEAD_STATUS_OPTIONS = [
  { value: 'new',             label: 'Manual (New)',    color: '#888888' },
  { value: 'quote_requested', label: 'Quote Requested', color: '#EF9F27' },
  { value: 'pending_payment', label: 'Abandoned',       color: '#f87171' },
  { value: 'invoice_sent',    label: 'Invoice Sent',    color: '#60a5fa' },
  { value: 'deposit_paid',    label: 'Deposit Paid',    color: '#FBBF24' },
  { value: 'paid',            label: 'Paid',            color: '#34d399' },
  { value: 'lost',            label: 'Lost/Cancel',     color: '#F44336' },
]

// Every reservation created through the "Add Reservation" modal is a manual
// entry by definition (the public site never hits this path — see isAdmin
// in app/api/leads/route.ts), so whoever fills the modal must pick which
// agent it's for. Keep this list in sync with who's actually taking manual
// bookings — it drives the per-agent commission breakdown on the
// Commissions tab.
const SALES_AGENTS = ['Dennis Rivera', 'Karen Hernandez']

function StatCard({
  icon, iconColor, label, value, trendPct, caption,
}: {
  icon: React.ReactNode
  iconColor: string
  label: string
  value: React.ReactNode
  trendPct?: number | null
  caption?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-4"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}
    >
      <div className="flex items-center justify-between">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${iconColor}1A`, color: iconColor }}
        >
          {icon}
        </div>
        {trendPct != null && (
          <span
            className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full"
            style={{
              background: trendPct >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: trendPct >= 0 ? '#10B981' : '#f87171',
            }}
          >
            {trendPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {trendPct >= 0 ? '+' : ''}{trendPct}%
          </span>
        )}
      </div>
      <div>
        <p className="text-3xl font-bold" style={{ color: 'var(--text)' }}>{value}</p>
        <p className="text-xs font-bold uppercase tracking-widest mt-1.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
      </div>
      {caption && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{caption}</p>}
    </div>
  )
}

/* -- Main Admin Page ---------------------------------- */

export default function AdminPage() {
  const toast = useToast()
  const confirmDialog = useConfirm()
  const [password, setPassword] = useState('')
  const [authed, setAuthed] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const [authError, setAuthError] = useState('')
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [secondsSinceRefresh, setSecondsSinceRefresh] = useState(0)

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

  const [calendarMonth, setCalendarMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [commissionMonth, setCommissionMonth] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const COMMISSION_PER_BOOKING = 2

  const [metrics, setMetrics] = useState<any>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [addingLead, setAddingLead] = useState(false)
  const [editingLead, setEditingLead] = useState<Lead | null>(null)
  const [sendingInvoice, setSendingInvoice] = useState<string | null>(null)
  const [sendingQuickBooksInvoice, setSendingQuickBooksInvoice] = useState<string | null>(null)
  const [qbConnected, setQbConnected] = useState<boolean | null>(null)
  const [qbStatusDetail, setQbStatusDetail] = useState<{ companyName?: string; environment?: string; error?: string } | null>(null)
  const [sendingReview, setSendingReview] = useState<string | null>(null)
  const [viewingLead, setViewingLead] = useState<Lead | null>(null)
  const [viewingDay, setViewingDay] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const emptyNewLead = {
    hotelSlug: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCountry: '',
    routeMode: 'preset' as 'preset' | 'custom',
    pickup: '',
    destination: '',
    vehicleType: 'sedan_suv',
    status: 'new',
    notes: '',
    passengers: 1,
    date: '',
    time: '',
    returnDate: '',
    returnTime: '',
    amountUsd: 0,
    tripType: 'one-way' as 'one-way' | 'round-trip',
    airline: '',
    flightNumber: '',
    meetingType: 'curbside' as 'curbside' | 'meet_greet',
    meetGreetFee: 0,
    carSeatsRequested: 0,
    luggageCount: 0,
    paymentSource: 'stripe' as 'stripe' | 'external' | 'cash',
    externalPlatform: '',
    externalReference: '',
    fullyPaid: true,
    amountPaid: 0,
    agentName: '',
  }
  const [newLead, setNewLead] = useState(emptyNewLead)

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

  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([])
  const [editDiscountData, setEditDiscountData] = useState<Record<string, { code: string; type: 'percent' | 'fixed'; value: number; max_uses: string; expires_at: string; min_amount: string; client_name: string }>>({})
  const [savingDiscount, setSavingDiscount] = useState<string | null>(null)
  const [addingDiscount, setAddingDiscount] = useState(false)
  const [newDiscount, setNewDiscount] = useState({
    code: '',
    type: 'percent' as 'percent' | 'fixed',
    value: 5,
    max_uses: '',
    expires_at: '',
    min_amount: '',
    client_name: '',
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

  // Reviews moderation state
  const [reviews, setReviews] = useState<Review[]>([])
  const [reviewActionId, setReviewActionId] = useState<string | null>(null)

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
  const [bookingsStatusFilter, setBookingsStatusFilter] = useState('all')
  const [bookingsDateFrom, setBookingsDateFrom] = useState('')
  const [bookingsDateTo, setBookingsDateTo] = useState('')
  const [bookingsVehicleFilter, setBookingsVehicleFilter] = useState('all')
  const [bookingsDriverFilter, setBookingsDriverFilter] = useState('all')
  const [bookingsPage, setBookingsPage] = useState(1)
  const bookingsPerPage = 15

  // Leads pagination, search & sort
  const [leadsPage, setLeadsPage] = useState(1)
  const [leadsSearch, setLeadsSearch] = useState('')
  const [leadsStatusFilter, setLeadsStatusFilter] = useState('all')
  const [leadsOriginFilter, setLeadsOriginFilter] = useState('all')
  const [leadsDateFrom, setLeadsDateFrom] = useState('')
  const [leadsDateTo, setLeadsDateTo] = useState('')
  const [leadsSortBy, setLeadsSortBy] = useState('newest')
  const [showAddLeadModal, setShowAddLeadModal] = useState(false)
  const leadsPerPage = 15

  // Dynamic Stripe link generation state
  const [generatingLink, setGeneratingLink] = useState<string | null>(null)

  // Hotels available for the "Add Reservation" modal — derived from whatever
  // hotels already have routes loaded, same source of truth as the Websites tab.
  const hotelOptions = useMemo(
    () => Array.from(new Set(routePrices.map((r) => r.hotel_slug))).filter(Boolean),
    [routePrices]
  )

  // Route dropdown for the "Add Reservation" modal — offers both directions of
  // every saved route, not just however it happened to be entered. Whichever
  // direction wasn't explicitly saved reads its price from the other one via
  // lookupRoutePrice's exact-then-reverse fallback, so there's a single source
  // of truth: editing one direction's rate in Routes & Pricing updates the
  // suggested total for both, instead of two rows silently drifting apart.
  const routeDropdownOptions = useMemo(() => {
    const hotelRoutes = routePrices.filter((r) => !newLead.hotelSlug || r.hotel_slug === newLead.hotelSlug)
    const seen = new Set<string>()
    const options: { pickup: string; destination: string }[] = []
    for (const r of hotelRoutes) {
      const key = `${r.pickup}|||${r.destination}`
      if (!seen.has(key)) { seen.add(key); options.push({ pickup: r.pickup, destination: r.destination }) }
    }
    for (const r of hotelRoutes) {
      const key = `${r.destination}|||${r.pickup}`
      if (!seen.has(key)) { seen.add(key); options.push({ pickup: r.destination, destination: r.pickup }) }
    }
    return options
  }, [routePrices, newLead.hotelSlug])

  interface PricingSettings {
    surcharge_type: 'fixed' | 'percentage';
    surcharge_amount: number;
    surcharge_start_hour: number;
    surcharge_end_hour: number;
    deposits_enabled: boolean;
    payment_provider: 'stripe' | 'quickbooks';
  }

  const [pricingSettings, setPricingSettings] = useState<PricingSettings | null>(null)
  const [editPricingSettings, setEditPricingSettings] = useState<PricingSettings | null>(null)
  const [savingPricingSettings, setSavingPricingSettings] = useState(false)

  // Looks up the loaded rate for a preset route (airport/port), trying the
  // exact direction first and falling back to the reverse one — same
  // direction-aware logic the server uses in app/api/leads/route.ts, just for
  // suggesting a price in the modal (the admin can still override it).
  function lookupRoutePrice(pickup: string, destination: string, vehicleType: string, hotelSlug: string): number | null {
    const key = `${vehicleType}_price` as keyof RoutePricing
    const exact = routePrices.find((r) => r.hotel_slug === hotelSlug && r.pickup === pickup && r.destination === destination)
    if (exact && (exact as any)[key]) return (exact as any)[key]
    const reversed = routePrices.find((r) => r.hotel_slug === hotelSlug && r.pickup === destination && r.destination === pickup)
    if (reversed && (reversed as any)[key]) return (reversed as any)[key]
    return null
  }

  // Auto-suggests the total for preset routes as soon as route/vehicle/trip
  // type/time are picked, since those rates are already known — including the
  // same time-of-day surcharge the public booking forms and server apply, so
  // a manually-created reservation never quietly skips it. Each leg is
  // surcharged by its own pickup time, same as a round trip everywhere else.
  // Custom trajectories (routeMode 'custom') are left alone — the admin types
  // that price by hand.
  useEffect(() => {
    if (newLead.routeMode !== 'preset') return
    if (!newLead.pickup || !newLead.destination || !newLead.vehicleType) return
    const outboundBase = lookupRoutePrice(newLead.pickup, newLead.destination, newLead.vehicleType, newLead.hotelSlug)
    if (outboundBase === null) return
    const outbound = Math.ceil(applyTimeSurcharge(outboundBase, newLead.time, pricingSettings))
    let total = outbound
    if (newLead.tripType === 'round-trip') {
      const returnBase = lookupRoutePrice(newLead.destination, newLead.pickup, newLead.vehicleType, newLead.hotelSlug) ?? outboundBase
      const returnLeg = Math.ceil(applyTimeSurcharge(returnBase, newLead.returnTime || newLead.time, pricingSettings))
      total = outbound + returnLeg
    }
    setNewLead((prev) => (prev.routeMode === 'preset' ? { ...prev, amountUsd: total } : prev))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newLead.routeMode, newLead.pickup, newLead.destination, newLead.vehicleType, newLead.tripType, newLead.hotelSlug, newLead.time, newLead.returnTime, routePrices, pricingSettings])

  // Revenue computations
  const revenueStats = useMemo(() => {
    // Money actually collected for a booking so far. For 'paid'/'hotel_b2b'
    // that's the full amount_usd; for 'deposit_paid' only amount_paid was
    // collected — the rest is still owed. Using amount_usd for deposit_paid
    // rows here (instead of amount_paid) was the old double-count bug: the
    // full total AND the deposit split got added on top of each other.
    const collected = (b: Booking) => {
      if (b.status === 'paid' || b.status === 'hotel_b2b') return b.amount_usd || 0
      if (b.status === 'deposit_paid') return b.amount_paid || 0
      return 0
    }
    const pending = (b: Booking) => (b.status === 'deposit_paid' ? (b.amount_remaining || 0) : 0)

    // Split collected revenue by where the payment actually came from —
    // Stripe (online, hits the bank directly), the external platform the
    // client also books through, or cash/transfer collected in person.
    let stripeTotal = 0
    let externalTotal = 0
    let cashTotal = 0
    let pendingTotal = 0
    // Florida sales tax actually charged by Stripe (from tax_collected,
    // straight from Stripe's own numbers — not our revenue, just what's
    // owed to the state). Only ever populated on Stripe-processed leads,
    // and only from when the tax was turned on — older paid leads show $0
    // here because no tax was actually charged on them.
    let taxCollectedTotal = 0

    bookings.forEach((b) => {
      const source = b.payment_source || 'stripe'
      const amount = collected(b)
      if (source === 'external') externalTotal += amount
      else if (source === 'cash') cashTotal += amount
      else stripeTotal += amount
      pendingTotal += pending(b)
      taxCollectedTotal += b.tax_collected || 0
    })

    const grossRevenue = stripeTotal + externalTotal + cashTotal

    // Monthly breakdown (collected amounts, by month of the trip date)
    const monthlyData: Record<string, number> = {}
    bookings.forEach((b) => {
      if (!b.date) return
      const month = b.date.substring(0, 7) // YYYY-MM
      monthlyData[month] = (monthlyData[month] || 0) + collected(b)
    })
    const currentMonth = new Date().toISOString().substring(0, 7)
    const currentMonthRevenue = monthlyData[currentMonth] || 0
    const lastMonthDate = new Date()
    lastMonthDate.setMonth(lastMonthDate.getMonth() - 1)
    const lastMonth = lastMonthDate.toISOString().substring(0, 7)
    const lastMonthRevenue = monthlyData[lastMonth] || 0
    const revenueTrendPct = lastMonthRevenue > 0
      ? Math.round(((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : null

    const currentMonthBookings = bookings.filter(b => (b.date || '').substring(0, 7) === currentMonth).length
    const lastMonthBookings = bookings.filter(b => (b.date || '').substring(0, 7) === lastMonth).length
    const bookingsTrendPct = lastMonthBookings > 0
      ? Math.round(((currentMonthBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : null

    // Top Routes (by collected revenue)
    const routesData: Record<string, { count: number; revenue: number }> = {}
    bookings.forEach(b => {
      const routeKey = `${b.pickup} -> ${b.destination}`
      if (!routesData[routeKey]) routesData[routeKey] = { count: 0, revenue: 0 }
      routesData[routeKey].count += 1
      routesData[routeKey].revenue += collected(b)
    })

    const topRoutes = Object.entries(routesData)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .slice(0, 5)

    return {
      stripeTotal,
      externalTotal,
      cashTotal,
      pendingTotal,
      taxCollectedTotal,
      grossRevenue,
      currentMonthRevenue,
      revenueTrendPct,
      currentMonthBookings,
      bookingsTrendPct,
      monthlyData: Object.entries(monthlyData).sort((a, b) => a[0].localeCompare(b[0])),
      topRoutes
    }
  }, [bookings])

  /* -- API Fetchers -- */

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

  async function fetchDiscountCodes(pw: string) {
    const res = await fetch(`/api/admin/discount-codes?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<DiscountCode[]>
  }

  async function fetchLeads(pw: string) {
    const res = await fetch(`/api/leads?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<Lead[]>
  }

  async function fetchReviews(pw: string) {
    const res = await fetch(`/api/admin/reviews?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<Review[]>
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

  interface StayHotelAdmin {
    id: string
    name: string
    photo_url: string | null
    price: number
    transport_amount: number
    rooms_available: number
    active: boolean
    sort_order: number
  }

  interface StayBookingAdmin {
    id: string
    hotel_name: string
    room_type: string
    room_qty: number
    nights: number
    check_in_date: string
    guest_name: string
    guest_email: string
    guest_phone: string
    guest_count: number
    direction: string
    pickup_time: string
    return_pickup_time: string | null
    room_amount: number
    transport_amount: number
    tax_collected?: number
    status: string
    created_at: string
  }

  const [stayHotels, setStayHotels] = useState<StayHotelAdmin[]>([])
  const [stayBookings, setStayBookings] = useState<StayBookingAdmin[]>([])
  const [editingStayHotel, setEditingStayHotel] = useState<StayHotelAdmin | null>(null)
  const [addingStayHotel, setAddingStayHotel] = useState(false)
  const [savingStayHotel, setSavingStayHotel] = useState(false)
  const emptyStayHotel = { name: '', photo_url: '', price: 189, transport_amount: 45, rooms_available: 5, active: true, sort_order: 100 }
  const [newStayHotel, setNewStayHotel] = useState(emptyStayHotel)

  async function fetchStayData(pw: string) {
    const res = await fetch(`/api/admin/stay-hotels?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return { hotels: [] as StayHotelAdmin[], bookings: [] as StayBookingAdmin[] }
    return res.json() as Promise<{ hotels: StayHotelAdmin[], bookings: StayBookingAdmin[] }>
  }

  async function refreshStayData() {
    const data = await fetchStayData(password)
    setStayHotels(data.hotels)
    setStayBookings(data.bookings)
  }

  async function saveStayHotel(hotel: Partial<StayHotelAdmin> & { id?: string }) {
    setSavingStayHotel(true)
    try {
      const isEdit = !!hotel.id
      const res = await fetch('/api/admin/stay-hotels', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
        body: JSON.stringify(hotel),
      })
      if (res.ok) {
        await refreshStayData()
        setEditingStayHotel(null)
        setAddingStayHotel(false)
        setNewStayHotel(emptyStayHotel)
      }
    } finally {
      setSavingStayHotel(false)
    }
  }

  async function deleteStayHotel(id: string) {
    if (!(await confirmDialog('Delete this Stay hotel? This cannot be undone.', { danger: true }))) return
    const res = await fetch(`/api/admin/stay-hotels?id=${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${password}` },
    })
    if (res.ok) await refreshStayData()
  }

  async function deleteStayBooking(id: string) {
    if (!(await confirmDialog('Delete this Stay booking? This cannot be undone.', { danger: true }))) return
    const res = await fetch(`/api/admin/stay-hotels?bookingId=${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${password}` },
    })
    if (res.ok) await refreshStayData()
  }

  interface BasePrice {
    id?: string;
    vehicle_type: string;
    price_usd: number;
    price_per_mile: number;
    price_per_minute: number;
    min_price: number;
    max_price: number;
    multiplier: number;
  }

  const [basePrices, setBasePrices] = useState<BasePrice[]>([])
  const [editBasePriceData, setEditBasePriceData] = useState<Record<string, { price_usd: number, price_per_mile: number, price_per_minute: number, min_price: number, max_price: number, multiplier: number }>>({})

  async function fetchBasePrices(pw: string) {
    const res = await fetch(`/api/admin/prices?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return []
    return res.json() as Promise<BasePrice[]>
  }

  async function fetchPricingSettings(pw: string) {
    const res = await fetch(`/api/admin/pricing-settings?t=${Date.now()}`, {
      headers: { authorization: `Bearer ${pw}` },
      cache: 'no-store'
    })
    if (!res.ok) return null
    return res.json() as Promise<PricingSettings | null>
  }

  async function updatePricingSettings() {
    if (!editPricingSettings) return
    setSavingPricingSettings(true)
    try {
      const res = await fetch('/api/admin/pricing-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
        body: JSON.stringify(editPricingSettings),
      })
      if (res.ok) {
        setPricingSettings(editPricingSettings)
      }
    } finally {
      setSavingPricingSettings(false)
    }
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
    let bp: BasePrice[] = []

    try {
      const [bData, rData, lData, cData, dData, bpData, psData, rvData, stayData, dcData] = await Promise.all([
        fetchBookings(pw),
        fetchRoutes(pw),
        fetchLeads(pw),
        fetchClients(pw),
        fetchDrivers(pw),
        fetchBasePrices(pw),
        fetchPricingSettings(pw),
        fetchReviews(pw),
        fetchStayData(pw),
        fetchDiscountCodes(pw)
      ])

      setBookings(bData)
      setRoutePrices(rData)
      setLeads(lData)
      setClients(cData)
      setDrivers(dData)
      setBasePrices(bpData)
      if (psData) { setPricingSettings(psData); setEditPricingSettings(psData) }
      setReviews(rvData)
      setStayHotels(stayData.hotels)
      setStayBookings(stayData.bookings)
      setDiscountCodes(dcData)
      bk = bData
      rt = rData
      ld = lData
      cl = cData
      bp = bpData
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
    setEditBasePriceData(
      Object.fromEntries(
        bp.map((p) => [
          p.vehicle_type,
          { 
            price_usd: p.price_usd, 
            price_per_mile: p.price_per_mile || 0,
            price_per_minute: p.price_per_minute || 0,
            min_price: p.min_price || 0,
            max_price: p.max_price || 0,
            multiplier: p.multiplier || 1.0,
          }
        ])
      )
    )
    setLoadingBookings(false)
    setLastRefreshedAt(new Date())
  }

  // Lightweight refresh for data that changes as new reservations come in.
  // Skips route/base pricing so it never clobbers an in-progress admin edit.
  async function refreshData(pw: string) {
    setIsRefreshing(true)
    try {
      const [bData, lData, cData, rvData] = await Promise.all([
        fetchBookings(pw),
        fetchLeads(pw),
        fetchClients(pw),
        fetchReviews(pw),
      ])
      setBookings(bData)
      setLeads(lData)
      setClients(cData)
      setReviews(rvData)
      setLastRefreshedAt(new Date())
    } catch {
      // Keep showing the last known-good data if a refresh fails
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    if (!authed) return
    fetchQuickBooksStatus(password)

    const params = new URLSearchParams(window.location.search)
    const qbResult = params.get('quickbooks')
    if (qbResult === 'connected') {
      toast('QuickBooks connected successfully!', 'success')
      window.history.replaceState({}, '', window.location.pathname)
    } else if (qbResult === 'error') {
      toast('QuickBooks connection failed (' + (params.get('reason') || 'unknown') + '). Please try again.', 'error')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [authed, password])

  useEffect(() => {
    if (!authed) return
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshData(password)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [authed, password])

  useEffect(() => {
    if (!authed) return
    const tick = setInterval(() => setSecondsSinceRefresh((s) => s + 1), 1000)
    return () => clearInterval(tick)
  }, [authed])

  useEffect(() => {
    setSecondsSinceRefresh(0)
  }, [lastRefreshedAt])

  function handleLogout() {
    localStorage.removeItem('admin_pass')
    setPassword('')
    setAuthed(false)
  }

  /* -- Route CRUD -- */

  const [savingBasePrice, setSavingBasePrice] = useState<string | null>(null)

  async function updateBasePrice(vehicle_type: string, data: { price_usd: number, price_per_mile: number, price_per_minute: number, min_price: number, max_price: number, multiplier: number }) {
    setSavingBasePrice(vehicle_type)
    try {
      const res = await fetch('/api/admin/prices', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${password}`
        },
        body: JSON.stringify({ vehicle_type, ...data })
      })
      if (!res.ok) throw new Error('Failed to update')
      const fetched = await fetchBasePrices(password)
      setBasePrices(fetched)
      setEditBasePriceData(
        Object.fromEntries(
          fetched.map((p) => [
            p.vehicle_type,
            { 
              price_usd: p.price_usd, 
              price_per_mile: p.price_per_mile || 0,
              price_per_minute: p.price_per_minute || 0,
              min_price: p.min_price || 0,
              max_price: p.max_price || 0,
              multiplier: p.multiplier || 1.0,
            }
          ])
        )
      )
    } catch (e: any) {
      toast(e.message, 'error')
    }
    setSavingBasePrice(null)
  }

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
        toast(`Error adding route: ${result.error || 'Unknown error'}`, 'error')
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
      toast(`Network error adding route: ${err}`, 'error')
    }
    setAddingRoute(false)
  }

  async function deleteRoute(id: string) {
    if (!(await confirmDialog('Are you sure you want to permanently delete this route?', { danger: true }))) return
    await fetch(`/api/admin/routes?id=${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${password}` },
    })
    const data = await fetchRoutes(password)
    setRoutePrices(data)
  }

  async function addDiscount() {
    setAddingDiscount(true)
    try {
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
        body: JSON.stringify({
          code: newDiscount.code,
          type: newDiscount.type,
          value: newDiscount.value,
          max_uses: newDiscount.max_uses ? parseInt(newDiscount.max_uses) : null,
          expires_at: newDiscount.expires_at || null,
          min_amount: newDiscount.min_amount ? parseFloat(newDiscount.min_amount) : null,
          client_name: newDiscount.client_name || null,
        }),
      })
      const result = await res.json()
      if (!res.ok) {
        toast(`Error adding code: ${result.error || 'Unknown error'}`, 'error')
        setAddingDiscount(false)
        return
      }
      const data = await fetchDiscountCodes(password)
      setDiscountCodes(data)
      setNewDiscount({ code: '', type: 'percent', value: 5, max_uses: '', expires_at: '', min_amount: '', client_name: '' })
    } catch (err) {
      toast(`Network error adding code: ${err}`, 'error')
    }
    setAddingDiscount(false)
  }

  async function saveDiscount(dc: DiscountCode) {
    setSavingDiscount(dc.id)
    const edit = editDiscountData[dc.id]
    await fetch('/api/admin/discount-codes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
      body: JSON.stringify({
        id: dc.id,
        code: edit?.code ?? dc.code,
        type: edit?.type ?? dc.type,
        value: edit?.value ?? dc.value,
        max_uses: edit?.max_uses !== undefined ? (edit.max_uses ? parseInt(edit.max_uses) : null) : dc.max_uses,
        expires_at: edit?.expires_at !== undefined ? (edit.expires_at || null) : dc.expires_at,
        min_amount: edit?.min_amount !== undefined ? (edit.min_amount ? parseFloat(edit.min_amount) : null) : dc.min_amount,
        client_name: edit?.client_name ?? dc.client_name,
        active: dc.active,
      }),
    })
    const data = await fetchDiscountCodes(password)
    setDiscountCodes(data)
    setSavingDiscount(null)
  }

  async function toggleDiscountActive(dc: DiscountCode) {
    setSavingDiscount(dc.id)
    await fetch('/api/admin/discount-codes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${password}` },
      body: JSON.stringify({ id: dc.id, active: !dc.active }),
    })
    const data = await fetchDiscountCodes(password)
    setDiscountCodes(data)
    setSavingDiscount(null)
  }

  async function deleteDiscount(id: string) {
    if (!(await confirmDialog('Are you sure you want to permanently delete this discount code?', { danger: true }))) return
    await fetch(`/api/admin/discount-codes?id=${id}`, {
      method: 'DELETE',
      headers: { authorization: `Bearer ${password}` },
    })
    const data = await fetchDiscountCodes(password)
    setDiscountCodes(data)
  }

  async function addLead(): Promise<boolean> {
    setAddingLead(true)
    try {
      // Reservations paid on Stripe keep the old flow: they're created as a
      // plain lead ('new') and the admin sends an invoice / payment link
      // afterward. Reservations already collected elsewhere (the external
      // platform, cash) go straight in as paid — that's what makes the
      // calendar event get created immediately instead of living only in
      // the other platform's calendar.
      const isExternalPayment = newLead.paymentSource !== 'stripe'
      let resolvedStatus = newLead.status
      let amountPaid = 0
      let amountRemaining = 0

      if (isExternalPayment) {
        if (newLead.fullyPaid) {
          resolvedStatus = 'paid'
          amountPaid = newLead.amountUsd
          amountRemaining = 0
        } else {
          resolvedStatus = 'deposit_paid'
          amountPaid = newLead.amountPaid
          amountRemaining = Math.max(newLead.amountUsd - newLead.amountPaid, 0)
        }
      }

      const payload = {
        ...newLead,
        pickup: newLead.pickup.trim(),
        destination: newLead.destination.trim(),
        status: resolvedStatus,
        amountPaid,
        amountRemaining,
      }

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${password}`
        },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (!res.ok) {
        toast(`Error adding lead: ${result.error || 'Unknown error'}`, 'error')
        setAddingLead(false)
        return false
      }
      const [leadsData, bookingsData] = await Promise.all([fetchLeads(password), fetchBookings(password)])
      setLeads(leadsData)
      setBookings(bookingsData)
      setNewLead({ ...emptyNewLead, hotelSlug: hotelOptions[0] || '' })
      setAddingLead(false)
      return true
    } catch (err) {
      toast(`Network error adding lead: ${err}`, 'error')
      setAddingLead(false)
      return false
    }
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
        toast(`Error updating lead: ${result.error || 'Unknown error'}`, 'error')
        // Revert UI optimistic update by refreshing from server
        fetchLeads(password).then(setLeads)
      }
    } catch (e) {
      toast(`Network error updating lead: ${e}`, 'error')
      fetchLeads(password).then(setLeads)
    }
  }

  async function deleteLead(id: string): Promise<boolean> {
    if (!(await confirmDialog('Are you sure you want to delete this lead?', { danger: true }))) return false
    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: 'DELETE',
        headers: { authorization: `Bearer ${password}` },
      })
      if (!res.ok) throw new Error('Failed to delete lead')
      setLeads((prev) => prev.filter((l) => l.id !== id))
      return true
    } catch (e: any) {
      toast(e.message, 'error')
      return false
    }
  }

  async function sendInvoice(leadId: string) {
    if (!(await confirmDialog('Are you sure you want to send an invoice via email to this customer?'))) return
    setSendingInvoice(leadId)
    try {
      const res = await fetch('/api/admin/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ leadId })
      })
      const data = await res.json()
      if (data.success) {
        toast('Invoice sent successfully!', 'success')
        updateLead(leadId, { status: 'invoice_sent' })
      } else {
        toast('Error: ' + data.error, 'error')
      }
    } catch (e: any) {
      toast('Error: ' + e.message, 'error')
    } finally {
      setSendingInvoice(null)
    }
  }

  async function sendQuickBooksInvoice(leadId: string) {
    if (!(await confirmDialog('Are you sure you want to send this invoice via QuickBooks?'))) return
    setSendingQuickBooksInvoice(leadId)
    try {
      const res = await fetch('/api/admin/quickbooks-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ leadId })
      })
      const data = await res.json()
      if (data.success) {
        if (data.invoiceLink) setGeneratedLink(data.invoiceLink)
        toast(
          data.emailSent ? 'QuickBooks invoice sent successfully!' : 'Invoice created in QuickBooks, but the automatic email failed to send — use the payment link below instead, or resend it from QuickBooks directly.',
          data.emailSent ? 'success' : 'error'
        )
        updateLead(leadId, { status: 'invoice_sent' })
      } else {
        toast('Error: ' + data.error, 'error')
      }
    } catch (e: any) {
      toast('Error: ' + e.message, 'error')
    } finally {
      setSendingQuickBooksInvoice(null)
    }
  }

  async function fetchQuickBooksStatus(pw: string) {
    try {
      const res = await fetch('/api/quickbooks/status', {
        headers: { Authorization: `Bearer ${pw}` },
      })
      const data = await res.json()
      setQbConnected(!!data.connected)
      setQbStatusDetail(
        data.connected
          ? { companyName: data.companyName, environment: data.environment }
          : data.error
          ? { error: data.error, environment: data.environment }
          : null
      )
    } catch {
      setQbConnected(false)
      setQbStatusDetail(null)
    }
  }

  async function moderateReview(id: string, status: 'approved' | 'rejected') {
    setReviewActionId(id)
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ id, status })
      })
      const data = await res.json()
      if (data.success) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, status, reviewed_at: new Date().toISOString() } : r))
      } else {
        toast('Error: ' + data.error, 'error')
      }
    } catch (e: any) {
      toast('Error: ' + e.message, 'error')
    } finally {
      setReviewActionId(null)
    }
  }

  async function sendReviewRequest(leadId: string) {
    setSendingReview(leadId)
    try {
      const res = await fetch('/api/admin/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${password}` },
        body: JSON.stringify({ lead_id: leadId })
      })
      const data = await res.json()
      if (data.success) {
        toast('Review request sent!', 'success')
      } else {
        toast('Error: ' + data.error, 'error')
      }
    } catch (e: any) {
      toast('Error: ' + e.message, 'error')
    } finally {
      setSendingReview(null)
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
        setGeneratedLink(data.url)
        try { await navigator.clipboard.writeText(data.url) } catch(e) {} // Fallback silent copy
        fetchLeads(password).then(setLeads)
      } else {
        toast('Failed to generate Stripe link: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (e: any) {
      toast('Error: ' + e.message, 'error')
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
        setGeneratedLink(data.url)
        try { await navigator.clipboard.writeText(data.url) } catch(e) {} // Fallback silent copy
      } else {
        toast('Failed to generate Stripe link: ' + (data.error || 'Unknown error'), 'error')
      }
    } catch (e: any) {
      toast('Error: ' + e.message, 'error')
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
      color: { dark: 'var(--bg)', light: 'var(--text)' },
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
    if (!(await confirmDialog('Are you sure you want to remove this client?', { danger: true }))) return
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
    if (!(await confirmDialog('Are you sure you want to remove this driver?', { danger: true }))) return
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
      hotel_b2b:      { bg: 'rgba(45, 212, 191, 0.1)', text: '#2dd4bf',  border: 'rgba(45, 212, 191, 0.25)' },
    }
    const c = colors[status] || colors.inactive
    const displayLabel = status === 'deposit_paid' ? 'Deposit Paid' : status === 'hotel_b2b' ? 'Hotel B2B' : status
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

  /* -- Sidebar Groups -- */
  const sidebarGroups = [
    {
      group: 'Operations',
      items: [
        { key: 'bookings', label: 'Reservations', icon: <IconBookings /> },
        { key: 'dispatch', label: 'Dispatch', icon: <IconDispatch /> },
        { key: 'drivers', label: 'Drivers', icon: <IconDrivers /> },
      ] as SidebarItem[]
    },
    {
      group: 'Stay',
      items: [
        { key: 'stay', label: 'Stay (Hotels)', icon: <IconHotel />, getBadge: () => stayBookings.filter(b => b.status === 'paid').length },
      ] as SidebarItem[]
    },
    {
      group: 'Sales & Finance',
      items: [
        { key: 'leads', label: 'Sales Pipeline', icon: <IconLeads />, getBadge: () => leads.filter(l => ['new', 'pending_payment', 'invoice_sent'].includes(l.status || '') && l.status !== 'quote_requested' && l.status !== 'hotel_b2b').length },
        { key: 'quotes', label: 'Quotes (Manual)', icon: <IconQuotes />, getBadge: () => leads.filter(l => l.status === 'quote_requested').length },
        { key: 'hotel_bookings', label: 'Hotel Bookings', icon: <IconHotel />, getBadge: () => leads.filter(l => l.status === 'hotel_b2b').length },
        { key: 'clients', label: 'Frequent Flyers', icon: <IconClients /> },
        { key: 'reviews', label: 'Reviews', icon: <IconReviews />, getBadge: () => reviews.filter(r => r.status === 'pending').length },
        { key: 'revenue', label: 'Revenue Dashboard', icon: <IconRevenue /> },
      ] as SidebarItem[]
    }
  ]

  const settingsItems = [
    { key: 'websites', label: 'Websites & Domains', icon: <IconWeb /> },
    { key: 'routes', label: 'Routes & Pricing', icon: <IconRoutes /> },
    { key: 'discounts', label: 'Discount Codes', icon: <IconDiscount /> },
    { key: 'commissions', label: 'Commissions', icon: <DollarSign size={20} /> },
    { key: 'qr', label: 'QR Codes', icon: <IconQR /> },
  ] as SidebarItem[]

  /* =================================================== */
  /*  LOGIN SCREEN                                       */
  /* =================================================== */

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-deep)] text-[#E5E5E5] font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--gold)] border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (!authed) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-deep)' }}>
        <form
          onSubmit={handleLogin}
          className="flex flex-col gap-5 w-full max-w-sm p-10 rounded-2xl"
          style={{ background: 'var(--bg)', border: '1px solid var(--surface-alt)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold)' }}>
              <span className="text-black font-bold text-sm">EL</span>
            </div>
            <div>
              <p className="text-base font-bold tracking-[3px] uppercase" style={{ color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
                Express Lyft
              </p>
              <p className="text-xs uppercase tracking-[2px]" style={{ color: 'var(--text-muted)' }}>
                Admin Console
              </p>
            </div>
          </div>

          <input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--gold)]"
            style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'var(--text)' }}
          />
          {authError && <p className="text-sm text-red-400">{authError}</p>}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
          >
            Authenticate
          </button>
        </form>


      </main>
    )
  }

  // Filter & paginate bookings
  const filteredBookings = bookings.filter((b) => {
    if (bookingsStatusFilter !== 'all' && b.status !== bookingsStatusFilter) return false;
    // Matches if EITHER leg (pickup or, for round trips, the return) falls
    // inside the range, so a round-trip still shows up when filtering by its
    // drop-off day even though its pickup day is outside the range.
    if (bookingsDateFrom || bookingsDateTo) {
      const legDates = [b.date, b.trip_type === 'round-trip' ? b.return_date : null].filter(Boolean) as string[]
      const inRange = legDates.some(d => (!bookingsDateFrom || d >= bookingsDateFrom) && (!bookingsDateTo || d <= bookingsDateTo))
      if (!inRange) return false
    }
    if (bookingsVehicleFilter !== 'all' && b.vehicle_type !== bookingsVehicleFilter) return false;
    if (bookingsDriverFilter === 'assigned' && !b.assigned_driver_id) return false;
    if (bookingsDriverFilter === 'unassigned' && b.assigned_driver_id) return false;
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

  // Filter & paginate leads & quotes
  let baseLeads = leads.filter((l) => l.status !== 'quote_requested' && l.status !== 'hotel_b2b')
  if (activeTab === 'quotes') {
    baseLeads = leads.filter((l) => l.status === 'quote_requested')
  } else if (activeTab === 'hotel_bookings') {
    baseLeads = leads.filter((l) => l.status === 'hotel_b2b')
  }

  const filteredLeads = baseLeads
    .filter((l) => {
      const term = leadsSearch.toLowerCase()
      const matchesSearch = (
        (l.customer_name || '').toLowerCase().includes(term) ||
        (l.customer_email || '').toLowerCase().includes(term) ||
        (l.hotel_slug || '').toLowerCase().includes(term) ||
        (l.pickup || '').toLowerCase().includes(term) ||
        (l.destination || '').toLowerCase().includes(term) ||
        (l.status || '').toLowerCase().includes(term) ||
        (l.created_by || '').toLowerCase().includes(term)
      )
      const matchesStatus = leadsStatusFilter === 'all' || l.status === leadsStatusFilter
      let matchesOrigin = true
      if (leadsOriginFilter === 'website') matchesOrigin = l.booking_source !== 'manual'
      else if (leadsOriginFilter === 'manual') matchesOrigin = l.booking_source === 'manual'
      else if (leadsOriginFilter !== 'all') matchesOrigin = l.booking_source === 'manual' && l.created_by === leadsOriginFilter
      let matchesDate = true
      if (leadsDateFrom || leadsDateTo) {
        const legDates = [l.date, l.trip_type === 'round-trip' ? l.return_date : null].filter(Boolean) as string[]
        matchesDate = legDates.some(d => (!leadsDateFrom || d >= leadsDateFrom) && (!leadsDateTo || d <= leadsDateTo))
      }
      return matchesSearch && matchesStatus && matchesOrigin && matchesDate
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
    <div className="flex min-h-screen" style={{ background: 'var(--bg-deep)', color: 'var(--text)' }}>

      {/* -- Mobile nav backdrop -- */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* -- Sidebar -- */}
      <aside
        className={`w-[240px] h-screen flex flex-col py-6 px-4 fixed left-0 top-0 z-50 transition-transform duration-300 lg:translate-x-0 ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: '#0f0f0f', borderRight: '1px solid var(--surface)' }}
      >
        {/* Brand */}
        <div className="flex items-center justify-between px-2 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--gold)' }}>
              <span className="text-black font-bold text-xs">EL</span>
            </div>
            <div>
              <p className="text-sm font-bold tracking-[2px] uppercase" style={{ color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
                Express Lyft
              </p>
              <p className="text-[9px] uppercase tracking-[1.5px]" style={{ color: 'var(--text-dim)' }}>
                Management
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileNavOpen(false)}
            className="w-8 h-8 rounded-lg flex items-center justify-center lg:hidden"
            style={{ color: 'var(--text-dim)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex flex-col gap-6 flex-1 overflow-y-auto pr-2 pb-4 no-scrollbar">

          {/* Dashboard (Top Level) */}
          <div className="flex flex-col gap-1 mb-2">
            <button
              onClick={() => { setActiveTab('dashboard'); setMobileNavOpen(false) }}
              className="flex items-center gap-3 px-3 py-3 rounded-xl text-left text-sm transition-all"
              style={{
                background: activeTab === 'dashboard' ? 'linear-gradient(135deg, rgba(184, 150, 12, 0.15), rgba(212, 175, 55, 0.05))' : 'transparent',
                color: activeTab === 'dashboard' ? 'var(--gold-light)' : 'var(--text-dim)',
                border: activeTab === 'dashboard' ? '1px solid rgba(184, 150, 12, 0.2)' : '1px solid transparent',
              }}
            >
              <IconDashboard />
              <span className="font-semibold tracking-wide">Command Center</span>
            </button>
          </div>

          {sidebarGroups.map((group) => (
            <div key={group.group} className="flex flex-col gap-2 mb-2">
              <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#555]">{group.group}</h3>
              <div className="flex flex-col gap-1">
                {group.items.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => { setActiveTab(item.key as TabKey); setMobileNavOpen(false) }}
                    className="flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm transition-all hover:bg-[var(--surface)]"
                    style={{
                      background: activeTab === item.key ? 'linear-gradient(135deg, rgba(184, 150, 12, 0.15), rgba(212, 175, 55, 0.05))' : 'transparent',
                      color: activeTab === item.key ? 'var(--gold-light)' : 'var(--text-dim)',
                      border: activeTab === item.key ? '1px solid rgba(184, 150, 12, 0.2)' : '1px solid transparent',
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-semibold tracking-wide">{item.label}</span>
                    </div>
                    {item.getBadge && item.getBadge() > 0 && (
                      <span className="text-[10px] font-bold bg-[var(--gold-light)] text-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.4)]">
                        {item.getBadge()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Settings Group */}
          <div className="flex flex-col gap-2 mt-auto">
            <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#555]">Configuration</h3>
            <div className="flex flex-col gap-1">
              {settingsItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => { setActiveTab(item.key as TabKey); setMobileNavOpen(false) }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-all hover:bg-[var(--surface)]"
                  style={{
                    background: activeTab === item.key ? 'linear-gradient(135deg, rgba(184, 150, 12, 0.15), rgba(212, 175, 55, 0.05))' : 'transparent',
                    color: activeTab === item.key ? 'var(--gold-light)' : '#777',
                    border: activeTab === item.key ? '1px solid rgba(184, 150, 12, 0.2)' : '1px solid transparent',
                  }}
                >
                  {item.icon}
                  <span className="font-semibold tracking-wide">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>

        {/* QuickBooks connection status */}
        <div className="mt-auto pt-3 px-2">
          {qbConnected ? (
            <div className="flex flex-col gap-0.5 px-2 py-2 rounded-xl text-[11px]" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10B981' }}>
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#10B981' }} />
                <span className="font-semibold tracking-wide">QuickBooks Connected</span>
              </span>
              {qbStatusDetail?.companyName && (
                <span className="pl-3.5 text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
                  {qbStatusDetail.companyName}
                  {qbStatusDetail.environment === 'sandbox' && ' · sandbox'}
                </span>
              )}
            </div>
          ) : qbStatusDetail?.error ? (
            /* OAuth was completed but the API call fails — reconnecting won't
               help until the underlying cause (usually a wrong environment) is
               fixed, so surface the reason instead of a "Connect" button. */
            <div className="flex flex-col gap-1 px-2 py-2 rounded-xl text-[11px]" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }}>
              <span className="flex items-center gap-2">
                <AlertTriangle size={12} className="shrink-0" />
                <span className="font-semibold tracking-wide">QuickBooks Failing</span>
              </span>
              <span className="pl-5 text-[10px] leading-snug" style={{ color: 'var(--text-muted)' }}>
                {qbStatusDetail.environment === 'sandbox'
                  ? 'Pointed at sandbox — set QUICKBOOKS_ENVIRONMENT=production and redeploy.'
                  : qbStatusDetail.error.slice(0, 120)}
              </span>
              <a
                href={`/api/quickbooks/connect?key=${encodeURIComponent(password)}`}
                className="pl-5 text-[10px] underline hover:no-underline"
                style={{ color: 'var(--gold-light)' }}
              >
                Reconnect anyway
              </a>
            </div>
          ) : (
            <a
              href={`/api/quickbooks/connect?key=${encodeURIComponent(password)}`}
              className="flex items-center gap-2 px-2 py-2 rounded-xl text-[11px] transition-colors hover:bg-[var(--surface)]"
              style={{ border: '1px solid var(--border-soft)', color: 'var(--text-dim)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#555' }} />
              <span className="font-semibold tracking-wide">Connect QuickBooks</span>
            </a>
          )}
        </div>

        {/* User / Logout */}
        <div
          className="pt-4 px-2"
          style={{ borderTop: '1px solid var(--surface)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--surface)', color: 'var(--text-dim)' }}>
                A
              </div>
              <span className="text-[11px] text-[var(--text-subtle)]">Admin</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs uppercase tracking-widest hover:text-red-400 transition-colors"
              style={{ color: 'var(--text-dim)' }}
            >
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* -- Main Content -- */}
      <main className="flex-1 ml-0 lg:ml-[240px] p-4 lg:p-8 max-w-6xl w-full min-w-0">

        {/* -- Mobile top bar -- */}
        <div className="flex items-center justify-between mb-4 lg:hidden">
          <button
            onClick={() => setMobileNavOpen(true)}
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--gold)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <p className="text-xs font-bold tracking-[2px] uppercase" style={{ color: 'var(--gold)', fontFamily: 'Georgia, serif' }}>
            Express Lyft
          </p>
          <div className="w-9" />
        </div>

        {/* -- Live refresh indicator -- */}
        <div className="flex items-center justify-end gap-3 mb-4 -mt-2">
          <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            {isRefreshing
              ? 'Updating…'
              : lastRefreshedAt
              ? secondsSinceRefresh < 5
                ? 'Updated just now'
                : secondsSinceRefresh < 60
                ? `Updated ${secondsSinceRefresh}s ago`
                : `Updated ${Math.floor(secondsSinceRefresh / 60)}m ago`
              : ''}
          </span>
          <button
            onClick={() => refreshData(password)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all hover:brightness-110 disabled:opacity-50"
            style={{ borderColor: 'var(--border)', color: 'var(--gold)', background: 'var(--bg)' }}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isRefreshing ? 'animate-spin' : ''}
            >
              <path d="M21 12a9 9 0 1 1-2.64-6.36" />
              <path d="M21 3v6h-6" />
            </svg>
            Refresh
          </button>
        </div>

        {/* ------- DASHBOARD TAB ------- */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Command Center</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Overview and pending actions for your transportation business</p>
            </div>

            {/* TOP SECTION: High-Level Metrics */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <StatCard
                icon={<DollarSign size={20} />}
                iconColor="#10B981"
                label="Monthly Revenue"
                value={`$${revenueStats.currentMonthRevenue.toLocaleString()}`}
                trendPct={revenueStats.revenueTrendPct}
                caption="Collected this month (Stripe + External + Cash)"
              />
              <StatCard
                icon={<CalendarCheck size={20} />}
                iconColor="#60a5fa"
                label="Total Bookings"
                value={bookings.length}
                trendPct={revenueStats.bookingsTrendPct}
                caption={`${revenueStats.currentMonthBookings} this month`}
              />
              <StatCard
                icon={<ListTodo size={20} />}
                iconColor="var(--gold-light)"
                label="Pending Actions"
                value={leads.filter(l => ['pending_payment', 'new'].includes(l.status || '')).length}
                caption="Requires immediate attention"
              />
            </section>

            {/* ACTION CENTER */}
            <section>
              <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Action Center</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Abandoned Reservations */}
                <div 
                  onClick={() => { setActiveTab('leads'); setLeadsStatusFilter('pending_payment'); }}
                  className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-lg hover:shadow-red-900/20 hover:-translate-y-1 relative overflow-hidden group" 
                  style={{ background: 'linear-gradient(145deg, #160f0f, var(--bg))', border: '1px solid rgba(248, 113, 113, 0.1)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-400">
                      <span className="font-bold">{leads.filter(l => l.status === 'pending_payment').length}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Abandoned Reservations</p>
                      <p className="text-xs text-[var(--text-muted)]">Leads pending checkout</p>
                    </div>
                  </div>
                  <span className="text-[var(--text-muted)]">&rarr;</span>
                </div>

                {/* Manual Leads / Quotes */}
                <div 
                  onClick={() => { setActiveTab('quotes'); setLeadsStatusFilter('all'); }}
                  className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-lg hover:shadow-purple-900/20 hover:-translate-y-1 relative overflow-hidden group" 
                  style={{ background: 'linear-gradient(145deg, #140f1a, var(--bg))', border: '1px solid rgba(192, 132, 252, 0.1)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/10 text-purple-400">
                      <span className="font-bold">{leads.filter(l => l.status === 'quote_requested').length}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Pending Quotes</p>
                      <p className="text-xs text-[var(--text-muted)]">Needs manual processing (Buses)</p>
                    </div>
                  </div>
                  <span className="text-[var(--text-muted)] group-hover:text-purple-400 group-hover:translate-x-1 transition-all">&rarr;</span>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                </div>

                {/* Unassigned Trips */}
                <div 
                  onClick={() => { setActiveTab('dispatch'); }}
                  className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-lg hover:shadow-yellow-900/20 hover:-translate-y-1 relative overflow-hidden group" 
                  style={{ background: 'linear-gradient(145deg, #18150a, var(--bg))', border: '1px solid rgba(251, 191, 36, 0.1)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-yellow-500/10 text-yellow-400">
                      <span className="font-bold">{bookings.filter(b => !b.assigned_driver_id).length}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Unassigned Trips</p>
                      <p className="text-xs text-[var(--text-muted)]">Bookings without a driver</p>
                    </div>
                  </div>
                  <span className="text-[var(--text-muted)]">&rarr;</span>
                </div>

                {/* Deposits Awaiting Payment */}
                <div 
                  onClick={() => { setActiveTab('leads'); setLeadsStatusFilter('invoice_sent'); }}
                  className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all shadow-lg hover:shadow-blue-900/20 hover:-translate-y-1 relative overflow-hidden group" 
                  style={{ background: 'linear-gradient(145deg, #0d121a, var(--bg))', border: '1px solid rgba(96, 165, 250, 0.1)' }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500/10 text-blue-400">
                      <span className="font-bold">{leads.filter(l => l.status === 'invoice_sent').length}</span>
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">Invoices Sent</p>
                      <p className="text-xs text-[var(--text-muted)]">Awaiting deposit/payment</p>
                    </div>
                  </div>
                  <span className="text-[var(--text-muted)]">&rarr;</span>
                </div>

              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* LATEST BOOKINGS */}
              <section className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">Latest Bookings</h2>
                  <button onClick={() => setActiveTab('bookings')} className="text-xs text-[var(--gold)] hover:underline font-bold">
                    View All
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--surface)', background: 'var(--bg)' }}>
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead style={{ background: 'var(--surface-raised)', borderBottom: '1px solid #222' }}>
                      <tr>
                        <th className="px-4 py-3 font-medium text-[var(--text-muted)] w-1/3">Client</th>
                        <th className="px-4 py-3 font-medium text-[var(--text-muted)] w-1/4">Date</th>
                        <th className="px-4 py-3 font-medium text-[var(--text-muted)] w-1/4">Status</th>
                        <th className="px-4 py-3 font-medium text-[var(--text-muted)] text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                      {bookings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-faint)] italic">No recent bookings.</td>
                        </tr>
                      ) : (
                        bookings.slice(0, 5).map((b) => (
                          <tr key={b.id} className="hover:bg-[var(--surface)] transition-colors">
                            <td className="px-4 py-3 text-white font-medium">
                              <div className="truncate max-w-[150px]">{b.customer_name || 'Unknown'}</div>
                            </td>
                            <td className="px-4 py-3 text-[var(--text-subtle)]">{formatDateUS(b.date)}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider">
                                Confirmed
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-white font-medium">
                              ${b.amount_usd}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* RECENT ACTIVITY */}
              <section className="lg:col-span-1">
                <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">Recent Activity</h2>
                <div className="rounded-xl p-5 flex flex-col gap-4" style={{ border: '1px solid var(--surface)', background: 'var(--bg)' }}>
                  {leads.slice(0, 5).map((l, i) => (
                    <div key={l.id || i} className="flex gap-4">
                      <div className="relative mt-1">
                        <div className="w-2 h-2 rounded-full bg-[var(--gold)]" />
                        {i !== 4 && <div className="absolute top-2 left-1/2 -translate-x-1/2 w-px h-full bg-[var(--border-soft)]" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-white">
                          <span className="font-bold">{l.customer_name || 'A customer'}</span> 
                          {l.status === 'new' ? ' requested a quote' : l.status === 'pending_payment' ? ' abandoned checkout' : l.status === 'invoice_sent' ? ' received an invoice' : ' paid a deposit'}
                        </p>
                        <p className="text-xs text-[var(--text-faint)] mt-1">{timeAgo(l.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {leads.length === 0 && (
                    <p className="text-sm italic text-[var(--text-faint)] text-center">No recent activity.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}


        {/* ------- CLIENTS TAB ------- */}
        {activeTab === 'clients' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Frequent Flyers</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your frequent flyers, VIPs, and corporate partners. {clients.length} total clients.</p>
              </div>
              <button
                onClick={() => { resetClientForm(); setShowClientForm(true) }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
              >
                + New Client
              </button>
            </div>

            {/* Client Form Modal */}
            {showClientForm && (
              <div className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid #B8960C30' }}>
                <div className="flex items-center justify-between mb-6">
                  <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: 'var(--gold-light)' }}>
                    {editingClient ? 'Edit Client' : 'New Client'}
                  </p>
                  <button onClick={resetClientForm} className="text-xs text-[var(--text-subtle)] hover:text-red-400 transition-colors">
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
                      <label className="text-xs uppercase tracking-[2px]" style={{ color: 'var(--text-dim)' }}>{label}</label>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={clientForm[key] as string}
                        onChange={(e) => setClientForm({ ...clientForm, [key]: e.target.value })}
                        className="rounded-lg px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--gold)]"
                        style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'var(--text)' }}
                      />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: 'var(--text-dim)' }}>Status</label>
                    <select
                      value={clientForm.status}
                      onChange={(e) => setClientForm({ ...clientForm, status: e.target.value as Client['status'] })}
                      className="rounded-lg px-4 py-3 text-sm outline-none"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'var(--text)' }}
                    >
                      <option value="active">Active</option>
                      <option value="vip">VIP</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: 'var(--text-dim)' }}>Total Trips</label>
                    <input type="number" value={clientForm.total_trips} onChange={(e) => setClientForm({ ...clientForm, total_trips: parseInt(e.target.value) || 0 })} className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'var(--text)' }} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs uppercase tracking-[2px]" style={{ color: 'var(--text-dim)' }}>Total Spent ($)</label>
                    <input type="number" value={clientForm.total_spent} onChange={(e) => setClientForm({ ...clientForm, total_spent: parseInt(e.target.value) || 0 })} className="rounded-lg px-4 py-3 text-sm outline-none" style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'var(--text)' }} />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 mb-6">
                  <label className="text-xs uppercase tracking-[2px]" style={{ color: 'var(--text-dim)' }}>Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Private notes about this client..."
                    value={clientForm.notes}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    className="rounded-lg px-4 py-3 text-sm outline-none resize-none"
                    style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'var(--text)' }}
                  />
                </div>
                <button
                  onClick={handleSaveClient}
                  disabled={!clientForm.name || !clientForm.email || loadingClients}
                  className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                >
                  {loadingClients ? 'Saving...' : (editingClient ? 'Save Changes' : 'Create Client')}
                </button>
              </div>
            )}

            {/* Client Table */}
            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      {['Client', 'Hotel', 'Trips', 'Revenue', 'Status', 'Actions'].map((h) => (
                        <th key={h} className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((c) => (
                      <tr key={c.id} style={{ borderTop: '1px solid var(--surface)' }}>
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold">{c.name}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs text-[var(--text-subtle)]">{c.email}</p>
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
                          {c.phone && <p className="text-xs mt-1 text-[var(--text-subtle)] font-mono tracking-wider">{c.phone}</p>}
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
                              className="text-xs uppercase tracking-widest font-bold transition-colors hover:text-[var(--gold-light)]"
                              style={{ color: 'var(--text-dim)' }}
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
                            <p className="text-xs mt-2 italic flex items-start gap-1.5" style={{ color: 'var(--text-dim)' }}>
                              <StickyNote size={13} className="shrink-0 mt-0.5" /> {c.notes}
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

        {/* ------- WEBSITES & DOMAINS TAB ------- */}
        {activeTab === 'stay' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Stay</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hotels sold through stay.explyft.com — price, photo, inventory, and order shown to guests.</p>
              </div>
              <button
                onClick={() => setAddingStayHotel(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider"
                style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
              >
                + Add Hotel
              </button>
            </div>

            {addingStayHotel && (
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--gold)' }}>
                <h3 className="text-sm font-bold text-[var(--gold-light)] uppercase tracking-wider">New Stay Hotel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input placeholder="Name" value={newStayHotel.name} onChange={e => setNewStayHotel({ ...newStayHotel, name: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                  <input placeholder="Photo URL" value={newStayHotel.photo_url} onChange={e => setNewStayHotel({ ...newStayHotel, photo_url: e.target.value })} className="px-3 py-2 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                  <input type="number" placeholder="Price per room/night ($)" value={newStayHotel.price} onChange={e => setNewStayHotel({ ...newStayHotel, price: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                  <input type="number" placeholder="Transport portion ($)" value={newStayHotel.transport_amount} onChange={e => setNewStayHotel({ ...newStayHotel, transport_amount: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                  <input type="number" placeholder="Rooms available" value={newStayHotel.rooms_available} onChange={e => setNewStayHotel({ ...newStayHotel, rooms_available: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                  <input type="number" placeholder="Sort order (0 = first)" value={newStayHotel.sort_order} onChange={e => setNewStayHotel({ ...newStayHotel, sort_order: Number(e.target.value) })} className="px-3 py-2 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                </div>
                <div className="flex gap-3 mt-2">
                  <button disabled={savingStayHotel} onClick={() => saveStayHotel(newStayHotel)} className="px-4 py-2 rounded-lg text-xs font-bold uppercase" style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}>Save</button>
                  <button onClick={() => { setAddingStayHotel(false); setNewStayHotel(emptyStayHotel) }} className="px-4 py-2 rounded-lg text-xs font-bold uppercase text-[var(--text-muted)]">Cancel</button>
                </div>
              </div>
            )}

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {stayHotels.map(hotel => {
                const isEditing = editingStayHotel?.id === hotel.id
                const edit = isEditing ? editingStayHotel : hotel
                return (
                  <div key={hotel.id} className="rounded-xl p-5 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-light)' }}>{hotel.name}</h3>
                      <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: hotel.active ? 'rgba(74,222,128,0.15)' : 'rgba(255,255,255,0.08)', color: hotel.active ? '#4ade80' : 'var(--text-muted)' }}>
                        {hotel.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="flex flex-col gap-1 col-span-2">Name
                          <input value={edit.name} onChange={e => setEditingStayHotel({ ...edit, name: e.target.value })} className="px-2 py-1.5 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                        </label>
                        <label className="flex flex-col gap-1 col-span-2">Photo URL
                          <input value={edit.photo_url || ''} onChange={e => setEditingStayHotel({ ...edit, photo_url: e.target.value })} className="px-2 py-1.5 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                        </label>
                        <label className="flex flex-col gap-1">Price/night ($)
                          <input type="number" value={edit.price} onChange={e => setEditingStayHotel({ ...edit, price: Number(e.target.value) })} className="px-2 py-1.5 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                        </label>
                        <label className="flex flex-col gap-1">Transport portion ($)
                          <input type="number" value={edit.transport_amount} onChange={e => setEditingStayHotel({ ...edit, transport_amount: Number(e.target.value) })} className="px-2 py-1.5 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                        </label>
                        <label className="flex flex-col gap-1">Rooms available
                          <input type="number" value={edit.rooms_available} onChange={e => setEditingStayHotel({ ...edit, rooms_available: Number(e.target.value) })} className="px-2 py-1.5 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                        </label>
                        <label className="flex flex-col gap-1">Sort order
                          <input type="number" value={edit.sort_order} onChange={e => setEditingStayHotel({ ...edit, sort_order: Number(e.target.value) })} className="px-2 py-1.5 rounded-lg text-sm text-white bg-black/40 border border-[var(--border)]" />
                        </label>
                        <label className="flex items-center gap-2 col-span-2 mt-1">
                          <input type="checkbox" checked={edit.active} onChange={e => setEditingStayHotel({ ...edit, active: e.target.checked })} />
                          Active (visible on stay.explyft.com)
                        </label>
                        <div className="col-span-2 flex gap-2 mt-2">
                          <button disabled={savingStayHotel} onClick={() => saveStayHotel(edit)} className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase" style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}>Save</button>
                          <button onClick={() => setEditingStayHotel(null)} className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-[var(--text-muted)]">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><p className="text-[var(--text-faint)] text-xs">Price/night</p><p className="text-white font-semibold">${hotel.price}</p></div>
                          <div><p className="text-[var(--text-faint)] text-xs">Rooms left</p><p className="text-white font-semibold">{hotel.rooms_available}</p></div>
                          <div><p className="text-[var(--text-faint)] text-xs">Transport portion</p><p className="text-white font-semibold">${hotel.transport_amount}</p></div>
                          <div><p className="text-[var(--text-faint)] text-xs">Order</p><p className="text-white font-semibold">{hotel.sort_order}</p></div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => setEditingStayHotel(hotel)} className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-[var(--gold-light)] border border-[#B8960C]/40">Edit</button>
                          <button onClick={() => saveStayHotel({ id: hotel.id, active: !hotel.active })} className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-[var(--text-muted)] border border-[var(--border)]">{hotel.active ? 'Deactivate' : 'Activate'}</button>
                          <button onClick={() => deleteStayHotel(hotel.id)} className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase text-red-400 border border-red-900/40">Delete</button>
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
              {stayHotels.length === 0 && !addingStayHotel && (
                <p className="text-sm text-[#555] italic">No Stay hotels yet — click "+ Add Hotel" to create one.</p>
              )}
            </section>

            <div>
              <h2 className="text-lg font-bold mb-3" style={{ fontFamily: 'Georgia, serif' }}>Recent Stay Bookings</h2>
              <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--surface)' }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--surface-raised)' }}>
                      {['Guest', 'Hotel', 'Room', 'Nights', 'Check-in', 'Transport', 'Total', 'Status', 'Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stayBookings.map(b => {
                      const preTax = b.room_amount + b.transport_amount
                      const isPaid = b.status === 'paid' || b.status === 'paid_overbooked'
                      const grandTotal = isPaid ? preTax + (b.tax_collected || 0) : preTax
                      return (
                      <tr key={b.id} style={{ borderTop: '1px solid var(--surface)' }}>
                        <td className="px-4 py-2.5 text-white">{b.guest_name}<br /><span className="text-xs text-[var(--text-faint)]">{b.guest_phone}</span></td>
                        <td className="px-4 py-2.5 text-[#ccc]">{b.hotel_name}</td>
                        <td className="px-4 py-2.5 text-[#ccc]">{b.room_qty}x {b.room_type === '2_beds' ? '2 Beds' : '1 Bed'}</td>
                        <td className="px-4 py-2.5 text-[#ccc]">{b.nights}</td>
                        <td className="px-4 py-2.5 text-[#ccc]">{b.check_in_date}</td>
                        <td className="px-4 py-2.5 text-[#ccc]">Airport pickup · {b.pickup_time}</td>
                        <td className="px-4 py-2.5 text-white font-semibold">
                          ${grandTotal.toFixed(2)}
                          {isPaid && !!b.tax_collected && (
                            <div className="text-[10px] font-normal text-[var(--text-faint)]">${preTax.toFixed(2)} + ${b.tax_collected.toFixed(2)} tax</div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-xs font-bold px-2 py-1 rounded-full" style={{
                            background: b.status === 'paid' ? 'rgba(74,222,128,0.15)' : b.status === 'paid_overbooked' ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)',
                            color: b.status === 'paid' ? '#4ade80' : b.status === 'paid_overbooked' ? '#ef4444' : 'var(--text-muted)',
                          }}>{b.status}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <button onClick={() => deleteStayBooking(b.id)} className="text-xs font-bold uppercase text-red-400 hover:text-red-300">Delete</button>
                        </td>
                      </tr>
                      )
                    })}
                    {stayBookings.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-6 text-center text-[#555] italic">No Stay bookings yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'websites' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Websites & Domains</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Quick links to all your active landing pages, hotels, and promos.</p>
            </div>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Main Website */}
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-light)' }}>Main Website</h2>
                <p className="text-xs text-[var(--text-muted)]">The main landing page for general customers.</p>
                <div className="mt-auto pt-4">
                  <a href="/" target="_blank" className="text-sm text-[#4ade80] hover:underline flex items-center gap-2">
                    Open Main Site ↗
                  </a>
                </div>
              </div>

              {/* Dynamic Hotels */}
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-light)' }}>Hotel Pages</h2>
                <p className="text-xs text-[var(--text-muted)]">These are all the active hotels detected in your pricing database.</p>
                <div className="mt-2 flex flex-col gap-2">
                  {Array.from(new Set(routePrices.map(r => r.hotel_slug))).filter(Boolean).map(slug => (
                    <a key={slug} href={`/hotel/${slug}`} target="_blank" className="text-sm text-[#4ade80] hover:underline flex items-center gap-2">
                      /hotel/{slug} ↗
                    </a>
                  ))}
                  {Array.from(new Set(routePrices.map(r => r.hotel_slug))).filter(Boolean).length === 0 && (
                    <p className="text-xs text-[#555] italic">No hotels found in pricing.</p>
                  )}
                </div>
              </div>

              {/* Stay */}
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-light)' }}>Stay</h2>
                <p className="text-xs text-[var(--text-muted)]">Hotel + transportation for guests needing a room tonight.</p>
                <div className="mt-auto pt-4">
                  <a href="/stay" target="_blank" className="text-sm text-[#4ade80] hover:underline flex items-center gap-2">
                    Open Stay ↗
                  </a>
                </div>
              </div>

              {/* Promos */}
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif', color: 'var(--gold-light)' }}>Promo Links</h2>
                <p className="text-xs text-[var(--text-muted)]">You can create any promo code simply by typing it in the URL!</p>
                <div className="mt-auto pt-4">
                  <a href="/promo/SUMMER2026" target="_blank" className="text-sm text-[#4ade80] hover:underline flex items-center gap-2">
                    Example: /promo/SUMMER2026 ↗
                  </a>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ------- ROUTES TAB ------- */}
        {activeTab === 'routes' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Routes & Prices</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage base prices, per-mile rates, and per-route pricing by vehicle type</p>
            </div>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Time-of-Day Surcharge</h2>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Applied automatically per leg (pickup and, on round trips, the return separately) when its scheduled time falls inside the window below.
              </p>
              {!editPricingSettings ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : (
                <div className="flex flex-wrap items-end gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Type</label>
                    <select
                      value={editPricingSettings.surcharge_type}
                      onChange={(e) => setEditPricingSettings(prev => prev && ({ ...prev, surcharge_type: e.target.value as 'fixed' | 'percentage' }))}
                      className="rounded-lg px-3 py-2.5 text-sm text-white outline-none bg-[var(--bg-deep)] border border-[var(--surface-alt)] focus:border-[var(--gold)]"
                    >
                      <option value="fixed">Flat $ amount</option>
                      <option value="percentage">Percentage %</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {editPricingSettings.surcharge_type === 'percentage' ? 'Amount (%)' : 'Amount ($)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={editPricingSettings.surcharge_amount}
                      onChange={(e) => setEditPricingSettings(prev => prev && ({ ...prev, surcharge_amount: Number(e.target.value) }))}
                      className="w-28 rounded-lg px-3 py-2.5 text-sm text-white outline-none bg-[var(--bg-deep)] border border-[var(--surface-alt)] focus:border-[var(--gold)]"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold block mb-1.5" style={{ color: 'var(--text-muted)' }}>From hour</label>
                    <select
                      value={editPricingSettings.surcharge_start_hour}
                      onChange={(e) => setEditPricingSettings(prev => prev && ({ ...prev, surcharge_start_hour: Number(e.target.value) }))}
                      className="rounded-lg px-3 py-2.5 text-sm text-white outline-none bg-[var(--bg-deep)] border border-[var(--surface-alt)] focus:border-[var(--gold)]"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>{h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-bold block mb-1.5" style={{ color: 'var(--text-muted)' }}>Until hour</label>
                    <select
                      value={editPricingSettings.surcharge_end_hour}
                      onChange={(e) => setEditPricingSettings(prev => prev && ({ ...prev, surcharge_end_hour: Number(e.target.value) }))}
                      className="rounded-lg px-3 py-2.5 text-sm text-white outline-none bg-[var(--bg-deep)] border border-[var(--surface-alt)] focus:border-[var(--gold)]"
                    >
                      {Array.from({ length: 24 }, (_, h) => (
                        <option key={h} value={h}>{h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={updatePricingSettings}
                    disabled={savingPricingSettings}
                    className="px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                  >
                    {savingPricingSettings ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Online Deposit Payments</h2>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                When off, the public booking forms only offer &quot;Pay Full Amount&quot; — the &quot;Reserve with Deposit&quot; option is hidden for every guest.
              </p>
              {!editPricingSettings ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editPricingSettings.deposits_enabled}
                    onClick={() => setEditPricingSettings(prev => prev && ({ ...prev, deposits_enabled: !prev.deposits_enabled }))}
                    className="relative w-14 h-8 rounded-full transition-colors shrink-0"
                    style={{ background: editPricingSettings.deposits_enabled ? 'var(--gold)' : 'var(--border-soft)' }}
                  >
                    <span
                      className="absolute top-1 w-6 h-6 rounded-full bg-white transition-transform"
                      style={{ transform: editPricingSettings.deposits_enabled ? 'translateX(1.75rem)' : 'translateX(0.25rem)' }}
                    />
                  </button>
                  <span className="text-sm font-bold" style={{ color: editPricingSettings.deposits_enabled ? 'var(--gold-light)' : 'var(--text-muted)' }}>
                    {editPricingSettings.deposits_enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <button
                    onClick={updatePricingSettings}
                    disabled={savingPricingSettings}
                    className="ml-auto px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                  >
                    {savingPricingSettings ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Payment Provider</h2>
              </div>
              <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
                Which processor the public booking forms use to collect payment. Switching this doesn&apos;t affect the &quot;Send via QuickBooks&quot; button on individual leads in Sales Pipeline.
              </p>
              {!editPricingSettings ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border-soft)' }}>
                    <button
                      type="button"
                      onClick={() => setEditPricingSettings(prev => prev && ({ ...prev, payment_provider: 'stripe' }))}
                      className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                      style={{
                        background: editPricingSettings.payment_provider === 'stripe' ? 'var(--gold)' : 'transparent',
                        color: editPricingSettings.payment_provider === 'stripe' ? 'var(--bg-deep)' : 'var(--text-muted)',
                      }}
                    >
                      Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditPricingSettings(prev => prev && ({ ...prev, payment_provider: 'quickbooks' }))}
                      className="px-5 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
                      style={{
                        background: editPricingSettings.payment_provider === 'quickbooks' ? 'var(--gold)' : 'transparent',
                        color: editPricingSettings.payment_provider === 'quickbooks' ? 'var(--bg-deep)' : 'var(--text-muted)',
                      }}
                    >
                      QuickBooks
                    </button>
                  </div>
                  {editPricingSettings.payment_provider === 'quickbooks' && !qbConnected && (
                    <span className="text-xs font-bold flex items-start gap-1.5" style={{ color: '#f87171' }}>
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" /> QuickBooks isn&apos;t connected yet — connect it first (sidebar) or bookings will fail to check out.
                    </span>
                  )}
                  <button
                    onClick={updatePricingSettings}
                    disabled={savingPricingSettings}
                    className="ml-auto px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                  >
                    {savingPricingSettings ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </section>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold" style={{ fontFamily: 'Georgia, serif' }}>Dynamic Map Rates & Base Prices</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #222', color: 'var(--text-muted)' }}>
                      <th className="pb-3 px-4 font-normal">Vehicle Type</th>
                      <th className="pb-3 px-4 font-normal text-right">Base Price</th>
                      <th className="pb-3 px-4 font-normal text-right">Per Mile</th>
                      <th className="pb-3 px-4 font-normal text-right">Per Min</th>
                      <th className="pb-3 px-4 font-normal text-right">Min Price</th>
                      <th className="pb-3 px-4 font-normal text-right">Max Price</th>
                      <th className="pb-3 px-4 font-normal text-right">Multiplier</th>
                      <th className="pb-3 px-4 font-normal text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basePrices.map((bp) => (
                      <tr key={bp.vehicle_type} className="group" style={{ borderBottom: '1px solid var(--surface)' }}>
                        <td className="py-3 px-4 font-medium text-white">{VEHICLE_LABELS[bp.vehicle_type] || bp.vehicle_type}</td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            className="w-16 bg-transparent text-right border-b border-transparent group-hover:border-white/20 focus:border-white outline-none transition-colors"
                            value={editBasePriceData[bp.vehicle_type]?.price_usd ?? bp.price_usd}
                            onChange={(e) =>
                              setEditBasePriceData(prev => ({
                                ...prev,
                                [bp.vehicle_type]: { ...prev[bp.vehicle_type], price_usd: Number(e.target.value) }
                              }))
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 bg-transparent text-right border-b border-transparent group-hover:border-white/20 focus:border-white outline-none transition-colors"
                            value={editBasePriceData[bp.vehicle_type]?.price_per_mile ?? bp.price_per_mile ?? 0}
                            onChange={(e) =>
                              setEditBasePriceData(prev => ({
                                ...prev,
                                [bp.vehicle_type]: { ...prev[bp.vehicle_type], price_per_mile: Number(e.target.value) }
                              }))
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 bg-transparent text-right border-b border-transparent group-hover:border-white/20 focus:border-white outline-none transition-colors"
                            value={editBasePriceData[bp.vehicle_type]?.price_per_minute ?? bp.price_per_minute ?? 0}
                            onChange={(e) =>
                              setEditBasePriceData(prev => ({
                                ...prev,
                                [bp.vehicle_type]: { ...prev[bp.vehicle_type], price_per_minute: Number(e.target.value) }
                              }))
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 bg-transparent text-right border-b border-transparent group-hover:border-white/20 focus:border-white outline-none transition-colors"
                            value={editBasePriceData[bp.vehicle_type]?.min_price ?? bp.min_price ?? 0}
                            onChange={(e) =>
                              setEditBasePriceData(prev => ({
                                ...prev,
                                [bp.vehicle_type]: { ...prev[bp.vehicle_type], min_price: Number(e.target.value) }
                              }))
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 bg-transparent text-right border-b border-transparent group-hover:border-white/20 focus:border-white outline-none transition-colors"
                            value={editBasePriceData[bp.vehicle_type]?.max_price ?? bp.max_price ?? 0}
                            onChange={(e) =>
                              setEditBasePriceData(prev => ({
                                ...prev,
                                [bp.vehicle_type]: { ...prev[bp.vehicle_type], max_price: Number(e.target.value) }
                              }))
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <input
                            type="number"
                            step="0.01"
                            className="w-16 bg-transparent text-right border-b border-transparent group-hover:border-white/20 focus:border-white outline-none transition-colors"
                            value={editBasePriceData[bp.vehicle_type]?.multiplier ?? bp.multiplier ?? 1.0}
                            onChange={(e) =>
                              setEditBasePriceData(prev => ({
                                ...prev,
                                [bp.vehicle_type]: { ...prev[bp.vehicle_type], multiplier: Number(e.target.value) }
                              }))
                            }
                          />
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => updateBasePrice(bp.vehicle_type, editBasePriceData[bp.vehicle_type])}
                            disabled={savingBasePrice === bp.vehicle_type}
                            className="text-[var(--gold)] hover:text-white transition-colors disabled:opacity-50"
                          >
                            {savingBasePrice === bp.vehicle_type ? 'Saving...' : 'Save'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Route</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Sedan/SUV</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Suburban</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Sprinter</th>
                      <th className="py-2 text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routePrices.map((rp) => (
                      <tr key={rp.id} style={{ borderTop: '1px solid var(--surface)' }}>
                        <td className="py-4 pr-4">
                          <div className="flex flex-col gap-1.5 max-w-[280px]">
                            <div className="flex flex-wrap items-center gap-1.5 text-white font-semibold text-xs leading-relaxed">
                              <span className="bg-[var(--surface-raised)] border border-[#222] px-2.5 py-1 rounded text-gray-200">{rp.pickup}</span>
                              <span className="text-[var(--gold)] font-bold">→</span>
                              <span className="bg-[var(--surface-raised)] border border-[#222] px-2.5 py-1 rounded text-gray-200">{rp.destination}</span>
                            </div>
                            <span className="inline-block self-start px-1.5 py-0.5 rounded bg-[#1a1708] text-[9px] text-[var(--gold)] font-bold uppercase tracking-wider border border-[#332b0a]">
                              {rp.hotel_slug}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[var(--text-muted)]">$</span>
                            <input
                              type="number"
                              value={editRouteData[rp.id]?.sedan_suv ?? rp.sedan_suv_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], sedan_suv: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[var(--text-muted)]">$</span>
                            <input
                              type="number"
                              value={editRouteData[rp.id]?.suburban ?? rp.suburban_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], suburban: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <span className="text-[var(--text-muted)]">$</span>
                            <input
                              type="number"
                              value={editRouteData[rp.id]?.sprinter ?? rp.sprinter_price}
                              onChange={(e) =>
                                setEditRouteData((prev) => ({
                                  ...prev,
                                  [rp.id]: { ...prev[rp.id], sprinter: parseInt(e.target.value) || 0 },
                                }))
                              }
                              className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]"
                            />
                          </div>
                        </td>
                        <td className="py-4 text-right">
                          {savingRoute === rp.id ? (
                            <span className="text-[var(--gold)] uppercase tracking-widest text-xs font-bold">Saving…</span>
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
                                style={{ background: 'var(--gold)', color: 'var(--bg-deep)' }}
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
                        <td colSpan={5} className="py-4 text-center text-[var(--text-muted)] text-xs italic">
                          No routes configured yet.
                        </td>
                      </tr>
                    )}

                    {/* Add New Route */}
                    <tr style={{ borderTop: '1px solid var(--surface)' }}>
                      <td className="py-4 pr-4">
                        <div className="flex flex-col gap-2">
                          <input type="text" placeholder="Pickup" value={newRoute.pickup} onChange={(e) => setNewRoute({ ...newRoute, pickup: e.target.value })} list="route-locations" className="w-full text-xs rounded-lg border border-[var(--surface-alt)] bg-[var(--bg-deep)] p-2 text-white outline-none focus:border-[var(--gold)]" />
                          <input type="text" placeholder="Destination" value={newRoute.destination} onChange={(e) => setNewRoute({ ...newRoute, destination: e.target.value })} list="route-locations" className="w-full text-xs rounded-lg border border-[var(--surface-alt)] bg-[var(--bg-deep)] p-2 text-white outline-none focus:border-[var(--gold)]" />
                          <select value={newRoute.hotel_slug} onChange={(e) => setNewRoute({ ...newRoute, hotel_slug: e.target.value })} className="w-full text-xs rounded-lg border border-[var(--surface-alt)] bg-[var(--bg-deep)] p-2 text-white outline-none focus:border-[var(--gold)]">
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
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[var(--text-muted)]">$</span><input type="number" value={newRoute.sedan_suv_price || ''} onChange={(e) => setNewRoute({ ...newRoute, sedan_suv_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]" /></div></td>
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[var(--text-muted)]">$</span><input type="number" value={newRoute.suburban_price || ''} onChange={(e) => setNewRoute({ ...newRoute, suburban_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]" /></div></td>
                      <td className="py-4 pr-4"><div className="flex items-center gap-1"><span className="text-[var(--text-muted)]">$</span><input type="number" value={newRoute.sprinter_price || ''} onChange={(e) => setNewRoute({ ...newRoute, sprinter_price: parseInt(e.target.value) || 0 })} className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]" /></div></td>
                      <td className="py-4 text-right">
                        <button
                          onClick={addRoute}
                          disabled={addingRoute || !newRoute.pickup || !newRoute.destination}
                          className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                          style={{ border: '2px dashed var(--gold)', color: 'var(--gold)' }}
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

        {/* ------- DISCOUNT CODES TAB ------- */}
        {activeTab === 'discounts' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Discount Codes</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Each code belongs to one client or company. Applies to any booking on the site, never to deposits.</p>
            </div>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Code</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Client</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Discount</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Uses</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Expires</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Min. $</th>
                      <th className="py-2 pr-4 text-xs uppercase tracking-widest">Active</th>
                      <th className="py-2 text-xs uppercase tracking-widest text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((dc) => (
                      <tr key={dc.id} style={{ borderTop: '1px solid var(--surface)' }}>
                        <td className="py-4 pr-4">
                          <input
                            type="text"
                            value={editDiscountData[dc.id]?.code ?? dc.code}
                            onChange={(e) => setEditDiscountData((prev) => ({ ...prev, [dc.id]: { ...(prev[dc.id] || { type: dc.type, value: dc.value, max_uses: dc.max_uses?.toString() || '', expires_at: dc.expires_at?.slice(0, 10) || '', min_amount: dc.min_amount?.toString() || '', client_name: dc.client_name || '' }), code: e.target.value.toUpperCase() } }))}
                            className="w-28 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white font-bold outline-none focus:border-[var(--gold)]"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <input
                            type="text"
                            placeholder="e.g. Uber Corporate"
                            value={editDiscountData[dc.id]?.client_name ?? dc.client_name ?? ''}
                            onChange={(e) => setEditDiscountData((prev) => ({ ...prev, [dc.id]: { ...(prev[dc.id] || { code: dc.code, type: dc.type, value: dc.value, max_uses: dc.max_uses?.toString() || '', expires_at: dc.expires_at?.slice(0, 10) || '', min_amount: dc.min_amount?.toString() || '' }), client_name: e.target.value } }))}
                            className="w-36 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <select
                              value={editDiscountData[dc.id]?.type ?? dc.type}
                              onChange={(e) => setEditDiscountData((prev) => ({ ...prev, [dc.id]: { ...(prev[dc.id] || { code: dc.code, value: dc.value, max_uses: dc.max_uses?.toString() || '', expires_at: dc.expires_at?.slice(0, 10) || '', min_amount: dc.min_amount?.toString() || '', client_name: dc.client_name || '' }), type: e.target.value as 'percent' | 'fixed' } }))}
                              className="rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white text-xs outline-none focus:border-[var(--gold)]"
                            >
                              <option value="percent">%</option>
                              <option value="fixed">$</option>
                            </select>
                            <input
                              type="number"
                              value={editDiscountData[dc.id]?.value ?? dc.value}
                              onChange={(e) => setEditDiscountData((prev) => ({ ...prev, [dc.id]: { ...(prev[dc.id] || { code: dc.code, type: dc.type, max_uses: dc.max_uses?.toString() || '', expires_at: dc.expires_at?.slice(0, 10) || '', min_amount: dc.min_amount?.toString() || '', client_name: dc.client_name || '' }), value: parseFloat(e.target.value) || 0 } }))}
                              className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]"
                            />
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              placeholder="∞"
                              value={editDiscountData[dc.id]?.max_uses ?? (dc.max_uses?.toString() || '')}
                              onChange={(e) => setEditDiscountData((prev) => ({ ...prev, [dc.id]: { ...(prev[dc.id] || { code: dc.code, type: dc.type, value: dc.value, expires_at: dc.expires_at?.slice(0, 10) || '', min_amount: dc.min_amount?.toString() || '', client_name: dc.client_name || '' }), max_uses: e.target.value } }))}
                              className="w-14 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]"
                            />
                            <span className="text-xs text-[var(--text-muted)]">/ {dc.uses_count} used</span>
                          </div>
                        </td>
                        <td className="py-4 pr-4">
                          <input
                            type="date"
                            value={editDiscountData[dc.id]?.expires_at ?? (dc.expires_at?.slice(0, 10) || '')}
                            onChange={(e) => setEditDiscountData((prev) => ({ ...prev, [dc.id]: { ...(prev[dc.id] || { code: dc.code, type: dc.type, value: dc.value, max_uses: dc.max_uses?.toString() || '', min_amount: dc.min_amount?.toString() || '', client_name: dc.client_name || '' }), expires_at: e.target.value } }))}
                            className="w-36 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white text-xs outline-none focus:border-[var(--gold)]"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <input
                            type="number"
                            placeholder="none"
                            value={editDiscountData[dc.id]?.min_amount ?? (dc.min_amount?.toString() || '')}
                            onChange={(e) => setEditDiscountData((prev) => ({ ...prev, [dc.id]: { ...(prev[dc.id] || { code: dc.code, type: dc.type, value: dc.value, max_uses: dc.max_uses?.toString() || '', expires_at: dc.expires_at?.slice(0, 10) || '', client_name: dc.client_name || '' }), min_amount: e.target.value } }))}
                            className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]"
                          />
                        </td>
                        <td className="py-4 pr-4">
                          <button
                            onClick={() => toggleDiscountActive(dc)}
                            className="px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest"
                            style={dc.active ? { background: 'rgba(74, 222, 128, 0.12)', color: '#4ade80', border: '1px solid rgba(74, 222, 128, 0.3)' } : { background: 'rgba(153,153,153,0.1)', color: '#888', border: '1px solid #333' }}
                          >
                            {dc.active ? 'Active' : 'Off'}
                          </button>
                        </td>
                        <td className="py-4 text-right">
                          {savingDiscount === dc.id ? (
                            <span className="text-[var(--gold)] uppercase tracking-widest text-xs font-bold">Saving…</span>
                          ) : (
                            <div className="flex items-center justify-end gap-3">
                              <button
                                onClick={() => saveDiscount(dc)}
                                className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                                style={{ background: 'var(--gold)', color: 'var(--bg-deep)' }}
                              >
                                Save
                              </button>
                              <button
                                onClick={() => deleteDiscount(dc.id)}
                                className="text-red-900 hover:text-red-400 text-xs font-bold uppercase tracking-widest"
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}

                    {discountCodes.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-4 text-center text-[var(--text-muted)] text-xs italic">
                          No discount codes yet.
                        </td>
                      </tr>
                    )}

                    {/* Add New Discount Code */}
                    <tr style={{ borderTop: '1px solid var(--surface)' }}>
                      <td className="py-4 pr-4">
                        <input type="text" placeholder="e.g. UBER5" value={newDiscount.code} onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })} className="w-28 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white font-bold outline-none focus:border-[var(--gold)]" />
                      </td>
                      <td className="py-4 pr-4">
                        <input type="text" placeholder="e.g. Uber Corporate" value={newDiscount.client_name} onChange={(e) => setNewDiscount({ ...newDiscount, client_name: e.target.value })} className="w-36 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]" />
                      </td>
                      <td className="py-4 pr-4">
                        <div className="flex items-center gap-1">
                          <select value={newDiscount.type} onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value as 'percent' | 'fixed' })} className="rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white text-xs outline-none focus:border-[var(--gold)]">
                            <option value="percent">%</option>
                            <option value="fixed">$</option>
                          </select>
                          <input type="number" value={newDiscount.value || ''} onChange={(e) => setNewDiscount({ ...newDiscount, value: parseFloat(e.target.value) || 0 })} className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]" />
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <input type="number" placeholder="∞" value={newDiscount.max_uses} onChange={(e) => setNewDiscount({ ...newDiscount, max_uses: e.target.value })} className="w-14 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]" />
                      </td>
                      <td className="py-4 pr-4">
                        <input type="date" value={newDiscount.expires_at} onChange={(e) => setNewDiscount({ ...newDiscount, expires_at: e.target.value })} className="w-36 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white text-xs outline-none focus:border-[var(--gold)]" />
                      </td>
                      <td className="py-4 pr-4">
                        <input type="number" placeholder="none" value={newDiscount.min_amount} onChange={(e) => setNewDiscount({ ...newDiscount, min_amount: e.target.value })} className="w-16 rounded-lg bg-[var(--bg-deep)] border border-[var(--surface-alt)] p-2 text-white outline-none focus:border-[var(--gold)]" />
                      </td>
                      <td className="py-4 pr-4"></td>
                      <td className="py-4 text-right">
                        <button
                          onClick={addDiscount}
                          disabled={addingDiscount || !newDiscount.code || !newDiscount.value}
                          className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-40"
                          style={{ border: '2px dashed var(--gold)', color: 'var(--gold)' }}
                        >
                          {addingDiscount ? 'Wait…' : '+ Add'}
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
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Bookings</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Fully paid and confirmed trips. {filteredBookings.length} found ({bookings.length} total)</p>
              </div>
              <div className="flex flex-col gap-3 w-full lg:w-auto">
                <div className="relative w-full">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text-faint)' }} />
                  <input
                    type="text"
                    placeholder="Search bookings by name, email, route…"
                    value={bookingsSearch}
                    onChange={(e) => { setBookingsSearch(e.target.value); setBookingsPage(1); }}
                    className="rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors w-full"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    value={bookingsStatusFilter}
                    onChange={(e) => { setBookingsStatusFilter(e.target.value); setBookingsPage(1); }}
                    className="rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors"
                  >
                    <option value="all">All Statuses</option>
                    <option value="paid">Paid</option>
                    <option value="deposit_paid">Deposit Paid</option>
                    <option value="hotel_b2b">Hotel B2B</option>
                  </select>
                  <select
                    value={bookingsVehicleFilter}
                    onChange={(e) => { setBookingsVehicleFilter(e.target.value); setBookingsPage(1); }}
                    className="rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors"
                  >
                    <option value="all">All Vehicles</option>
                    {Object.entries(VEHICLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={bookingsDriverFilter}
                    onChange={(e) => { setBookingsDriverFilter(e.target.value); setBookingsPage(1); }}
                    className="rounded-xl px-4 py-2.5 text-sm text-white outline-none bg-[var(--bg)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors"
                  >
                    <option value="all">All Drivers</option>
                    <option value="assigned">Driver Assigned</option>
                    <option value="unassigned">Unassigned</option>
                  </select>
                  <CalendarRangeFilter
                    from={bookingsDateFrom}
                    to={bookingsDateTo}
                    onChange={(f, t) => { setBookingsDateFrom(f); setBookingsDateTo(t); setBookingsPage(1); }}
                  />
                </div>
              </div>
            </div>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              {loadingBookings ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>Loading…</p>
              ) : filteredBookings.length === 0 ? (
                <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>No bookings found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr style={{ color: 'var(--text-muted)' }}>
                        {['Date & Time', 'Passenger info', 'Route / Travel Details', 'Vehicle details', 'Price', 'Status & Action'].map((h) => (
                          <th key={h} className="pb-3 pr-4 text-xs uppercase tracking-widest font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedBookings.map((b) => (
                        <tr key={b.id} onClick={() => setViewingLead(b as any)} style={{ borderTop: '1px solid var(--surface)' }} className="hover:bg-[#1a1a1a40] transition-colors cursor-pointer">
                          <td className="py-4 pr-4 text-white">
                            <span className="font-bold block">{formatDateUS(b.date)}</span>
                            <span className="text-xs text-[var(--text-muted)]">{b.time || '—'}</span>
                          </td>
                          <td className="py-4 pr-4">
                            <p className="text-white text-xs font-bold">{b.customer_name || 'Guest'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{b.customer_email || '—'}</p>
                            {b.customer_phone && <p className="text-[11px] text-[var(--text-faint)] font-mono">{b.customer_phone}</p>}
                          </td>
                          <td className="py-4 pr-4 text-xs" style={{ color: 'var(--text-dim)' }}>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#33333340] text-[var(--text-muted)] w-fit">
                                {b.trip_type === 'round-trip' ? 'Round Trip' : 'One Way'}
                              </span>
                              <p className="text-white">{b.pickup} &rarr; {b.destination}</p>
                              {b.hotel_slug && <span className="text-[10px] text-[#555] uppercase font-semibold">Hotel: {b.hotel_slug}</span>}
                            </div>
                          </td>
                          <td className="py-4 pr-4">
                            <span className="text-xs uppercase font-bold block" style={{ color: 'var(--gold-light)' }}>
                              {VEHICLE_LABELS[b.vehicle_type] ?? b.vehicle_type}
                            </span>
                            <span className="text-[11px] text-[var(--text-muted)]">{b.passengers || 1} PAX</span>
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
                            {b.customer_email && (
                              <button
                                onClick={() => sendReviewRequest(b.id)}
                                disabled={sendingReview === b.id}
                                className="text-[11px] bg-[#B8960C]/10 text-[var(--gold-light)] px-2.5 py-1.5 rounded-lg border border-[#B8960C]/30 hover:bg-[#B8960C]/20 transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider disabled:opacity-50"
                              >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                                {sendingReview === b.id ? 'Sending...' : 'Ask for Review'}
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
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--surface)]">
                  <button
                    disabled={bookingsPage === 1}
                    onClick={() => setBookingsPage(p => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-soft)] text-xs font-semibold text-[var(--text-subtle)] hover:text-white disabled:opacity-40 transition-all"
                  >
                    &larr; Prev
                  </button>
                  <span className="text-xs text-[var(--text-faint)]">Page {bookingsPage} of {bookingsTotalPages}</span>
                  <button
                    disabled={bookingsPage === bookingsTotalPages}
                    onClick={() => setBookingsPage(p => Math.min(bookingsTotalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-soft)] text-xs font-semibold text-[var(--text-subtle)] hover:text-white disabled:opacity-40 transition-all"
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </section>
          </div>
        )}


        {/* ------- LEADS & QUOTES TAB ------- */}
        {(activeTab === 'leads' || activeTab === 'quotes' || activeTab === 'hotel_bookings') && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                    {activeTab === 'quotes' ? 'Manual Quotes (Buses)' : activeTab === 'hotel_bookings' ? 'Hotel Partner Bookings' : 'Sales Pipeline & Leads'}
                  </h1>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {activeTab === 'quotes'
                      ? 'High priority requests that need manual pricing and availability verification.'
                      : activeTab === 'hotel_bookings'
                      ? 'Manage bookings originating from B2B hotel partners (invoiced monthly).'
                      : 'Manage leads, follow-ups, and track conversions.'}
                  </p>
                </div>
                <Button
                  variant="primary"
                  icon={<Plus size={14} />}
                  onClick={() => { setNewLead({ ...emptyNewLead, hotelSlug: hotelOptions[0] || '' }); setShowAddLeadModal(true); }}
                  className="shrink-0"
                >
                  New Reservation
                </Button>
              </div>

              {/* Toolbar: search + filters, visually grouped as one surface */}
              <div
                className="flex flex-col md:flex-row md:items-center gap-3 rounded-2xl p-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border-faint)' }}
              >
                <SearchInput
                  value={leadsSearch}
                  onChange={(v) => { setLeadsSearch(v); setLeadsPage(1); }}
                  placeholder="Search name, email, phone…"
                  className="flex-1 min-w-0"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    ariaLabel="Filter by status"
                    value={leadsStatusFilter}
                    onChange={(v) => { setLeadsStatusFilter(v); setLeadsPage(1); }}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'pending_payment', label: 'Abandoned Carts', color: '#f87171' },
                      { value: 'new', label: 'Manual Leads', color: '#888888' },
                      { value: 'deposit_paid', label: 'Deposit Paid', color: '#FBBF24' },
                      { value: 'paid', label: 'Paid Bookings', color: '#34d399' },
                      { value: 'invoice_sent', label: 'Invoice Sent', color: '#60a5fa' },
                      { value: 'lost', label: 'Lost / Cancelled', color: '#F44336' },
                    ]}
                    className="w-[170px]"
                  />
                  <Select
                    ariaLabel="Filter by origin"
                    value={leadsOriginFilter}
                    onChange={(v) => { setLeadsOriginFilter(v); setLeadsPage(1); }}
                    options={[
                      { value: 'all', label: 'All Origins' },
                      { value: 'website', label: '🌐 Web' },
                      { value: 'manual', label: '✍ Manual (All Agents)' },
                      ...SALES_AGENTS.map((agent) => ({ value: agent, label: `✍ ${agent}` })),
                    ]}
                    className="w-[190px]"
                  />
                  <CalendarRangeFilter
                    from={leadsDateFrom}
                    to={leadsDateTo}
                    onChange={(f, t) => { setLeadsDateFrom(f); setLeadsDateTo(t); setLeadsPage(1); }}
                  />
                  <Select
                    ariaLabel="Sort reservations"
                    icon={<ArrowUpDown size={14} />}
                    value={leadsSortBy}
                    onChange={(v) => { setLeadsSortBy(v); setLeadsPage(1); }}
                    options={[
                      { value: 'newest', label: 'Newest First' },
                      { value: 'oldest', label: 'Oldest First' },
                      { value: 'amount_high', label: 'Amount: High to Low' },
                      { value: 'amount_low', label: 'Amount: Low to High' },
                    ]}
                    className="w-[180px]"
                  />
                </div>
              </div>
            </div>

            {/* Add Lead Modal */}
            {showAddLeadModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.85)' }}>
                <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-8 my-auto" style={{ background: '#151515', border: '1px solid var(--gold)' }}>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-widest">+ Add New Reservation</h2>
                    <button onClick={() => setShowAddLeadModal(false)} className="text-sm text-[var(--text-subtle)] hover:text-red-400 px-3 py-1 rounded-lg border border-[var(--border-soft)] hover:border-red-400 transition-all">x Close</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Name *</label>
                      <input type="text" placeholder="Full name" value={newLead.customerName} onChange={(e) => setNewLead({ ...newLead, customerName: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Email</label>
                      <input type="email" placeholder="email@example.com" value={newLead.customerEmail} onChange={(e) => setNewLead({ ...newLead, customerEmail: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Phone</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 123-4567"
                        value={newLead.customerPhone}
                        onChange={(e) => {
                          const phone = e.target.value
                          // Auto-fill Country from the dial code (+1, +57, ...) as the admin types,
                          // same way the public booking form's phone picker infers it.
                          const detectedCountry = parsePhoneNumberFromString(phone)?.country
                          const countryName = detectedCountry ? (countryNames as Record<string, string>)[detectedCountry] : undefined
                          setNewLead({ ...newLead, customerPhone: phone, ...(countryName ? { customerCountry: countryName } : {}) })
                        }}
                        className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Country</label>
                      <input type="text" placeholder="e.g. Colombia" value={newLead.customerCountry} onChange={(e) => setNewLead({ ...newLead, customerCountry: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Hotel *</label>
                      <select value={newLead.hotelSlug} onChange={(e) => setNewLead({ ...newLead, hotelSlug: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors">
                        <option value="">— Select Hotel —</option>
                        {hotelOptions.map((slug) => (<option key={slug} value={slug}>{slug}</option>))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Trip Type</label>
                      <select value={newLead.tripType} onChange={(e) => setNewLead({ ...newLead, tripType: e.target.value as any })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors">
                        <option value="one-way">One Way</option>
                        <option value="round-trip">Round Trip</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-5">
                    <label className="text-sm font-semibold text-[var(--text-subtle)] mb-2 block">Route</label>
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => setNewLead({ ...newLead, routeMode: 'preset', pickup: '', destination: '' })} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors" style={newLead.routeMode === 'preset' ? { background: 'var(--gold)', color: 'var(--bg-deep)' } : { background: 'var(--bg-deep)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        Preset Route (Airport/Port)
                      </button>
                      <button type="button" onClick={() => setNewLead({ ...newLead, routeMode: 'custom', pickup: '', destination: '' })} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors" style={newLead.routeMode === 'custom' ? { background: 'var(--gold)', color: 'var(--bg-deep)' } : { background: 'var(--bg-deep)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                        Custom Trip
                      </button>
                    </div>

                    {newLead.routeMode === 'preset' ? (
                      <select value={`${newLead.pickup}|||${newLead.destination}`} onChange={(e) => { const [p, d] = e.target.value.split('|||'); setNewLead({ ...newLead, pickup: p || '', destination: d || '' }); }} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors">
                        <option value="|||">— Select Route —</option>
                        {routeDropdownOptions.map((r) => (<option key={`${r.pickup}|||${r.destination}`} value={`${r.pickup}|||${r.destination}`}>{r.pickup} → {r.destination}</option>))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <input type="text" placeholder="Pickup (e.g. B Ocean Resort)" value={newLead.pickup} onChange={(e) => setNewLead({ ...newLead, pickup: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                        <input type="text" placeholder="Destination (e.g. Club Space Miami)" value={newLead.destination} onChange={(e) => setNewLead({ ...newLead, destination: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Date *</label>
                      <CalendarDatePicker
                        value={newLead.date}
                        onChange={(v) => setNewLead({ ...newLead, date: v })}
                        className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors text-left flex items-center justify-between gap-2"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Time *</label>
                      <select value={newLead.time} onChange={(e) => setNewLead({ ...newLead, time: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors">
                        <option value="">— Select Time —</option>
                        {TIME_SLOTS.map((t) => (<option key={t} value={t}>{t}</option>))}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Passengers</label>
                      <input type="number" placeholder="1" value={newLead.passengers} onChange={(e) => setNewLead({ ...newLead, passengers: parseInt(e.target.value) || 1 })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    {newLead.tripType === 'round-trip' && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-[var(--text-subtle)]">Return Date *</label>
                          <CalendarDatePicker
                            value={newLead.returnDate}
                            onChange={(v) => setNewLead({ ...newLead, returnDate: v })}
                            min={newLead.date}
                            className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors text-left flex items-center justify-between gap-2"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-sm font-semibold text-[var(--text-subtle)]">Return Time *</label>
                          <select value={newLead.returnTime} onChange={(e) => setNewLead({ ...newLead, returnTime: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors">
                            <option value="">— Select Time —</option>
                            {TIME_SLOTS.map((t) => (<option key={t} value={t}>{t}</option>))}
                          </select>
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Vehicle</label>
                      <select value={newLead.vehicleType} onChange={(e) => setNewLead({ ...newLead, vehicleType: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors">
                        <option value="sedan_suv">Sedan & SUV</option>
                        <option value="suburban">Suburban</option>
                        <option value="sprinter">Sprinter</option>
                        <option value="minibus">Mini Bus</option>
                        <option value="coachbus">Coach Bus</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">
                        {newLead.routeMode === 'preset' ? 'Total ($) — suggested from rate' : 'Total ($)'}
                      </label>
                      <input type="number" step="0.01" placeholder="0" value={newLead.amountUsd} onChange={(e) => setNewLead({ ...newLead, amountUsd: parseFloat(e.target.value) || 0 })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                      {newLead.paymentSource === 'stripe' && newLead.amountUsd > 0 && (
                        <p className="text-xs text-[var(--text-faint)]">
                          Customer pays ${(newLead.amountUsd * (1 + FL_TAX_RATE_PERCENT / 100)).toFixed(2)} (${newLead.amountUsd} + {FL_TAX_RATE_PERCENT}% FL sales tax)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 pt-5 border-t border-[var(--border)]">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Airline</label>
                      <input type="text" placeholder="e.g. Delta" value={newLead.airline} onChange={(e) => setNewLead({ ...newLead, airline: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Flight Number</label>
                      <input type="text" placeholder="e.g. DL123" value={newLead.flightNumber} onChange={(e) => setNewLead({ ...newLead, flightNumber: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Meeting Type</label>
                      <select value={newLead.meetingType} onChange={(e) => { const meetingType = e.target.value as any; setNewLead({ ...newLead, meetingType, meetGreetFee: meetingType === 'meet_greet' ? 25 : 0 }); }} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors">
                        <option value="curbside">Curbside</option>
                        <option value="meet_greet">Meet & Greet (+$25)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Luggage Count</label>
                      <input type="number" min={0} value={newLead.luggageCount} onChange={(e) => setNewLead({ ...newLead, luggageCount: parseInt(e.target.value) || 0 })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Car Seats</label>
                      <input type="number" min={0} value={newLead.carSeatsRequested} onChange={(e) => setNewLead({ ...newLead, carSeatsRequested: parseInt(e.target.value) || 0 })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-3">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Special Requests / Notes</label>
                      <textarea rows={2} placeholder="e.g. 3 cold Cokes, needs extra time, allergic to peanuts" value={newLead.notes} onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors resize-none" />
                    </div>
                  </div>

                  <div className="mb-5 pt-5 border-t border-[var(--border)]">
                    <label className="text-sm font-semibold text-[var(--text-subtle)] mb-2 block">Sales Agent (who's entering this)</label>
                    <div className="flex gap-2">
                      {SALES_AGENTS.map((agent) => (
                        <button key={agent} type="button" onClick={() => setNewLead({ ...newLead, agentName: agent })} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors" style={newLead.agentName === agent ? { background: 'var(--gold)', color: 'var(--bg-deep)' } : { background: 'var(--bg-deep)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {agent}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-[var(--text-faint)] mt-2">Used for the manual-bookings commission breakdown — every reservation added here counts as manual, tagged to whoever picked it.</p>
                  </div>

                  <div className="mb-5 pt-5 border-t border-[var(--border)]">
                    <label className="text-sm font-semibold text-[var(--text-subtle)] mb-2 block">Payment Source</label>
                    <div className="flex gap-2 mb-4">
                      {(['stripe', 'external', 'cash'] as const).map((src) => (
                        <button key={src} type="button" onClick={() => setNewLead({ ...newLead, paymentSource: src })} className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors" style={newLead.paymentSource === src ? { background: 'var(--gold)', color: 'var(--bg-deep)' } : { background: 'var(--bg-deep)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                          {src === 'stripe' ? 'Stripe' : src === 'external' ? 'External Platform' : 'Cash'}
                        </button>
                      ))}
                    </div>

                    {newLead.paymentSource === 'stripe' ? (
                      <p className="text-xs text-[var(--text-faint)]">Created as a pending reservation — use &quot;Generate Payment Link&quot; or &quot;Send Invoice&quot; afterward to collect payment.</p>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {newLead.paymentSource === 'external' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-semibold text-[var(--text-subtle)]">Platform</label>
                              <input type="text" placeholder="e.g. GetYourGuide" value={newLead.externalPlatform} onChange={(e) => setNewLead({ ...newLead, externalPlatform: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-semibold text-[var(--text-subtle)]">Reference / Booking #</label>
                              <input type="text" value={newLead.externalReference} onChange={(e) => setNewLead({ ...newLead, externalReference: e.target.value })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                            </div>
                          </div>
                        )}
                        <label className="flex items-center gap-2 text-sm text-[var(--text-subtle)]">
                          <input type="checkbox" checked={newLead.fullyPaid} onChange={(e) => setNewLead({ ...newLead, fullyPaid: e.target.checked })} />
                          Already collected in full
                        </label>
                        {!newLead.fullyPaid && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-semibold text-[var(--text-subtle)]">Amount Already Collected ($)</label>
                              <input type="number" step="0.01" placeholder="0" value={newLead.amountPaid} onChange={(e) => setNewLead({ ...newLead, amountPaid: parseFloat(e.target.value) || 0 })} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-4 py-3 text-white outline-none focus:border-[var(--gold)] transition-colors" />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-sm font-semibold text-[var(--text-subtle)]">Remaining Balance</label>
                              <input type="text" readOnly value={`$${Math.max(newLead.amountUsd - newLead.amountPaid, 0)}`} className="w-full text-sm rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text-muted)]" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-6 border-t border-[var(--border)]">
                    <button
                      onClick={async () => { const added = await addLead(); if (added) setShowAddLeadModal(false); }}
                      disabled={
                        addingLead ||
                        !newLead.customerName ||
                        !newLead.hotelSlug ||
                        !newLead.pickup ||
                        !newLead.destination ||
                        !newLead.amountUsd ||
                        !newLead.date ||
                        !newLead.time ||
                        !newLead.agentName ||
                        (newLead.tripType === 'round-trip' && (!newLead.returnDate || !newLead.returnTime))
                      }
                      className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all hover:brightness-110 disabled:opacity-40"
                      style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                    >
                      {addingLead ? 'Saving…' : newLead.paymentSource === 'stripe' ? '+ Add Reservation' : '+ Add Paid Reservation'}
                    </button>
                    <button onClick={() => setShowAddLeadModal(false)} className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border border-[var(--border-soft)] text-[var(--text-subtle)] hover:text-white hover:border-[#555] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Lead Modal */}
            {editingLead && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
                <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-8" style={{ background: '#151515', border: '2px solid var(--gold)' }}>
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-xl font-bold text-white">Editing: {editingLead.customer_name}</h2>
                    <button onClick={() => setEditingLead(null)} className="text-sm text-[var(--text-subtle)] hover:text-red-400 px-3 py-1 rounded-lg border border-[var(--border-soft)] hover:border-red-400 transition-all">x Close</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Full Name</label>
                      <input type="text" value={editingLead.customer_name || ''} onChange={(e) => setEditingLead({...editingLead, customer_name: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Email</label>
                      <input type="email" value={editingLead.customer_email || ''} onChange={(e) => setEditingLead({...editingLead, customer_email: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Phone</label>
                      <input type="tel" value={editingLead.customer_phone || ''} onChange={(e) => setEditingLead({...editingLead, customer_phone: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Passengers</label>
                      <input type="number" value={editingLead.passengers || 1} onChange={(e) => setEditingLead({...editingLead, passengers: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Trip Type</label>
                      <select value={editingLead.trip_type || 'one-way'} onChange={(e) => setEditingLead({...editingLead, trip_type: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors">
                        <option value="one-way">One Way</option>
                        <option value="round-trip">Round Trip</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Amount (USD)</label>
                      <input type="number" value={editingLead.amount_usd || 0} onChange={(e) => setEditingLead({...editingLead, amount_usd: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Date</label>
                      <CalendarDatePicker
                        value={editingLead.date || ''}
                        onChange={(v) => setEditingLead({ ...editingLead, date: v })}
                        className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors text-left flex items-center justify-between gap-2"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Time</label>
                      <input type="text" placeholder="e.g. 10:00 AM" value={editingLead.time || ''} onChange={(e) => setEditingLead({...editingLead, time: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Pickup</label>
                      <input type="text" value={editingLead.pickup || ''} onChange={(e) => setEditingLead({...editingLead, pickup: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Destination</label>
                      <input type="text" value={editingLead.destination || ''} onChange={(e) => setEditingLead({...editingLead, destination: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Airline</label>
                      <input type="text" value={editingLead.airline || ''} onChange={(e) => setEditingLead({...editingLead, airline: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Flight Number</label>
                      <input type="text" value={editingLead.flight_number || ''} onChange={(e) => setEditingLead({...editingLead, flight_number: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Meeting Type</label>
                      <select value={editingLead.meeting_type || 'curbside'} onChange={(e) => setEditingLead({...editingLead, meeting_type: e.target.value})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors">
                        <option value="curbside">Curbside</option>
                        <option value="meet_greet">Meet & Greet (+$25)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Meet & Greet Fee</label>
                      <input type="number" value={editingLead.meet_greet_fee || 0} onChange={(e) => setEditingLead({...editingLead, meet_greet_fee: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Luggage Count</label>
                      <input type="number" value={editingLead.luggage_count || 0} onChange={(e) => setEditingLead({...editingLead, luggage_count: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Car Seats</label>
                      <input type="number" value={editingLead.car_seats_requested || 0} onChange={(e) => setEditingLead({...editingLead, car_seats_requested: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Wait Time (Mins)</label>
                      <input type="number" value={editingLead.wait_time_minutes || 0} onChange={(e) => {
                        const mins = parseInt(e.target.value) || 0
                        const fee = mins > 30 ? Math.ceil((mins - 30) / 60) * 20 : 0
                        setEditingLead({...editingLead, wait_time_minutes: mins, wait_time_fee: fee})
                      }} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-[var(--text-subtle)]">Wait Time Fee ($)</label>
                      <input type="number" value={editingLead.wait_time_fee || 0} onChange={(e) => setEditingLead({...editingLead, wait_time_fee: parseInt(e.target.value)})} className="rounded-xl px-5 py-4 text-base text-white outline-none bg-[var(--bg-deep)] border border-[var(--border)] focus:border-[var(--gold)] transition-colors" />
                    </div>
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-[var(--border)]">
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
                      style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                    >
                      Save Changes
                    </button>
                    <button onClick={() => setEditingLead(null)} className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-widest border border-[var(--border-soft)] text-[var(--text-subtle)] hover:text-white hover:border-[#555] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredLeads.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm italic" style={{ color: 'var(--text-muted)' }}>
                  No reservations found.
                </div>
              )}
              {paginatedLeads.map((l) => (
                <div key={l.id} onClick={() => setViewingLead(l)} className="rounded-xl p-5 flex flex-col gap-3.5 border border-[var(--border)] bg-[var(--bg)] hover:border-[var(--gold)] transition-all cursor-pointer">

                  {/* Name, country, time ago */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-white truncate">{l.customer_name || 'Anonymous'}</h3>
                        {l.customer_country && <span className="text-[10px] bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded border border-blue-800/30 font-bold shrink-0">{l.customer_country}</span>}
                        {l.booking_source === 'manual' ? (
                          <span className="text-[10px] bg-amber-900/20 text-amber-400 px-1.5 py-0.5 rounded border border-amber-800/30 font-bold shrink-0">✍ {l.created_by || 'Manual'}</span>
                        ) : (
                          <span className="text-[10px] bg-sky-900/20 text-sky-400 px-1.5 py-0.5 rounded border border-sky-800/30 font-bold shrink-0">🌐 Web</span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--text-dim)] truncate">{l.customer_email || 'No email'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-[var(--text-faint)] uppercase tracking-wider shrink-0 mt-0.5">{timeAgo(l.created_at)}</span>
                  </div>

                  {/* Route, compact single line */}
                  <div className="flex items-center gap-2 text-sm text-white pt-3.5 border-t border-[#222]">
                    <span className="truncate">{l.pickup}</span>
                    <ArrowRight size={13} className="shrink-0" style={{ color: 'var(--text-faint)' }} />
                    <span className="truncate">{l.destination}</span>
                    <span className="ml-auto shrink-0 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded" style={{ background: l.trip_type === 'round-trip' ? '#B8960C20' : '#33333340', color: l.trip_type === 'round-trip' ? 'var(--gold)' : 'var(--text-muted)' }}>
                      {l.trip_type === 'round-trip' ? 'Round Trip' : 'One Way'}
                    </span>
                  </div>

                  {/* Date / vehicle meta row */}
                  <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span>{formatDateUS(l.date)} · {l.time || '—'}</span>
                    {l.trip_type === 'round-trip' && l.return_date && (
                      <span style={{ color: 'var(--gold)' }}>Return {formatDateUS(l.return_date)} · {l.return_time || '—'}</span>
                    )}
                    <span>{l.passengers || 1} PAX · <span className="font-bold" style={{ color: 'var(--gold-light)' }}>{VEHICLE_LABELS[l.vehicle_type] ?? l.vehicle_type}</span></span>
                  </div>

                  {/* Meet & Greet badge, only if present */}
                  {l.meeting_type === 'meet_greet' && (
                    <span className="self-start text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1" style={{ background: '#B8960C20', color: 'var(--gold-light)', border: '1px solid #B8960C50' }}>
                      <Sparkles size={11} /> VIP Meet &amp; Greet <span style={{ color: '#4ade80' }}>+${l.meet_greet_fee || 25}</span>
                    </span>
                  )}

                  {/* Phone / WhatsApp */}
                  {l.customer_phone && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-[var(--text-faint)] font-mono">{l.customer_phone}</span>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); openWhatsApp(l.customer_phone!, `Hi ${l.customer_name || 'Guest'}, this is Express Lyft. I saw you were looking for a transfer from ${l.pickup} to ${l.destination}. Would you like to complete your reservation?`); }}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  )}

                  {/* Price + quick-action selects */}
                  <div className="flex items-center justify-between gap-3 pt-3.5 border-t border-[#222]">
                    <div>
                      <span className="text-[10px] text-[var(--text-faint)] uppercase tracking-widest font-bold block">
                        {l.vehicle_type === 'coachbus' || l.vehicle_type === 'minibus' ? 'Custom Quote' : activeTab === 'hotel_bookings' ? 'Hotel Billable' : l.status === 'paid' && !!l.tax_collected ? 'Total Paid' : 'Est. Total'}
                      </span>
                      {l.vehicle_type === 'coachbus' || l.vehicle_type === 'minibus' ? (
                        <p className="text-base font-bold" style={{ color: 'var(--gold-accent)' }}>Pending</p>
                      ) : (
                        <>
                          <p className="text-lg font-bold" style={{ color: activeTab === 'hotel_bookings' ? '#2dd4bf' : '#4ade80' }}>
                            {activeTab === 'hotel_bookings' && !l.amount_usd
                              ? 'TBD'
                              : `$${(l.status === 'paid' ? (l.amount_usd || 0) + (l.tax_collected || 0) : l.amount_usd || 0).toFixed(2)}`}
                          </p>
                          {l.status === 'paid' && !!l.tax_collected && (
                            <p className="text-[10px] text-[var(--text-faint)]">${(l.amount_usd || 0).toFixed(2)} fare + ${l.tax_collected.toFixed(2)} tax</p>
                          )}
                        </>
                      )}
                      {l.status === 'deposit_paid' && (
                        <div className="w-16 bg-[var(--border)] rounded-full h-1 mt-1" title="20% Deposit Paid">
                          <div className="bg-[#FBBF24] h-1 rounded-full" style={{ width: '20%' }}></div>
                        </div>
                      )}
                    </div>

                    <div onClick={(e) => e.stopPropagation()} className="flex flex-col items-end gap-1.5">
                      <Select
                        ariaLabel="Lead status"
                        size="sm"
                        value={l.status || 'new'}
                        onChange={(v) => updateLead(l.id, { status: v })}
                        options={LEAD_STATUS_OPTIONS}
                        tone={STATUS_TONES[l.status || ''] ?? DEFAULT_STATUS_TONE}
                        className="w-[150px]"
                      />

                      <Select
                        ariaLabel="Assigned driver"
                        size="sm"
                        value={l.assigned_driver_id || ''}
                        onChange={(v) => updateLead(l.id, { assigned_driver_id: v || null })}
                        options={[
                          { value: '', label: 'Unassigned' },
                          ...drivers.map((d) => ({ value: d.id, label: d.name })),
                        ]}
                        tone={
                          l.assigned_driver_id
                            ? { bg: '#B8960C15', fg: 'var(--gold-light)', border: '#B8960C40' }
                            : DEFAULT_STATUS_TONE
                        }
                        className="w-[150px]"
                      />

                      <div className="flex items-center gap-2 mt-0.5">
                        {l.assigned_driver_id && drivers.find(d => d.id === l.assigned_driver_id)?.phone && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              const driver = drivers.find(d => d.id === l.assigned_driver_id);
                              if (driver) {
                                openWhatsApp(driver.phone, `Hi ${driver.name}, you have a new trip assigned:\n\nPassenger: ${l.customer_name}\nDate: ${formatDateUS(l.date)}\nTime: ${l.time}\nPickup: ${l.pickup}\nDropoff: ${l.destination}\nVehicle: ${VEHICLE_LABELS[l.vehicle_type] ?? l.vehicle_type}`);
                              }
                            }}
                          >
                            Notify Driver
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedNotes(prev => prev.includes(l.id) ? prev.filter(id => id !== l.id) : [...prev, l.id])}
                        >
                          {l.notes ? (expandedNotes.includes(l.id) ? 'Hide Notes' : 'View Notes') : '+ Add Note'}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Notes Section */}
                  {expandedNotes.includes(l.id) && (
                    <div onClick={(e) => e.stopPropagation()} className="border-t border-[#222] pt-3">
                      <textarea
                        rows={3}
                        defaultValue={l.notes}
                        placeholder="Type notes here..."
                        onBlur={(e) => {
                          updateLead(l.id, { notes: e.target.value })
                          if(!e.target.value) setExpandedNotes(prev => prev.filter(id => id !== l.id))
                        }}
                        className="w-full text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-deep)] px-3 py-2 text-white outline-none focus:border-[var(--gold)] transition-colors resize-y"
                      />
                    </div>
                  )}

                </div>
              ))}
            </div>

            {/* Pagination controls */}
            {leadsTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-[var(--surface)]">
                <button
                  disabled={leadsPage === 1}
                  onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded-xl border border-[var(--border-soft)] text-xs font-bold uppercase tracking-widest text-[var(--text-subtle)] hover:text-white hover:border-[#555] disabled:opacity-40 transition-all bg-[var(--bg)]"
                >
                  &larr; Prev
                </button>
                <span className="text-xs text-[var(--text-faint)] font-bold uppercase tracking-widest">Page {leadsPage} of {leadsTotalPages}</span>
                <button
                  disabled={leadsPage === leadsTotalPages}
                  onClick={() => setLeadsPage(p => Math.min(leadsTotalPages, p + 1))}
                  className="px-4 py-2 rounded-xl border border-[var(--border-soft)] text-xs font-bold uppercase tracking-widest text-[var(--text-subtle)] hover:text-white hover:border-[#555] disabled:opacity-40 transition-all bg-[var(--bg)]"
                >
                  Next &rarr;
                </button>
              </div>
            )}
            
          </div>
        )}

        {/* ------- REVIEWS TAB ------- */}
        {activeTab === 'reviews' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Reviews</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Nothing goes live on the website until you approve it here.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              {reviews.length === 0 && (
                <div className="p-10 text-center rounded-2xl" style={{ border: '1px dashed var(--border-soft)' }}>
                  <p className="text-[var(--text-muted)]">No reviews yet.</p>
                </div>
              )}
              {reviews.map((r) => (
                <div
                  key={r.id}
                  className="p-6 rounded-xl flex flex-col gap-4"
                  style={{
                    background: 'var(--bg)',
                    border: r.would_recommend === false ? '1px solid #7f1d1d' : '1px solid var(--surface)',
                  }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-white font-bold">{r.customer_name}</p>
                        <span
                          className="text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-full"
                          style={{
                            background: r.status === 'approved' ? 'rgba(74,222,128,0.1)' : r.status === 'rejected' ? 'rgba(148,163,184,0.1)' : r.status === 'pending' ? 'rgba(251,191,36,0.1)' : 'rgba(148,163,184,0.1)',
                            color: r.status === 'approved' ? '#4ade80' : r.status === 'rejected' ? '#94a3b8' : r.status === 'pending' ? '#FBBF24' : '#94a3b8',
                          }}
                        >
                          {r.status}
                        </span>
                        {r.hotel_slug && (
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-faint)]">{r.hotel_slug}</span>
                        )}
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{r.customer_email}</p>
                    </div>
                    {r.rating && (
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Star key={n} size={14} fill={n <= (r.rating || 0) ? 'var(--gold-light)' : 'none'} style={{ color: n <= (r.rating || 0) ? 'var(--gold-light)' : 'var(--border-soft)' }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {r.status === 'requested' ? (
                    <p className="text-sm italic" style={{ color: 'var(--text-faint)' }}>Waiting on customer response.</p>
                  ) : (
                    <>
                      <p className="text-sm font-bold flex items-center gap-1.5" style={{ color: r.would_recommend ? '#4ade80' : '#f87171' }}>
                        {r.would_recommend ? <><CheckCircle2 size={15} /> Recommends Express Lyft</> : <><XCircle size={15} /> Does not recommend</>}
                      </p>
                      {r.comment && (
                        <p className="text-sm italic" style={{ color: '#ccc' }}>&ldquo;{r.comment}&rdquo;</p>
                      )}
                    </>
                  )}

                  {r.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => moderateReview(r.id, 'approved')}
                        disabled={reviewActionId === r.id}
                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                      >
                        Approve — Show on Website
                      </button>
                      <button
                        onClick={() => moderateReview(r.id, 'rejected')}
                        disabled={reviewActionId === r.id}
                        className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all disabled:opacity-50 border border-[var(--border-soft)] text-[var(--text-subtle)] hover:text-white"
                      >
                        Keep Private
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------- REVENUE TAB ------- */}
        {activeTab === 'revenue' && (
          <div className="flex flex-col gap-8">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Revenue & Finance</h1>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Overview of gross income and cash flow</p>
            </div>

            {/* Top Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)]">Gross Revenue</p>
                <p className="text-3xl font-bold" style={{ color: '#4ade80' }}>${revenueStats.grossRevenue.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--text-faint)]">All collected income</p>
              </div>
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)]">Stripe</p>
                <p className="text-3xl font-bold" style={{ color: '#60a5fa' }}>${revenueStats.stripeTotal.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--text-faint)]">Direct to bank</p>
              </div>
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)]">External Platform</p>
                <p className="text-3xl font-bold" style={{ color: '#2dd4bf' }}>${revenueStats.externalTotal.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--text-faint)]">Collected on the other platform</p>
              </div>
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)]">Cash</p>
                <p className="text-3xl font-bold" style={{ color: '#c084fc' }}>${revenueStats.cashTotal.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--text-faint)]">Collected in person</p>
              </div>
              <div className="rounded-xl p-6 flex flex-col gap-3" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <p className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)]">Pending</p>
                <p className="text-3xl font-bold" style={{ color: '#FBBF24' }}>${revenueStats.pendingTotal.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[var(--text-faint)]">Outstanding deposit balances</p>
              </div>
            </section>

            {/* Tax collected — separate from revenue on purpose: this is money owed to the state, not income */}
            <section className="rounded-xl p-6 flex items-center justify-between" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <div>
                <p className="text-sm uppercase tracking-wider font-semibold text-[var(--text-muted)]">Florida Sales Tax Collected (7%)</p>
                <p className="text-xs uppercase tracking-wider text-[var(--text-faint)] mt-1">Not revenue — owed to the state. Only counts reservations since the tax went live.</p>
              </div>
              <p className="text-3xl font-bold" style={{ color: '#FBBF24' }}>${revenueStats.taxCollectedTotal.toLocaleString()}</p>
            </section>

            {/* Monthly Trend */}
            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <p className="text-sm font-bold uppercase tracking-wider mb-5 text-[var(--text-muted)]">Monthly Revenue Trend</p>
              {revenueStats.monthlyData.length === 0 ? (
                <p className="text-sm italic text-[var(--text-faint)]">No data available yet.</p>
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
                            style={{ height: `${heightPercent}%`, background: 'var(--gold)' }}
                          ></div>
                          <span className="absolute -top-6 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            ${amount.toLocaleString()}
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-[var(--text-muted)]">{month}</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Top Routes */}
            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="flex items-center justify-between mb-5">
                <p className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)]">Top Routes (By Revenue)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ color: 'var(--text-muted)' }}>
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">Route</th>
                      <th className="text-left py-2 pr-4 text-xs uppercase tracking-widest font-medium">Trips</th>
                      <th className="text-right py-2 text-xs uppercase tracking-widest font-medium">Revenue generated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueStats.topRoutes.map(([route, stats], idx) => (
                      <tr key={route} style={{ borderTop: '1px solid var(--surface)' }}>
                        <td className="py-4 pr-4">
                          <p className="text-white font-bold text-xs">{route.split(' -> ')[0]}</p>
                          <p className="text-[var(--text-muted)] text-[10px] mt-0.5">to {route.split(' -> ')[1]}</p>
                        </td>
                        <td className="py-4 pr-4 text-[var(--text-subtle)] font-bold text-xs">{stats.count}</td>
                        <td className="py-4 text-right font-bold" style={{ color: '#4ade80' }}>${stats.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                    {revenueStats.topRoutes.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-[var(--text-muted)] text-xs italic">No routes recorded yet.</td>
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
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your fleet and personnel</p>
              </div>
              <button
                onClick={() => setShowDriverForm(true)}
                className="px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
              >
                + New Driver
              </button>
            </div>

            {showDriverForm && (
              <section className="p-6 rounded-2xl relative" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                <button
                  onClick={resetDriverForm}
                  className="absolute top-6 right-6 text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
                <h2 className="text-lg font-bold mb-6 text-white">{editingDriver ? 'Edit Driver' : 'New Driver'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-bold">Driver Name</label>
                    <input
                      type="text"
                      value={newDriver.name}
                      onChange={e => setNewDriver(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[var(--gold)]"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'white' }}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-bold">Phone Number</label>
                    <input
                      type="text"
                      value={newDriver.phone}
                      onChange={e => setNewDriver(p => ({ ...p, phone: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[var(--gold)]"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'white' }}
                      placeholder="1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-bold">Vehicle Type</label>
                    <select
                      value={newDriver.vehicle_type}
                      onChange={e => setNewDriver(p => ({ ...p, vehicle_type: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[var(--gold)]"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'white' }}
                    >
                      {Object.entries(VEHICLE_LABELS).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-bold">License Plate</label>
                    <input
                      type="text"
                      value={newDriver.license_plate}
                      onChange={e => setNewDriver(p => ({ ...p, license_plate: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[var(--gold)]"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'white' }}
                      placeholder="ABC-123"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2 font-bold">Status</label>
                    <select
                      value={newDriver.status}
                      onChange={e => setNewDriver(p => ({ ...p, status: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl outline-none text-sm focus:border-[var(--gold)]"
                      style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'white' }}
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
                    style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                  >
                    {savingDriver ? 'Saving...' : 'Save Driver'}
                  </button>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {drivers.length === 0 && !loadingDrivers && (
                <div className="col-span-full p-10 text-center rounded-2xl" style={{ border: '1px dashed var(--border-soft)' }}>
                  <p className="text-[var(--text-muted)] mb-4">No drivers registered yet.</p>
                </div>
              )}
              {drivers.map(driver => (
                <div key={driver.id} className="rounded-2xl p-6 relative group" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditDriver(driver)} className="p-2 bg-[#222] text-[var(--text-muted)] hover:text-white rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>
                    <button onClick={() => handleDeleteDriver(driver.id)} className="p-2 bg-[#222] text-[var(--text-muted)] hover:text-red-400 rounded-lg transition-colors">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-[#222] border border-[var(--border-soft)]">
                      <IconDrivers />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{driver.name}</h3>
                      <p className="text-xs text-[var(--text-muted)]">{driver.phone}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--text-faint)] tracking-wider mb-1">Vehicle</p>
                      <p className="text-sm text-[#ddd]">{VEHICLE_LABELS[driver.vehicle_type] || driver.vehicle_type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--text-faint)] tracking-wider mb-1">Plate</p>
                      <p className="text-sm text-[#ddd] uppercase">{driver.license_plate}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--text-faint)] tracking-wider mb-1">Status</p>
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

        {/* ------- COMMISSIONS CALENDAR TAB ------- */}
        {activeTab === 'commissions' && (() => {
          // $2 per paid booking (transport or Stay), regardless of source —
          // grouped by the date it was created (i.e. when it came in), not
          // the trip date. Keyed off the ISO timestamp's date portion
          // directly (no Date() parsing) so it lines up with UTC-based
          // dates shown elsewhere in the admin (see formatDateUS).
          //
          // Also split web (booking_source !== 'manual') vs manual
          // (entered by staff through "Add Reservation") so the monthly
          // total can be broken down instead of just one lump count — Stay
          // bookings are always guest-self-service, so they always count
          // as web. This used to key off payment_source === 'stripe', but
          // that's the wrong signal: a manually-entered reservation can
          // still be paid via Stripe, which made it look like a web booking.
          // booking_source is set once, at creation, from who actually
          // submitted the request (see isAdmin in app/api/leads/route.ts),
          // so it can't drift after the fact the way payment method can.
          const commissionsByDay: Record<string, { total: number; web: number; other: number }> = {}
          const bump = (key: string, isWeb: boolean) => {
            if (!key) return
            if (!commissionsByDay[key]) commissionsByDay[key] = { total: 0, web: 0, other: 0 }
            commissionsByDay[key].total += 1
            if (isWeb) commissionsByDay[key].web += 1
            else commissionsByDay[key].other += 1
          }
          leads.forEach(l => {
            if (l.status === 'paid' || l.status === 'deposit_paid') {
              bump((l.created_at || '').slice(0, 10), l.booking_source !== 'manual')
            }
          })
          stayBookings.forEach(b => {
            if (b.status === 'paid' || b.status === 'paid_overbooked') {
              bump((b.created_at || '').slice(0, 10), true)
            }
          })

          const monthDays = getMonthGridDays(commissionMonth).filter(d => d.inMonth)
          const monthCount = monthDays.reduce((sum, d) => sum + (commissionsByDay[d.dateStr]?.total || 0), 0)
          const monthWeb = monthDays.reduce((sum, d) => sum + (commissionsByDay[d.dateStr]?.web || 0), 0)
          const monthOther = monthDays.reduce((sum, d) => sum + (commissionsByDay[d.dateStr]?.other || 0), 0)

          // Manual bookings by agent, for the sales-commission payout —
          // separate from the flat $2/booking calendar above, this is raw
          // count + revenue per agent so whatever commission formula gets
          // applied to it by hand.
          const monthDateSet = new Set(monthDays.map(d => d.dateStr))
          const agentSummary: Record<string, { count: number; revenue: number }> = {}
          leads.forEach(l => {
            if (
              l.booking_source === 'manual' &&
              (l.status === 'paid' || l.status === 'deposit_paid') &&
              monthDateSet.has((l.created_at || '').slice(0, 10))
            ) {
              const agent = l.created_by || 'Unassigned'
              if (!agentSummary[agent]) agentSummary[agent] = { count: 0, revenue: 0 }
              agentSummary[agent].count += 1
              agentSummary[agent].revenue += l.amount_usd || 0
            }
          })
          const agentSummaryRows = Object.entries(agentSummary).sort((a, b) => b[1].revenue - a[1].revenue)

          return (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Commissions</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>${COMMISSION_PER_BOOKING} per paid booking, by the date it came in.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { const d = new Date(commissionMonth); d.setMonth(d.getMonth() - 1); setCommissionMonth(d); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-subtle)] hover:text-white hover:border-[var(--gold)] transition-colors"
                  aria-label="Previous month"
                >&larr;</button>
                <span className="text-sm font-bold text-white min-w-[140px] text-center" style={{ fontFamily: 'Georgia, serif' }}>
                  {commissionMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => { const d = new Date(commissionMonth); d.setMonth(d.getMonth() + 1); setCommissionMonth(d); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-subtle)] hover:text-white hover:border-[var(--gold)] transition-colors"
                  aria-label="Next month"
                >&rarr;</button>
                <button
                  onClick={() => { const d = new Date(); d.setDate(1); setCommissionMonth(d); }}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] hover:text-[var(--gold-light)] hover:border-[var(--gold)] transition-colors"
                >Today</button>
              </div>
            </div>

            <div className="rounded-xl p-6 flex items-center justify-between" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#4ade80' }}>This Month</p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{monthCount} paid booking{monthCount === 1 ? '' : 's'}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>{monthWeb} web · {monthOther} manual</p>
              </div>
              <span className="text-4xl font-bold" style={{ color: '#4ade80', fontFamily: "'Playfair Display', Georgia, serif" }}>
                ${(monthCount * COMMISSION_PER_BOOKING).toFixed(2)}
              </span>
            </div>

            <div className="rounded-xl p-6" style={{ background: 'rgba(184,150,12,0.06)', border: '1px solid var(--border)' }}>
              <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--gold-light)' }}>Manual Bookings by Agent</p>
              {agentSummaryRows.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No manually-entered paid bookings this month.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {agentSummaryRows.map(([agent, s]) => (
                    <div key={agent} className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{agent}</span>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {s.count} booking{s.count === 1 ? '' : 's'} · <span className="font-bold" style={{ color: '#4ade80' }}>${s.revenue.toFixed(2)}</span> revenue
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="grid grid-cols-7">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] uppercase font-bold tracking-widest text-[var(--text-faint)] py-2 border-b border-[var(--surface)]">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {getMonthGridDays(commissionMonth).map(({ date, dateStr, inMonth }) => {
                  const isToday = dateStr === new Date().toLocaleDateString('en-CA')
                  const count = commissionsByDay[dateStr]?.total || 0
                  return (
                    <div
                      key={dateStr}
                      className="min-h-[76px] p-1.5 border-b border-r border-[var(--surface)] flex flex-col gap-1"
                      style={{ opacity: inMonth ? 1 : 0.35 }}
                    >
                      <span
                        className="text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                        style={{ color: isToday ? 'var(--bg-deep)' : 'var(--text-muted)', background: isToday ? 'var(--gold-light)' : 'transparent' }}
                      >
                        {date.getDate()}
                      </span>
                      {count > 0 && (
                        <div className="flex flex-col">
                          <span className="text-sm font-bold" style={{ color: '#4ade80' }}>${count * COMMISSION_PER_BOOKING}</span>
                          <span className="text-[10px] text-[var(--text-faint)]">{count} booking{count === 1 ? '' : 's'}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          )
        })()}

        {/* ------- DISPATCH CALENDAR TAB ------- */}
        {activeTab === 'dispatch' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Dispatch Calendar</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>View assigned trips and detect conflicts</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() - 1); setCalendarMonth(d); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-subtle)] hover:text-white hover:border-[var(--gold)] transition-colors"
                  aria-label="Previous month"
                >&larr;</button>
                <span className="text-sm font-bold text-white min-w-[140px] text-center" style={{ fontFamily: 'Georgia, serif' }}>
                  {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => { const d = new Date(calendarMonth); d.setMonth(d.getMonth() + 1); setCalendarMonth(d); }}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-subtle)] hover:text-white hover:border-[var(--gold)] transition-colors"
                  aria-label="Next month"
                >&rarr;</button>
                <button
                  onClick={() => { const d = new Date(); d.setDate(1); setCalendarMonth(d); }}
                  className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs font-bold uppercase tracking-wider text-[var(--text-subtle)] hover:text-[var(--gold-light)] hover:border-[var(--gold)] transition-colors"
                >Today</button>
              </div>
            </div>

            {/* Month grid — mirrors what should be on Google Calendar, straight from the leads table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="grid grid-cols-7">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                  <div key={d} className="text-center text-[10px] uppercase font-bold tracking-widest text-[var(--text-faint)] py-2 border-b border-[var(--surface)]">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {getMonthGridDays(calendarMonth).map(({ date, dateStr, inMonth }) => {
                  const isToday = dateStr === new Date().toLocaleDateString('en-CA')
                  const dayLeads = leads.filter(l =>
                    (l.date === dateStr || (l.trip_type === 'round-trip' && l.return_date === dateStr)) &&
                    (l.status === 'paid' || l.status === 'deposit_paid' || l.status === 'hotel_b2b')
                  )
                  const STATUS_DOT: Record<string, string> = { paid: '#4ade80', deposit_paid: '#FBBF24', hotel_b2b: '#2dd4bf' }
                  return (
                    <div
                      key={dateStr}
                      className="min-h-[92px] p-1.5 border-b border-r border-[var(--surface)] flex flex-col gap-1"
                      style={{ opacity: inMonth ? 1 : 0.35 }}
                    >
                      <span
                        className="text-[11px] font-bold w-5 h-5 flex items-center justify-center rounded-full"
                        style={{ color: isToday ? 'var(--bg-deep)' : 'var(--text-muted)', background: isToday ? 'var(--gold-light)' : 'transparent' }}
                      >
                        {date.getDate()}
                      </span>
                      <div className="flex flex-col gap-0.5">
                        {dayLeads.slice(0, 3).map(l => {
                          const isReturnLeg = l.date !== dateStr
                          return (
                            <button
                              key={l.id + (isReturnLeg ? '-return' : '')}
                              onClick={() => setViewingLead(l)}
                              title={[
                                `${l.customer_name} • ${l.pickup} → ${l.destination}`,
                                (l.airline || l.flight_number) ? `Flight: ${[l.airline, l.flight_number].filter(Boolean).join(' ')}` : null,
                                (l.car_seats_requested ?? 0) > 0 ? `${l.car_seats_requested} car seat(s)` : null,
                                (l.luggage_count ?? 0) > 0 ? `${l.luggage_count} bag(s)` : null,
                              ].filter(Boolean).join(' • ')}
                              className="text-left text-[10px] px-1.5 py-0.5 rounded truncate hover:brightness-125 transition-all"
                              style={{ background: `${STATUS_DOT[l.status || '']}20`, color: STATUS_DOT[l.status || ''] || 'var(--text-dim)', borderLeft: `2px solid ${STATUS_DOT[l.status || '']}` }}
                            >
                              {isReturnLeg ? '↩ ' : ''}{l.time || l.return_time} {l.customer_name}
                            </button>
                          )
                        })}
                        {dayLeads.length > 3 && (
                          <button
                            onClick={() => setViewingDay(dateStr)}
                            className="text-left text-[9px] text-[var(--text-faint)] px-1.5 hover:text-[var(--gold-light)] transition-colors"
                          >+{dayLeads.length - 3} more</button>
                        )}
                      </div>
                    </div>
                  )
                })}
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
                  <section key={dayGroup} className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-5 text-[var(--text-muted)]">{dayGroup}</h3>
                    <div className="flex flex-col gap-3">
                      {groupLeads.map(lead => {
                        const driver = drivers.find(d => d.id === lead.assigned_driver_id)
                        return (
                          <div key={lead.id} className="p-4 rounded-lg flex items-center justify-between" style={{ background: 'var(--surface)' }}>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 bg-[var(--bg-deep)] rounded flex flex-col items-center justify-center border border-[var(--border-soft)]">
                                <span className="text-xs text-[var(--text-muted)] uppercase">{formatDateUS(lead.date || '')}</span>
                                <span className="text-sm font-bold text-white">{lead.time}</span>
                              </div>
                              <div>
                                <p className="text-white font-bold">{lead.pickup} <span className="text-[var(--text-faint)] font-normal mx-1">→</span> {lead.destination}</p>
                                <p className="text-xs text-[var(--text-muted)] mt-1">{lead.customer_name} • {VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              {driver ? (
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--gold)] bg-[#B8960C]/10 text-[var(--gold-light)] text-xs font-bold">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                  {driver.name}
                                </div>
                              ) : (
                                <span className="inline-block px-3 py-1 rounded-full border border-[var(--border-soft)] bg-[#222] text-[var(--text-muted)] text-xs font-bold">
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
                 <div className="p-10 text-center rounded-2xl" style={{ border: '1px dashed var(--border-soft)' }}>
                 <p className="text-[var(--text-muted)]">No active trips to dispatch.</p>
               </div>
              )}
            </div>
          </div>
        )}

        {/* ------- ASSIGN DRIVERS TAB ------- */}
        {(activeTab as string) === 'assign' && (
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif' }}>Available to Talk?</h1>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Assign drivers to promotional and pending trips</p>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {leads.filter(l => l.status === 'pending_assignment').length === 0 ? (
                <div className="p-10 text-center rounded-2xl" style={{ border: '1px dashed var(--border-soft)' }}>
                  <p className="text-[var(--text-muted)]">No pending assignments. All trips are dispatched.</p>
                </div>
              ) : (
                leads.filter(l => l.status === 'pending_assignment').map(lead => {
                  const message = `Hello, are you available for a trip?\n\n*Route:* ${lead.pickup} to ${lead.destination}\n*Date:* ${lead.date}\n*Time:* ${lead.time}\n*Passengers:* ${lead.passengers}\n*Vehicle:* ${VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type}`;
                  const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;

                  return (
                    <div key={lead.id} className="p-6 rounded-xl flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold bg-[#B8960C]/20 text-[var(--gold-light)] px-2 py-1 rounded border border-[#B8960C]/30 uppercase tracking-wider">NEEDS DRIVER</span>
                          <p className="text-white font-bold text-lg">{lead.customer_name}</p>
                        </div>
                        <p className="text-[var(--text-subtle)] text-sm"><span className="font-semibold text-[#ccc]">{formatDateUS(lead.date || '')} at {lead.time}</span></p>
                        <p className="text-[var(--text-muted)] text-sm">{lead.pickup} <span className="mx-1">→</span> {lead.destination}</p>
                        <p className="text-[var(--text-muted)] text-sm">{lead.passengers} passengers • {VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type}</p>
                      </div>

                      <div className="flex flex-col gap-3 w-full sm:w-auto">
                        <a href={waLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all bg-[#128C7E] hover:bg-[#075E54] text-white">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                          Ask Drivers
                        </a>
                        
                        <div className="flex items-center gap-2">
                          <select 
                            className="bg-[var(--bg-deep)] border border-[var(--border-soft)] text-white text-sm rounded-lg px-3 py-2.5 flex-1 outline-none focus:border-[var(--gold)]"
                            onChange={async (e) => {
                              const driverId = e.target.value;
                              if (driverId) {
                                if (await confirmDialog('Are you sure you want to assign this driver? The trip will be moved to Confirmed Trips.')) {
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
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Generate branded QR codes for hotel partners</p>
            </div>

            <section className="rounded-xl p-6" style={{ background: 'var(--bg)', border: '1px solid var(--surface)' }}>
              <div className="flex items-center gap-4 flex-wrap">
                <input
                  type="text"
                  placeholder="hotel-slug (e.g. partner-slug)"
                  value={qrSlug}
                  onChange={(e) => setQrSlug(e.target.value)}
                  className="flex-1 min-w-[220px] rounded-xl px-4 py-3.5 text-sm outline-none transition-colors focus:border-[var(--gold)]"
                  style={{ background: 'var(--bg-deep)', border: '1px solid var(--surface-alt)', color: 'var(--text)' }}
                />
                <button
                  onClick={generateQR}
                  className="px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110"
                  style={{ background: 'linear-gradient(135deg, var(--gold), var(--gold-light))', color: 'var(--bg-deep)' }}
                >
                  Generate QR
                </button>
              </div>
              {qrDataUrl && (
                <div className="mt-8 flex flex-col items-start gap-4">
                  <div className="bg-[var(--surface)] p-3 rounded-lg border border-[var(--border-soft)] w-full max-w-sm">
                    <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-bold">QR Destination URL:</p>
                    <p className="text-sm font-mono text-[var(--gold)] break-all">{qrUrl}</p>
                  </div>
                  <div className="p-4 bg-white rounded-xl">
                    <Image src={qrDataUrl} alt="QR Code" width={192} height={192} className="w-48 h-48" />
                  </div>
                  <a
                    href={qrDataUrl}
                    download={`expresslift-qr-${qrSlug}.png`}
                    className="text-xs uppercase tracking-widest font-bold transition-colors hover:text-[var(--gold-light)]"
                    style={{ color: 'var(--gold)' }}
                  >
                    ↓ Download PNG
                  </a>
                </div>
              )}
            </section>
          </div>
        )}

      {/* DAY RESERVATIONS MODAL — opened from the "+N more" link on a crowded calendar day */}
            {viewingDay && (() => {
              const dayLeads = leads.filter(l =>
                (l.date === viewingDay || (l.trip_type === 'round-trip' && l.return_date === viewingDay)) &&
                (l.status === 'paid' || l.status === 'deposit_paid' || l.status === 'hotel_b2b')
              )
              const STATUS_DOT: Record<string, string> = { paid: '#4ade80', deposit_paid: '#FBBF24', hotel_b2b: '#2dd4bf' }
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setViewingDay(null)}>
                  <div className="bg-[var(--bg)] border border-[var(--border-soft)] rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-5 border-b border-[#222] bg-[var(--surface-raised)]">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[var(--gold)] font-bold mb-1">Reservations</p>
                        <h2 className="text-lg font-bold text-white">{formatDateUS(viewingDay)}</h2>
                      </div>
                      <button onClick={() => setViewingDay(null)} className="text-sm text-[var(--text-subtle)] hover:text-red-400 px-3 py-1 rounded-lg border border-[var(--border-soft)] hover:border-red-400 transition-all">x Close</button>
                    </div>
                    <div className="flex flex-col gap-2 p-4 overflow-y-auto">
                      {dayLeads.map(l => {
                        const isReturnLeg = l.date !== viewingDay
                        return (
                          <button
                            key={l.id + (isReturnLeg ? '-return' : '')}
                            onClick={() => { setViewingLead(l); setViewingDay(null); }}
                            className="text-left px-3 py-2.5 rounded-lg hover:brightness-125 transition-all"
                            style={{ background: `${STATUS_DOT[l.status || '']}15`, borderLeft: `2px solid ${STATUS_DOT[l.status || '']}` }}
                          >
                            <p className="text-sm font-bold text-white truncate">
                              {isReturnLeg ? '↩ ' : ''}{l.time || l.return_time} — {l.customer_name}
                            </p>
                            <p className="text-xs text-[var(--text-muted)] truncate">{l.pickup} → {l.destination}</p>
                            {(l.airline || l.flight_number || (l.car_seats_requested ?? 0) > 0 || (l.luggage_count ?? 0) > 0) && (
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-[var(--gold)]">
                                {(l.airline || l.flight_number) && (
                                  <span className="flex items-center gap-1"><Plane size={13} /> {[l.airline, l.flight_number].filter(Boolean).join(' ')}</span>
                                )}
                                {(l.car_seats_requested ?? 0) > 0 && <span className="flex items-center gap-1"><Armchair size={13} /> {l.car_seats_requested} car seat{l.car_seats_requested === 1 ? '' : 's'}</span>}
                                {(l.luggage_count ?? 0) > 0 && <span className="flex items-center gap-1"><Luggage size={13} /> {l.luggage_count} bag{l.luggage_count === 1 ? '' : 's'}</span>}
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )
            })()}

      {/* FULL DETAILS MODAL */}
            {viewingLead && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setViewingLead(null)}>
                <div className="bg-[var(--bg)] border border-[var(--border-soft)] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-[#222] bg-[var(--surface-raised)]">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-[var(--gold)] font-bold mb-1">Reservation Details</p>
                      <h2 className="text-xl font-bold text-white">{viewingLead.customer_name || 'Anonymous'}</h2>
                    </div>
                    <button onClick={() => { setViewingLead(null); setGeneratedLink(null); }} className="p-2 text-[var(--text-muted)] hover:text-white bg-[#222] rounded-full transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
                    
                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-[var(--surface)] border border-[var(--border-soft)] rounded-xl p-4 text-center">
                        <p className="text-xs uppercase text-[var(--text-muted)] font-bold tracking-wider mb-1">Total</p>
                        <p className="text-2xl font-bold text-white">${viewingLead.amount_usd || 0}</p>
                      </div>
                      <div className="bg-green-900/10 border border-green-900/30 rounded-xl p-4 text-center">
                        <p className="text-xs uppercase text-green-500/70 font-bold tracking-wider mb-1">Paid</p>
                        <p className="text-2xl font-bold text-green-400">${viewingLead.amount_paid || 0}</p>
                      </div>
                      <div className="bg-red-900/10 border border-red-900/30 rounded-xl p-4 text-center">
                        <p className="text-xs uppercase text-red-500/70 font-bold tracking-wider mb-1">Owes</p>
                        <p className="text-2xl font-bold text-red-400">${viewingLead.amount_remaining || 0}</p>
                      </div>
                    </div>

                    {/* Meet & Greet Info */}
                    {viewingLead.meeting_type === 'meet_greet' && (
                      <div className="flex items-center justify-between bg-[#B8960C10] border border-[#B8960C30] rounded-xl px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-[var(--gold-light)]" />
                          <span className="text-sm font-bold text-[var(--gold-light)]">VIP Meet &amp; Greet</span>
                        </div>
                        <span className="text-sm font-bold text-[#4ade80]">+${viewingLead.meet_greet_fee || 25} included</span>
                      </div>
                    )}

                    {/* Status & Trip Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Status</p>
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border inline-block" style={{ 
                            backgroundColor: viewingLead.status === 'hotel_b2b' ? '#134e4a80' : viewingLead.status === 'invoice_sent' ? '#1e3a8a30' : viewingLead.status === 'lost' ? '#33161630' : viewingLead.status === 'pending_payment' ? '#7f1d1d30' : viewingLead.status === 'deposit_paid' ? '#B8960C30' : viewingLead.status === 'paid' ? '#065f4630' : viewingLead.status === 'quote_requested' ? '#EF9F2730' : 'var(--surface)',
                            color: viewingLead.status === 'hotel_b2b' ? '#2dd4bf' : viewingLead.status === 'invoice_sent' ? '#60a5fa' : viewingLead.status === 'lost' ? '#F44336' : viewingLead.status === 'pending_payment' ? '#f87171' : viewingLead.status === 'deposit_paid' ? '#FBBF24' : viewingLead.status === 'paid' ? '#34d399' : viewingLead.status === 'quote_requested' ? 'var(--gold-accent)' : 'var(--text)',
                            borderColor: viewingLead.status === 'hotel_b2b' ? '#2dd4bf80' : viewingLead.status === 'invoice_sent' ? '#1e3a8a80' : viewingLead.status === 'lost' ? '#33161680' : viewingLead.status === 'pending_payment' ? '#7f1d1d80' : viewingLead.status === 'deposit_paid' ? '#B8960C80' : viewingLead.status === 'paid' ? '#065f4680' : viewingLead.status === 'quote_requested' ? '#EF9F2780' : 'var(--border-soft)'
                          }}>
                            {viewingLead.status === 'hotel_b2b' ? 'Hotel B2B' :
                             viewingLead.status === 'quote_requested' ? 'Quote Requested' :
                             viewingLead.status === 'pending_payment' ? 'Abandoned' :
                             viewingLead.status === 'invoice_sent' ? 'Invoice Sent' :
                             viewingLead.status === 'deposit_paid' ? 'Deposit Paid' :
                             viewingLead.status === 'paid' ? 'Paid' :
                             viewingLead.status === 'lost' ? 'Lost / Cancelled' :
                             'Manual (New)'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">
                            {viewingLead.trip_type === 'round-trip' ? 'Pick up Date & Time' : 'Date & Time'}
                          </p>
                          <p className="text-sm text-white font-medium">{formatDateUS(viewingLead.date)} at {viewingLead.time || 'TBD'}</p>
                        </div>
                        {viewingLead.trip_type === 'round-trip' && viewingLead.return_date && viewingLead.return_time && (
                          <div>
                            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Drop off Date & Time</p>
                            <p className="text-sm text-white font-medium">{formatDateUS(viewingLead.return_date)} at {viewingLead.return_time}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Route</p>
                          <p className="text-sm text-white"><span className="text-[var(--gold)]">•</span> {viewingLead.pickup}</p>
                          <p className="text-sm text-white"><span className="text-[var(--gold-light)]">↓</span> {viewingLead.destination}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-4">
                        <div>
                          <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Vehicle</p>
                          <p className="text-sm text-white font-medium">{VEHICLE_LABELS[viewingLead.vehicle_type] || viewingLead.vehicle_type}</p>
                        </div>
                        <div>
                          <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Passengers</p>
                          <p className="text-sm text-white">{viewingLead.passengers || 1} PAX</p>
                        </div>
                        {(viewingLead.luggage_count ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Luggage</p>
                            <p className="text-sm text-white">{viewingLead.luggage_count}</p>
                          </div>
                        )}
                        {(viewingLead.car_seats_requested ?? 0) > 0 && (
                          <div>
                            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Car Seats</p>
                            <p className="text-sm text-white">{viewingLead.car_seats_requested}</p>
                          </div>
                        )}
                        {viewingLead.airline && viewingLead.flight_number && (
                          <div>
                            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Flight</p>
                            <p className="text-sm text-white">{viewingLead.airline} — {viewingLead.flight_number}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Contact</p>
                          <p className="text-sm text-white">{viewingLead.customer_email || 'No email'}</p>
                          <p className="text-sm text-[var(--text-muted)]">{viewingLead.customer_phone || 'No phone'}</p>
                        </div>
                        {viewingLead.trip_reminder_sent_at && (
                          <div>
                            <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-1">Pickup Reminder Email</p>
                            {(() => {
                              const s = viewingLead.trip_reminder_status
                              const label = s === 'delivered' ? 'Delivered'
                                : s === 'opened' ? 'Delivered & Opened'
                                : s === 'bounced' ? 'Bounced — bad email address'
                                : s === 'failed' ? 'Failed to send'
                                : s === 'complained' ? 'Marked as spam'
                                : s === 'delivery_delayed' ? 'Delivery delayed'
                                : 'Sent — awaiting delivery confirmation'
                              const color = s === 'delivered' || s === 'opened' ? '#4ade80'
                                : s === 'bounced' || s === 'failed' || s === 'complained' ? '#f87171'
                                : s === 'delivery_delayed' ? '#FBBF24'
                                : 'var(--text-muted)'
                              return (
                                <p className="text-sm font-medium" style={{ color }}>
                                  ● {label}
                                </p>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes — free text the guest typed in (special requests), not admin-only */}
                    {viewingLead.notes && (
                      <div>
                        <p className="text-xs text-[var(--text-faint)] uppercase tracking-wider font-bold mb-2">Special Requests / Notes</p>
                        <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--border-soft)] text-sm text-[#ccc] whitespace-pre-wrap">
                          {viewingLead.notes}
                        </div>
                      </div>
                    )}


                    {/* Generated Link Display */}
                    {generatedLink && (
                      <div className="bg-green-900/20 border border-green-500/50 p-4 rounded-xl flex flex-col gap-3 mt-2 animate-in fade-in slide-in-from-bottom-4">
                        <p className="text-xs uppercase text-green-400 font-bold tracking-widest flex items-center gap-1.5"><CheckCircle2 size={13} /> Payment Link Generated</p>
                        <div className="flex items-center gap-2">
                          <input type="text" readOnly value={generatedLink} className="bg-black text-green-400 p-3 rounded-lg w-full text-xs outline-none border border-green-900/50 font-mono" />
                          <button onClick={() => { navigator.clipboard.writeText(generatedLink); toast('Copied!', 'success'); }} className="text-xs font-bold uppercase tracking-widest bg-green-600 hover:bg-green-500 text-white px-4 py-3 rounded-lg transition-colors">Copy</button>
                          <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="text-xs font-bold uppercase tracking-widest bg-[#222] hover:bg-[var(--border-soft)] border border-[#444] text-white px-4 py-3 rounded-lg whitespace-nowrap transition-colors">Open</a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="border-t border-[#222] bg-[var(--surface-raised)] p-6 flex flex-wrap gap-3 justify-end items-center">
                    <button onClick={async () => { const deleted = await deleteLead(viewingLead.id); if (deleted) setViewingLead(null); }} className="px-4 py-2 mr-auto rounded-lg text-sm font-bold border border-red-900/50 bg-red-900/10 text-red-500 hover:bg-red-900/20 transition-colors flex items-center gap-2">
                      <Trash2 size={14} /> Delete
                    </button>
                    <button onClick={() => { setEditingLead(viewingLead); setViewingLead(null); }} className="px-4 py-2 rounded-lg text-sm font-bold border border-[var(--border-soft)] text-white hover:bg-[#222] transition-colors">
                      Edit
                    </button>
                    {viewingLead.status !== 'paid' && viewingLead.status !== 'deposit_paid' && (
                      <button onClick={() => sendInvoice(viewingLead.id)} disabled={sendingInvoice === viewingLead.id} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/50 hover:bg-[#10B981]/20 transition-colors flex items-center gap-2 disabled:opacity-50">
                        <Mail size={14} /> {sendingInvoice === viewingLead.id ? 'Sending...' : 'Send Invoice (Stripe)'}
                      </button>
                    )}
                    {viewingLead.status !== 'paid' && viewingLead.status !== 'deposit_paid' && qbConnected && (
                      <button onClick={() => sendQuickBooksInvoice(viewingLead.id)} disabled={sendingQuickBooksInvoice === viewingLead.id} className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/50 hover:bg-blue-500/20 transition-colors flex items-center gap-2 disabled:opacity-50">
                        <Receipt size={14} /> {sendingQuickBooksInvoice === viewingLead.id ? 'Sending...' : 'Send via QuickBooks'}
                      </button>
                    )}
                    {viewingLead.status !== 'paid' && viewingLead.status !== 'deposit_paid' && (
                      <button onClick={() => generateStripeLink(viewingLead.id)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#B8960C]/10 text-[var(--gold-light)] border border-[var(--gold)] hover:bg-[#B8960C]/20 transition-colors flex items-center gap-2">
                        <CreditCard size={14} /> Generate Payment Link
                      </button>
                    )}
                    {viewingLead.status === 'deposit_paid' && (
                      <button onClick={async () => {
                        if (await confirmDialog('Mark remaining balance as collected manually?')) { updateLead(viewingLead.id, { status: 'paid', amount_paid: viewingLead.amount_usd, amount_remaining: 0 } as any); setViewingLead(null); }
                      }} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#FBBF24]/10 text-[#FBBF24] border border-[#FBBF24]/50 hover:bg-[#FBBF24]/20 transition-colors flex items-center gap-2">
                        <CheckCircle2 size={14} /> Mark Paid (Manual)
                      </button>
                    )}
                    {viewingLead.status === 'deposit_paid' && (
                      <button onClick={() => generateRemainingStripeLink(viewingLead.id)} className="px-4 py-2 rounded-lg text-sm font-bold bg-[#B8960C]/10 text-[var(--gold-light)] border border-[var(--gold)] hover:bg-[#B8960C]/20 transition-colors flex items-center gap-2">
                        <CreditCard size={14} /> Generate Balance Link
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

      </main>
    </div>
  )
}
