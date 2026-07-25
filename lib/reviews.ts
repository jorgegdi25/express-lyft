import { supabaseAdmin } from '@/lib/supabase'
import type { Testimonial } from '@/components/Testimonials'

interface ReviewRow {
  customer_name: string
  rating: number | null
  comment: string | null
  submitted_at: string | null
}

// Approved reviews without a comment are skipped here — these display
// components are built around a text blurb, so a star-only review has
// nothing to show. hotelSlug narrows to one hotel's page; omit it for a
// site-wide feed on the homepage.
export async function getApprovedReviews(hotelSlug?: string, limit = 12): Promise<ReviewRow[]> {
  let query = supabaseAdmin
    .from('reviews')
    .select('customer_name, rating, comment, submitted_at')
    .eq('status', 'approved')
    .not('comment', 'is', null)
    .neq('comment', '')
    .order('submitted_at', { ascending: false })
    .limit(limit)

  if (hotelSlug) query = query.eq('hotel_slug', hotelSlug)

  const { data } = await query
  return data || []
}

export function toTestimonials(rows: ReviewRow[]): Testimonial[] {
  return rows.map((r) => ({
    name: r.customer_name,
    role: 'Verified Passenger',
    rating: r.rating || 5,
    text: r.comment || '',
    date: r.submitted_at
      ? new Date(r.submitted_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '',
    avatarText: r.customer_name
      .split(' ')
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  }))
}

export function toMarqueeReviews(rows: ReviewRow[]) {
  return rows.map((r) => ({
    name: r.customer_name,
    text: r.comment || '',
    rating: r.rating || 5,
  }))
}
