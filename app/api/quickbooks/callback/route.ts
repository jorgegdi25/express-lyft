import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForTokens } from '@/lib/quickbooks'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const realmId = req.nextUrl.searchParams.get('realmId')
  const state = req.nextUrl.searchParams.get('state')
  const expectedState = req.cookies.get('qb_oauth_state')?.value

  // Prefer the actual request origin over NEXT_PUBLIC_BASE_URL: that env var
  // is the same across Preview and Production, so relying on it here would
  // always bounce back to production even when the OAuth flow ran on a
  // preview deployment (e.g. pruebas.explyft.com).
  const baseUrl = req.nextUrl.origin || process.env.NEXT_PUBLIC_BASE_URL

  if (!code || !realmId) {
    return NextResponse.redirect(`${baseUrl}/admin?quickbooks=error&reason=missing_params`)
  }

  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${baseUrl}/admin?quickbooks=error&reason=invalid_state`)
  }

  try {
    await exchangeCodeForTokens(code, realmId)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[quickbooks/callback] token exchange failed:', message)
    return NextResponse.redirect(`${baseUrl}/admin?quickbooks=error&reason=token_exchange`)
  }

  const res = NextResponse.redirect(`${baseUrl}/admin?quickbooks=connected`)
  res.cookies.delete('qb_oauth_state')
  return res
}
