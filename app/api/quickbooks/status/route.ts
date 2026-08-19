import { NextRequest, NextResponse } from 'next/server'
import { getConnectionStatus, verifyConnection } from '@/lib/quickbooks'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const connection = await getConnectionStatus()
  if (!connection) {
    return NextResponse.json({ connected: false, realmId: null, updatedAt: null })
  }

  // A stored row is not proof that invoicing works — verify against the API
  // so the admin's indicator reflects reality instead of "OAuth happened once".
  const check = await verifyConnection()

  return NextResponse.json({
    connected: check.ok,
    realmId: connection.realm_id || null,
    updatedAt: connection.updated_at || null,
    environment: check.environment,
    companyName: check.ok ? check.companyName : null,
    error: check.ok ? null : check.reason,
  })
}
