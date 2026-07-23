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

  const { data, error } = await supabaseAdmin.from('pricing_settings').select('*').eq('id', 1).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { surcharge_type, surcharge_amount, surcharge_start_hour, surcharge_end_hour } = await req.json()

  if (surcharge_type !== 'fixed' && surcharge_type !== 'percentage') {
    return NextResponse.json({ error: 'surcharge_type must be "fixed" or "percentage"' }, { status: 400 })
  }
  if (
    surcharge_amount === undefined ||
    surcharge_start_hour === undefined ||
    surcharge_end_hour === undefined ||
    surcharge_start_hour < 0 || surcharge_start_hour > 23 ||
    surcharge_end_hour < 0 || surcharge_end_hour > 23
  ) {
    return NextResponse.json({ error: 'Missing or invalid fields' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('pricing_settings')
    .update({
      surcharge_type,
      surcharge_amount,
      surcharge_start_hour,
      surcharge_end_hour,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1)

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
