import { NextRequest, NextResponse } from 'next/server'
import { getConnectionStatus } from '@/lib/quickbooks'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connection = await getConnectionStatus()
  return NextResponse.json({
    connected: !!connection,
    realmId: connection?.realm_id || null,
    updatedAt: connection?.updated_at || null,
  })
}
