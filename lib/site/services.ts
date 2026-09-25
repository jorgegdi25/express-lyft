import type { FleetType } from './fleet'

// Service catalog for the corporate site. Drives the home services grid,
// the header menu and each service landing page (/airport-transfers, …).
// Copy is based on the current explyft.com text and the Express Lyft
// portfolio PDF — nothing here should state a fact that isn't in those.

export interface ServiceFaq { q: string; a: string }

export interface Service {
  slug: string
  name: string
  short: string
  image: string
  imageAlt: string
  metaTitle: string
  metaDescription: string
  heroTitle: string
  heroCopy: string
  useCases: { title: string; text: string }[]
  howWeHandle: { title: string; text: string }[]
  vehicles: FleetType[]
  places: string[]
  faqIds: string[]
}

export const SERVICES: Service[] = [
  {
    slug: 'airport-transfers',
    name: 'Airport Transfers',
    short: 'MIA and FLL pickups and drop-offs — curbside, or Meet & Greet inside baggage claim.',
    image: '/gallery/aeropuerto.webp',
    imageAlt: 'Express Lyft chauffeur waiting with a welcome sign at the airport curb',
    metaTitle: 'Airport Transfers in Miami & Fort Lauderdale | Express Lyft',
    metaDescription: 'Private airport transfers to and from Miami International (MIA) and Fort Lauderdale (FLL). Professional drivers, Meet & Greet option and online booking.',
    heroTitle: 'Airport transfers, from the gate to your door.',
    heroCopy: 'Private rides to and from Miami International and Fort Lauderdale airports — with a driver who knows the terminals.',
    useCases: [
      { title: 'Arriving in Miami', text: 'Land, collect your bags and head straight to your hotel, home or cruise terminal.' },
      { title: 'Catching a flight', text: 'Scheduled pickups from hotels, homes and offices so you reach the terminal on time.' },
      { title: 'Traveling with family', text: 'Room for luggage and complimentary child seats when requested in advance.' },
    ],
    howWeHandle: [
      { title: 'Flight details on every booking', text: 'We ask for your airline and flight number on airport pickups so the ride is planned around your arrival.' },
      { title: '30 minutes of free waiting', text: 'Airport pickups include a 30-minute grace period. After that, wait time is $20 per hour.' },
      { title: 'Curbside or Meet & Greet', text: 'Standard pickup is curbside at arrivals. For $25 your driver meets you inside at baggage claim with a sign.' },
    ],
    vehicles: ['sedan_suv', 'suburban', 'sprinter', 'minibus', 'coachbus'],
    places: ['Miami International Airport (MIA)', 'Fort Lauderdale–Hollywood International (FLL)'],
    faqIds: ['flight-delay', 'meet-driver', 'luggage', 'car-seats'],
  },
  {
    slug: 'hotel-transfers',
    name: 'Hotel Transfers',
    short: 'Hotel to airport, beach, downtown or dinner — booked directly or through your front desk.',
    image: '/gallery/suburban.webp',
    imageAlt: 'Chevrolet Suburban with a driver waiting at a Miami hotel entrance',
    metaTitle: 'Hotel Transfers in Miami & South Florida | Express Lyft',
    metaDescription: 'Private hotel transfers across Miami and South Florida: airport, cruise port, beaches, downtown and events. Trusted by hotel partners.',
    heroTitle: 'Hotel transfers that feel like part of your stay.',
    heroCopy: 'We work with hotels across South Florida to get guests where they need to go — comfortably and on time.',
    useCases: [
      { title: 'Arrival and departure', text: 'Airport to hotel and back again, planned around your flight.' },
      { title: 'Beach and downtown', text: 'Miami Beach, Brickell, Downtown Miami, restaurants and events.' },
      { title: 'Front-desk bookings', text: 'Partner hotels can book for their guests directly with our team.' },
    ],
    howWeHandle: [
      { title: 'Hotel partner program', text: 'Partner hotels have their own booking page for guests, with rates set for that property.' },
      { title: 'A real person on the line', text: 'Call or WhatsApp us when plans change — we adjust pickup times and locations.' },
      { title: 'Clear prices', text: 'See the vehicle price before you book. Final price depends on route, vehicle and time.' },
    ],
    vehicles: ['sedan_suv', 'suburban', 'sprinter'],
    places: ['Miami Beach', 'Downtown Miami & Brickell', 'Fort Lauderdale', 'PortMiami'],
    faqIds: ['advance', 'phone-booking', 'change-booking', 'confirmation'],
  },
  {
    slug: 'cruise-port-transfers',
    name: 'Cruise Port Transfers',
    short: 'Hotel or airport to the cruise terminal, with space for everyone’s luggage.',
    image: '/gallery/coach bus2.webp',
    imageAlt: 'Coach bus ready for a group cruise port transfer',
    metaTitle: 'Cruise Port Transfers to PortMiami | Express Lyft',
    metaDescription: 'Private and group transfers between Miami airports, hotels and PortMiami cruise terminals. Sedans, SUVs, Sprinters and coach buses.',
    heroTitle: 'From the airport or hotel to your cruise terminal.',
    heroCopy: 'Start and end your cruise without the taxi line — private rides and group transfers to the port.',
    useCases: [
      { title: 'Embarkation day', text: 'Hotel or airport to the terminal, timed for your boarding window.' },
      { title: 'Disembarkation', text: 'Straight from the port to the airport or your hotel.' },
      { title: 'Groups and families', text: 'Sprinters, mini buses and coaches keep the whole party together.' },
    ],
    howWeHandle: [
      { title: 'Luggage-ready vehicles', text: 'Each vehicle class has a set bag capacity, so you know it will fit before you book.' },
      { title: 'Group quotes', text: 'For mini buses and coaches, our team confirms availability and sends a quote.' },
      { title: 'Cruise-line experience', text: 'Our team has worked with cruise lines and travel partners for years.' },
    ],
    vehicles: ['suburban', 'sprinter', 'minibus', 'coachbus'],
    // [TODO: Confirm whether Port Everglades is served]
    places: ['PortMiami cruise terminals', 'Miami International Airport (MIA)', 'Fort Lauderdale (FLL)'],
    faqIds: ['luggage', 'group-booking', 'advance', 'payment'],
  },
  {
    slug: 'corporate-transportation',
    name: 'Corporate Transportation',
    short: 'Business travel, meetings, roadshows and airline crew support.',
    image: '/gallery/interna.webp',
    imageAlt: 'Vehicle interior overlooking the Miami skyline at sunset',
    metaTitle: 'Corporate Transportation in Miami | Express Lyft',
    metaDescription: 'Corporate ground transportation in South Florida: executive travel, meetings, events, airline crew and disruption support. Group and corporate rates available.',
    heroTitle: 'Corporate transportation that runs on schedule.',
    heroCopy: 'Ground transportation for business travelers, teams, events and airline operations across South Florida.',
    useCases: [
      { title: 'Executive travel', text: 'Airport, hotel and meeting transfers for visiting teams and executives.' },
      { title: 'Events and conferences', text: 'Coordinated vehicles for attendees, speakers and staff.' },
      { title: 'Airline and crew support', text: 'Crew transportation and support during irregular operations and flight disruptions.' },
    ],
    howWeHandle: [
      { title: 'One point of contact', text: 'A dedicated team coordinates vehicles, drivers and schedules.' },
      { title: 'Corporate and group rates', text: 'Eligible group and corporate programs may qualify for reduced rates. T&C apply.' },
      { title: 'Responsive when plans change', text: 'Ready for time-sensitive travel needs, including last-minute changes.' },
    ],
    vehicles: ['sedan_suv', 'suburban', 'sprinter', 'minibus', 'coachbus'],
    places: ['Miami', 'Fort Lauderdale', 'South Florida'],
    faqIds: ['phone-booking', 'confirmation', 'reservation-number', 'payment'],
  },
  {
    slug: 'group-transportation',
    name: 'Groups & Events',
    short: 'Sprinters, mini buses and coaches for weddings, tours, conferences and teams.',
    image: '/gallery/sprinter2.webp',
    imageAlt: 'Mercedes-Benz Sprinter prepared for group transportation',
    metaTitle: 'Group Transportation & Charter Buses in Miami | Express Lyft',
    metaDescription: 'Group transportation in Miami and South Florida: Mercedes Sprinters, mini buses and coach buses for weddings, events, tours and cruise groups.',
    heroTitle: 'Move the whole group, together.',
    heroCopy: 'From a 14-passenger Sprinter to a full-size coach — group transportation planned around your event.',
    useCases: [
      { title: 'Weddings', text: 'Transportation for the wedding party and guests between hotels and venues.' },
      { title: 'Tours and outings', text: 'Day trips and local experiences around Miami and South Florida.' },
      { title: 'Conferences and teams', text: 'Shuttles between hotels, venues and airports.' },
    ],
    howWeHandle: [
      { title: 'Tell us the plan', text: 'Send your date, times, pickup, destination, group size and luggage.' },
      { title: 'We match the vehicles', text: 'We recommend the right mix of vehicles and confirm availability.' },
      { title: 'Clear quote', text: 'You receive a quote before anything is booked.' },
    ],
    vehicles: ['sprinter', 'minibus', 'coachbus'],
    places: ['Miami', 'Miami Beach', 'Fort Lauderdale', 'PortMiami'],
    faqIds: ['group-booking', 'advance', 'change-booking', 'cancel'],
  },
]

export function serviceBySlug(slug: string) {
  return SERVICES.find((s) => s.slug === slug)
}
