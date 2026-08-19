import { supabaseAdmin } from './supabase'

const IS_SANDBOX = (process.env.QUICKBOOKS_ENVIRONMENT || 'sandbox') !== 'production'
const API_BASE = IS_SANDBOX
  ? 'https://sandbox-quickbooks.api.intuit.com'
  : 'https://quickbooks.api.intuit.com'
const OAUTH_AUTHORIZE_URL = 'https://appcenter.intuit.com/connect/oauth2'
const OAUTH_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
const SCOPE = 'com.intuit.quickbooks.accounting'
const SERVICE_ITEM_NAME = 'Transportation Service'

function basicAuthHeader() {
  const id = process.env.QUICKBOOKS_CLIENT_ID || ''
  const secret = process.env.QUICKBOOKS_CLIENT_SECRET || ''
  return 'Basic ' + Buffer.from(`${id}:${secret}`).toString('base64')
}

export function getAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.QUICKBOOKS_CLIENT_ID || '',
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI || '',
    state,
  })
  return `${OAUTH_AUTHORIZE_URL}?${params.toString()}`
}

async function requestTokens(body: Record<string, string>) {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams(body),
  })
  if (!res.ok) throw new Error(`QuickBooks token request failed: ${await res.text()}`)
  return res.json()
}

async function storeTokens(realmId: string, tokens: any) {
  const now = Date.now()
  const accessTokenExpiresAt = new Date(now + tokens.expires_in * 1000).toISOString()
  const refreshTokenExpiresAt = new Date(now + tokens.x_refresh_token_expires_in * 1000).toISOString()

  // Single-row table: replace any existing connection with the fresh one.
  await supabaseAdmin.from('quickbooks_connection').delete().not('id', 'is', null)
  const { error } = await supabaseAdmin.from('quickbooks_connection').insert({
    realm_id: realmId,
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    access_token_expires_at: accessTokenExpiresAt,
    refresh_token_expires_at: refreshTokenExpiresAt,
  })
  if (error) throw new Error('Failed to store QuickBooks tokens: ' + error.message)
}

export async function exchangeCodeForTokens(code: string, realmId: string) {
  const tokens = await requestTokens({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.QUICKBOOKS_REDIRECT_URI || '',
  })
  await storeTokens(realmId, tokens)
  return tokens
}

export async function getConnectionStatus() {
  const { data } = await supabaseAdmin
    .from('quickbooks_connection')
    .select('realm_id, updated_at, refresh_token_expires_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()
  return data || null
}

/**
 * Actually calls QuickBooks to prove the stored token works against the
 * environment this deployment is pointed at. A row in the table only means
 * someone completed OAuth once — it says nothing about whether invoicing
 * will work now. Notably, a production token queried against the sandbox
 * host (which is what an unset QUICKBOOKS_ENVIRONMENT silently selects)
 * fails here with ApplicationAuthorizationFailed / 403.
 */
export async function verifyConnection(): Promise<
  | { ok: true; companyName: string; realmId: string; environment: string }
  | { ok: false; reason: string; environment: string }
> {
  const environment = IS_SANDBOX ? 'sandbox' : 'production'
  try {
    const { accessToken, realmId } = await getValidConnection()
    const res = await fetch(`${API_BASE}/v3/company/${realmId}/companyinfo/${realmId}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      cache: 'no-store',
    })
    if (!res.ok) {
      const body = await res.text()
      const hint =
        res.status === 403 && IS_SANDBOX
          ? ' — this deployment is pointed at the QuickBooks sandbox. Set QUICKBOOKS_ENVIRONMENT=production and redeploy.'
          : ''
      return { ok: false, environment, reason: `QuickBooks returned ${res.status}${hint} ${body.slice(0, 200)}` }
    }
    const json = await res.json()
    return {
      ok: true,
      environment,
      realmId,
      companyName: json?.CompanyInfo?.CompanyName || 'Unknown company',
    }
  } catch (err) {
    return { ok: false, environment, reason: err instanceof Error ? err.message : 'Unknown error' }
  }
}

async function getValidConnection() {
  const { data: connection, error } = await supabaseAdmin
    .from('quickbooks_connection')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !connection) {
    throw new Error('QuickBooks no está conectado todavía. Conéctalo desde el panel de admin primero.')
  }

  const accessExpiresAt = new Date(connection.access_token_expires_at).getTime()
  const bufferMs = 5 * 60 * 1000 // refresh 5 min before it actually expires

  if (Date.now() < accessExpiresAt - bufferMs) {
    return { accessToken: connection.access_token as string, realmId: connection.realm_id as string }
  }

  const tokens = await requestTokens({
    grant_type: 'refresh_token',
    refresh_token: connection.refresh_token,
  })

  const now = Date.now()
  const accessTokenExpiresAt = new Date(now + tokens.expires_in * 1000).toISOString()
  const refreshTokenExpiresAt = new Date(now + tokens.x_refresh_token_expires_in * 1000).toISOString()

  const { error: updateError } = await supabaseAdmin
    .from('quickbooks_connection')
    .update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      access_token_expires_at: accessTokenExpiresAt,
      refresh_token_expires_at: refreshTokenExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', connection.id)

  if (updateError) throw new Error('Failed to update refreshed QuickBooks tokens: ' + updateError.message)

  return { accessToken: tokens.access_token as string, realmId: connection.realm_id as string }
}

async function qbFetch(realmId: string, accessToken: string, path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}/v3/company/${realmId}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const intuitTid = res.headers.get('intuit_tid')
  if (!res.ok) {
    throw new Error(`QuickBooks API error (${path}) [intuit_tid: ${intuitTid || 'n/a'}]: ${await res.text()}`)
  }
  return res.json()
}

function escapeQb(value: string) {
  return value.replace(/'/g, "\\'")
}

async function findCustomerByEmail(realmId: string, accessToken: string, email: string) {
  const query = `select * from Customer where PrimaryEmailAddr = '${escapeQb(email)}'`
  const data = await qbFetch(realmId, accessToken, `/query?query=${encodeURIComponent(query)}`)
  return data.QueryResponse?.Customer?.[0] || null
}

async function createCustomer(
  realmId: string,
  accessToken: string,
  info: { name: string; email: string; phone?: string }
) {
  const data = await qbFetch(realmId, accessToken, '/customer', {
    method: 'POST',
    body: JSON.stringify({
      DisplayName: info.name,
      PrimaryEmailAddr: { Address: info.email },
      ...(info.phone ? { PrimaryPhone: { FreeFormNumber: info.phone } } : {}),
    }),
  })
  return data.Customer
}

async function findOrCreateCustomer(
  realmId: string,
  accessToken: string,
  info: { name: string; email: string; phone?: string }
) {
  const existing = await findCustomerByEmail(realmId, accessToken, info.email)
  if (existing) return existing
  return createCustomer(realmId, accessToken, info)
}

async function findServiceItem(realmId: string, accessToken: string, itemName: string) {
  const query = `select * from Item where Name = '${escapeQb(itemName)}'`
  const data = await qbFetch(realmId, accessToken, `/query?query=${encodeURIComponent(query)}`)
  return data.QueryResponse?.Item?.[0] || null
}

async function createServiceItem(realmId: string, accessToken: string, itemName: string) {
  const accountsData = await qbFetch(
    realmId,
    accessToken,
    `/query?query=${encodeURIComponent("select * from Account where AccountType = 'Income' maxresults 1")}`
  )
  const incomeAccount = accountsData.QueryResponse?.Account?.[0]
  if (!incomeAccount) {
    throw new Error('No se encontró una cuenta de ingresos en QuickBooks para asociar el servicio')
  }

  const data = await qbFetch(realmId, accessToken, '/item', {
    method: 'POST',
    body: JSON.stringify({
      Name: itemName,
      Type: 'Service',
      IncomeAccountRef: { value: incomeAccount.Id },
    }),
  })
  return data.Item
}

// Line items are looked up (or created once) by name — same pattern for the
// transport service, the room charge, and either tax item below.
async function getOrCreateServiceItem(realmId: string, accessToken: string, itemName: string = SERVICE_ITEM_NAME) {
  const existing = await findServiceItem(realmId, accessToken, itemName)
  if (existing) return existing
  return createServiceItem(realmId, accessToken, itemName)
}

// Exported so the webhook/cron reconciliation code (which needs to find
// these exact strings again on an invoice's line items) can't drift from
// what actually got written onto the invoice here.
export const TAX_ITEM_NAME = 'Florida Sales Tax (7%)'
export const STAY_TAX_ITEM_NAME = 'FL Lodging Tax (13%)'
const STAY_ROOM_ITEM_NAME = 'Hotel Room (Stay)'

// A plain line item for the tax amount (flat rate, not QuickBooks' Automated
// Sales Tax engine, which needs per-item tax categories and nexus setup we
// don't have configured) — same approach already used for Stripe
// (lib/tax.ts / lib/stayTax.ts). Transport and Stay are taxed at different
// rates, so they're two distinct named items, not one shared one.
async function getOrCreateTaxItem(realmId: string, accessToken: string, itemName: string = TAX_ITEM_NAME) {
  const existing = await findServiceItem(realmId, accessToken, itemName)
  if (existing) return existing
  return createServiceItem(realmId, accessToken, itemName)
}

export async function createAndSendInvoice(params: {
  customerName: string
  customerEmail: string
  customerPhone?: string
  amount: number
  description: string
  taxAmount?: number
}) {
  const { accessToken, realmId } = await getValidConnection()

  const customer = await findOrCreateCustomer(realmId, accessToken, {
    name: params.customerName,
    email: params.customerEmail,
    phone: params.customerPhone,
  })

  const item = await getOrCreateServiceItem(realmId, accessToken)

  const lines: any[] = [
    {
      Amount: params.amount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: { value: item.Id } },
      Description: params.description,
    },
  ]

  if (params.taxAmount && params.taxAmount > 0) {
    const taxItem = await getOrCreateTaxItem(realmId, accessToken)
    lines.push({
      Amount: Math.round(params.taxAmount * 100) / 100,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: { value: taxItem.Id } },
      Description: 'Florida Sales Tax (7%)',
    })
  }

  const invoiceData = await qbFetch(realmId, accessToken, '/invoice', {
    method: 'POST',
    body: JSON.stringify({
      CustomerRef: { value: customer.Id },
      BillEmail: { Address: params.customerEmail },
      Line: lines,
    }),
  })

  const invoice = invoiceData.Invoice

  // Fetch the invoice's shareable online payment link — this works
  // regardless of whether the email below goes out, and is what lets the
  // admin copy/send a "pay now" link the same way the Stripe flow does.
  let invoiceLink: string | null = null
  try {
    const linkData = await qbFetch(realmId, accessToken, `/invoice/${invoice.Id}?include=invoiceLink`)
    invoiceLink = linkData.Invoice?.InvoiceLink || null
  } catch (err) {
    console.error('[quickbooks] failed to fetch invoice link:', err instanceof Error ? err.message : err)
  }

  // Triggers QuickBooks' own invoice email, which includes the "Review and
  // pay" link since QuickBooks Payments is already active on this account.
  // The invoice itself is already created at this point, so a failure here
  // (e.g. email delivery hiccup) shouldn't make the whole operation look
  // like it failed — the admin can still see/resend it from QuickBooks.
  let emailSent = true
  try {
    await qbFetch(
      realmId,
      accessToken,
      `/invoice/${invoice.Id}/send?sendTo=${encodeURIComponent(params.customerEmail)}`,
      { method: 'POST' }
    )
  } catch (err) {
    emailSent = false
    console.error('[quickbooks] invoice created but email send failed:', err instanceof Error ? err.message : err)
  }

  return { ...invoice, emailSent, invoiceLink }
}

// Stay's own version: two revenue lines (room + the transport leg, kept
// separate so the CRM's revenue split still works the same way it does for
// Stripe — see room_amount/transport_amount in app/api/stay/checkout) plus
// the 13% lodging tax line instead of the 7% transport tax. The tax line's
// exact text ('FL Lodging Tax (13%)') is what the webhook looks for later to
// recover the taxed amount — same pattern as the transport invoice's
// 'Florida Sales Tax (7%)' line, see syncStayInvoicePayment.
export async function createAndSendStayInvoice(params: {
  guestName: string
  guestEmail: string
  guestPhone?: string
  roomAmount: number
  transportAmount: number
  taxAmount: number
  roomDescription: string
  transportDescription: string
}) {
  const { accessToken, realmId } = await getValidConnection()

  const customer = await findOrCreateCustomer(realmId, accessToken, {
    name: params.guestName,
    email: params.guestEmail,
    phone: params.guestPhone,
  })

  const roomItem = await getOrCreateServiceItem(realmId, accessToken, STAY_ROOM_ITEM_NAME)
  const transportItem = await getOrCreateServiceItem(realmId, accessToken)

  const lines: any[] = [
    {
      Amount: params.roomAmount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: { value: roomItem.Id } },
      Description: params.roomDescription,
    },
    {
      Amount: params.transportAmount,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: { value: transportItem.Id } },
      Description: params.transportDescription,
    },
  ]

  if (params.taxAmount > 0) {
    const taxItem = await getOrCreateTaxItem(realmId, accessToken, STAY_TAX_ITEM_NAME)
    lines.push({
      Amount: Math.round(params.taxAmount * 100) / 100,
      DetailType: 'SalesItemLineDetail',
      SalesItemLineDetail: { ItemRef: { value: taxItem.Id } },
      Description: STAY_TAX_ITEM_NAME,
    })
  }

  const invoiceData = await qbFetch(realmId, accessToken, '/invoice', {
    method: 'POST',
    body: JSON.stringify({
      CustomerRef: { value: customer.Id },
      BillEmail: { Address: params.guestEmail },
      Line: lines,
    }),
  })

  const invoice = invoiceData.Invoice

  let invoiceLink: string | null = null
  try {
    const linkData = await qbFetch(realmId, accessToken, `/invoice/${invoice.Id}?include=invoiceLink`)
    invoiceLink = linkData.Invoice?.InvoiceLink || null
  } catch (err) {
    console.error('[quickbooks][stay] failed to fetch invoice link:', err instanceof Error ? err.message : err)
  }

  let emailSent = true
  try {
    await qbFetch(
      realmId,
      accessToken,
      `/invoice/${invoice.Id}/send?sendTo=${encodeURIComponent(params.guestEmail)}`,
      { method: 'POST' }
    )
  } catch (err) {
    emailSent = false
    console.error('[quickbooks][stay] invoice created but email send failed:', err instanceof Error ? err.message : err)
  }

  return { ...invoice, emailSent, invoiceLink }
}

export async function getInvoice(invoiceId: string) {
  const { accessToken, realmId } = await getValidConnection()
  const data = await qbFetch(realmId, accessToken, `/invoice/${invoiceId}`)
  return data.Invoice
}
