import { NextRequest, NextResponse } from 'next/server'
import { checkDiscountCode } from '@/lib/discountCodes'

export const dynamic = 'force-dynamic'

// Read-only, public, does not consume a use — lets the booking form show the
// discount before checkout. The real (authoritative) check happens again
// server-side in /api/leads and /api/stay/checkout right before charging.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { code, amount } = body

  if (!code || typeof amount !== 'number') {
    return NextResponse.json({ valid: false, error: 'Missing code or amount' }, { status: 400 })
  }

  const result = await checkDiscountCode(code, amount)
  return NextResponse.json(result)
}
