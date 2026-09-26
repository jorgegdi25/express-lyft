// Single source for the public contact details used across the corporate
// site (header, footer, CTAs, schema). The legal/brand name is Express Lyft;
// explyft.com is only the domain.

export const BRAND = {
  name: 'Express Lyft',
  domain: 'explyft.com',
  url: 'https://www.explyft.com',
  disclaimer: 'Express Lyft (explyft.com) is an independent transportation service and is not affiliated with Lyft, Inc.',
}

// Launch switch for Express Lyft 2.0. While false, the new site lives at
// /home in production, explyft.com/ keeps the current page, and the new
// pages are kept out of search engines. At launch: SITE_V2_LIVE = true and
// SITE_HOME = '/', then point app/page.tsx at HomeV2 for every host.
export const SITE_V2_LIVE = false
export const SITE_HOME = SITE_V2_LIVE ? '/' : '/home'

export const CONTACT = {
  phoneDisplay: '+1 (888) 973-7896',
  phoneHref: 'tel:+18889737896',
  whatsappDisplay: '954-623-6207',
  whatsappHref: 'https://wa.me/19546236207',
  email: 'info@explyft.com',
  hours: 'Daily 8:00 AM – 10:00 PM',
  facebook: 'https://www.facebook.com/explyft',
  instagram: 'https://www.instagram.com/expresslyftofficial',
}

export const OFFICES = [
  {
    city: 'Miami',
    status: 'active' as const,
    street: '6303 Blue Lagoon Drive, Suite 416',
    locality: 'Miami',
    region: 'FL',
    postalCode: '33126',
  },
  {
    city: 'Orlando',
    // Operation is being set up — keep copy as "expanding", not fully launched.
    status: 'expanding' as const,
    street: '4700 Millenia Blvd., Suite 605',
    locality: 'Orlando',
    region: 'FL',
    postalCode: '32839',
  },
]

export function whatsappLink(message?: string) {
  return message ? `${CONTACT.whatsappHref}?text=${encodeURIComponent(message)}` : CONTACT.whatsappHref
}
