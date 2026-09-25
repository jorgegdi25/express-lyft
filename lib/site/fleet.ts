// Public-facing fleet catalog. Vehicle types, passenger capacities and bag
// limits mirror what the booking engine already enforces
// (components/VehicleDisplay.tsx and MainMapBookingForm's luggage check);
// "from" prices are NOT stored here — they come from the `pricing` table.

export type FleetType = 'sedan_suv' | 'suburban' | 'sprinter' | 'minibus' | 'coachbus'

export interface FleetVehicle {
  type: FleetType
  slug: string
  name: string
  category: string
  passengers: number
  luggage: number
  bestFor: string
  description: string
  quoteOnly: boolean
  image: string
  gallery: string[]
}

export const FLEET: FleetVehicle[] = [
  {
    type: 'sedan_suv',
    slug: 'sedan-suv',
    name: 'Sedan & SUV',
    category: 'Premium Ride',
    passengers: 4,
    luggage: 4,
    bestFor: 'Couples, solo travelers and business trips',
    description: 'A comfortable private ride for airport runs, hotel transfers and meetings around town.',
    quoteOnly: false,
    image: '/gallery/sedan1.webp',
    gallery: ['/gallery/sedan1.webp', '/gallery/sedan2.webp', '/gallery/sedan3.webp', '/gallery/interna.webp'],
  },
  {
    type: 'suburban',
    slug: 'suburban',
    name: 'Chevrolet Suburban',
    category: 'Premium SUV',
    passengers: 6,
    luggage: 6,
    bestFor: 'Families and small groups with luggage',
    description: 'Full-size SUV with room for six and their bags — the go-to for airport and cruise transfers.',
    quoteOnly: false,
    image: '/gallery/suburban.webp',
    gallery: ['/gallery/suburban.webp', '/gallery/suburban2.webp'],
  },
  {
    type: 'sprinter',
    slug: 'sprinter',
    name: 'Mercedes-Benz Sprinter',
    category: 'Premium Sprinter',
    passengers: 14,
    luggage: 14,
    bestFor: 'Teams, wedding parties and group arrivals',
    description: 'Keep the group together in one vehicle, with space for everyone’s luggage.',
    quoteOnly: false,
    image: '/gallery/sprinter1.webp',
    gallery: ['/gallery/sprinter1.webp', '/gallery/sprinter2.webp'],
  },
  {
    type: 'minibus',
    slug: 'mini-bus',
    name: 'Mini Bus',
    category: 'Group Transfers',
    // [TODO: Confirm minibus capacity — code says 31, portfolio says 20–32]
    passengers: 31,
    luggage: 30,
    bestFor: 'Events, conferences and crew movements',
    description: 'Mid-size group transportation for events, hotel shuttles and corporate programs.',
    quoteOnly: true,
    image: '/gallery/minibus.webp',
    gallery: ['/gallery/minibus.webp', '/gallery/mini bus.webp'],
  },
  {
    type: 'coachbus',
    slug: 'coach-bus',
    name: 'Coach Bus',
    category: 'Group Transfers',
    // [TODO: Confirm coach capacity range — portfolio says 40–55]
    passengers: 55,
    luggage: 60,
    bestFor: 'Large groups, cruise transfers and tours',
    description: 'Full-size motorcoach for large groups moving between airports, hotels and cruise terminals.',
    quoteOnly: true,
    image: '/gallery/coach bus1.webp',
    gallery: ['/gallery/coach bus1.webp', '/gallery/coach bus2.webp', '/site/fleet-coaches-real.webp'],
  },
]

export function fleetByType(type: FleetType) {
  return FLEET.find((v) => v.type === type)!
}
