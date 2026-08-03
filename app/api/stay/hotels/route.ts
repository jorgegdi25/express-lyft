import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('stay_hotels')
    .select('id, name, photo_url, price, rooms_available, sort_order')
    .eq('active', true)
    .gt('rooms_available', 0)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ hotels: data || [] })
}
