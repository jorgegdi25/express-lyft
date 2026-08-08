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

async function findServiceItem(realmId: string, accessToken: string) {
  const query = `select * from Item where Name = '${escapeQb(SERVICE_ITEM_NAME)}'`
  const data = await qbFetch(realmId, accessToken, `/query?query=${encodeURIComponent(query)}`)
  return data.QueryResponse?.Item?.[0] || null
}

async function createServiceItem(realmId: string, accessToken: string) {
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
      Name: SERVICE_ITEM_NAME,
      Type: 'Service',
      IncomeAccountRef: { value: incomeAccount.Id },
    }),
  })
  return data.Item
}

async function getOrCreateServiceItem(realmId: string, accessToken: string) {
  const existing = await findServiceItem(realmId, accessToken)
  if (existing) return existing
  return createServiceItem(realmId, accessToken)
}

const TAX_ITEM_NAME = 'Florida Sales Tax (7%)'

async function findTaxItem(realmId: string, accessToken: string) {
  const query = `select * from Item where Name = '${escapeQb(TAX_ITEM_NAME)}'`
  const data = await qbFetch(realmId, accessToken, `/query?query=${encodeURIComponent(query)}`)
  return data.QueryResponse?.Item?.[0] || null
}

async function createTaxItem(realmId: string, accessToken: string) {
  const accountsData = await qbFetch(
    realmId,
    accessToken,
    `/query?query=${encodeURIComponent("select * from Account where AccountType = 'Income' maxresults 1")}`
  )
  const incomeAccount = accountsData.QueryResponse?.Account?.[0]
  if (!incomeAccount) {
    throw new Error('No se encontró una cuenta de ingresos en QuickBooks para asociar el impuesto')
  }

  const data = await qbFetch(realmId, accessToken, '/item', {
    method: 'POST',
    body: JSON.stringify({
      Name: TAX_ITEM_NAME,
      Type: 'Service',
      IncomeAccountRef: { value: incomeAccount.Id },
    }),
  })
  return data.Item
}

// A plain line item for the tax amount, added at a flat 7% — same approach
// already used for Stripe (lib/tax.ts), instead of relying on QuickBooks'
// Automated Sales Tax engine, which needs per-item tax categories and nexus
// setup we don't have configured.
async function getOrCreateTaxItem(realmId: string, accessToken: string) {
  const existing = await findTaxItem(realmId, accessToken)
  if (existing) return existing
  return createTaxItem(realmId, accessToken)
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

export async function getInvoice(invoiceId: string) {
  const { accessToken, realmId } = await getValidConnection()
  const data = await qbFetch(realmId, accessToken, `/invoice/${invoiceId}`)
  return data.Invoice
}
