import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.split('Bearer ')[1]
  return token === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin.from('pricing').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { vehicle_type, price_usd, price_per_mile } = await req.json()

  if (!vehicle_type || price_usd === undefined) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const updateData: any = { price_usd, updated_at: new Date().toISOString() }
  if (price_per_mile !== undefined) {
    updateData.price_per_mile = price_per_mile
  }

  const { error } = await supabaseAdmin
    .from('pricing')
    .update(updateData)
    .eq('vehicle_type', vehicle_type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    revalidatePath('/hotel/[slug]', 'page')
    revalidatePath('/', 'layout')
    revalidatePath('/')
  } catch (e) {
    console.error('Error revalidating path:', e)
  }

  return NextResponse.json({ success: true })
}
