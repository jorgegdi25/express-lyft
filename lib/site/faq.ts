import { CONTACT } from './contact'

// FAQ content from the current explyft.com, grouped by category.
// The deposit answer was updated: deposits were removed on 2026-08-08,
// online bookings are paid in full.

export type FaqCategory = 'Booking' | 'Airport Pickup' | 'Changes & Cancellations' | 'Vehicles & Luggage' | 'Children' | 'Payment'

export interface FaqItem {
  id: string
  category: FaqCategory
  q: string
  a: string
  featured?: boolean
}

export const FAQ_CATEGORIES: FaqCategory[] = ['Booking', 'Airport Pickup', 'Changes & Cancellations', 'Vehicles & Luggage', 'Children', 'Payment']

export const FAQ: FaqItem[] = [
  {
    id: 'advance', category: 'Booking', featured: true,
    q: 'How far in advance should I book?',
    a: 'As early as possible, especially for airport transfers, cruise transfers, group transportation and special events. Same-day availability may be limited.',
  },
  {
    id: 'phone-booking', category: 'Booking', featured: true,
    q: 'Can I book over the phone or WhatsApp?',
    a: `Yes. Call us at ${CONTACT.phoneDisplay} or message us on WhatsApp at ${CONTACT.whatsappDisplay} to check availability, ask questions or book your ride.`,
  },
  {
    id: 'confirmation', category: 'Booking',
    q: 'What confirmation will I receive?',
    a: 'Once your reservation is confirmed, we email your trip details: pickup date and time, pickup location, destination, vehicle and contact information.',
  },
  {
    id: 'reservation-number', category: 'Booking',
    q: 'Where is my reservation number?',
    a: 'If your booking includes a reservation number, it appears on the confirmation we send you. Keep it handy if you contact us about your trip.',
  },
  {
    id: 'group-booking', category: 'Booking',
    q: 'How do I book group transportation?',
    a: 'Send us your trip date, pickup time, pickup location, destination, passenger count, luggage count and any special requirements. We will review availability and send a quote.',
  },
  {
    id: 'flight-delay', category: 'Airport Pickup', featured: true,
    q: 'What if my flight is delayed? Is there a wait fee?',
    a: 'Airport pickups include a complimentary 30-minute grace period. If the delay goes beyond 30 minutes from the scheduled pickup time, a wait time fee of $20 per hour applies.',
  },
  {
    id: 'meet-driver', category: 'Airport Pickup', featured: true,
    q: 'Where do I meet my driver at the airport?',
    a: 'Standard pickup is curbside — your driver meets you outside the arrivals terminal. VIP Meet & Greet, where the driver waits inside at baggage claim with a sign, is available for an additional $25.',
  },
  {
    id: 'change-booking', category: 'Changes & Cancellations', featured: true,
    q: 'Can I change my booking?',
    a: 'Yes. Contact us as soon as possible to change your pickup time, location, destination, passenger count or vehicle. Changes may affect the final price and availability.',
  },
  {
    id: 'cancel', category: 'Changes & Cancellations',
    // [TODO: Replace with the confirmed cancellation policy]
    q: 'Can I cancel my booking?',
    a: 'Cancellation terms depend on the type of service and how close to the pickup you cancel. Contact us as soon as possible so we can review your reservation and explain any applicable charges.',
  },
  {
    id: 'luggage', category: 'Vehicles & Luggage',
    q: 'How much luggage can I bring?',
    a: 'Sedans & SUVs fit up to 4 standard bags and the Suburban up to 6. For more luggage, choose a Sprinter, Mini Bus or Coach Bus.',
  },
  {
    id: 'car-seats', category: 'Children', featured: true,
    q: 'Do you provide car seats for children?',
    a: 'Yes, up to 4 car seats free of charge. Please request them in the booking form so we can make sure they are available.',
  },
  {
    id: 'payment', category: 'Payment',
    q: 'When and how do I pay?',
    a: 'Online bookings are paid in full at checkout by credit or debit card, and you see the total before you pay. Group bookings (Mini Bus and Coach Bus) are confirmed with a quote first.',
  },
]

export function faqByIds(ids: string[]) {
  return ids.map((id) => FAQ.find((f) => f.id === id)).filter(Boolean) as FaqItem[]
}
