// ---------------------------------------------------------------------------
// GhEasy API client — data bundles, ads & orders
// Base: https://api.getflashx.com
// All responses use a { success, ... } / { success:false, error } envelope.
// ---------------------------------------------------------------------------

import { formatVolume } from './format.js'

const BASE = 'https://api.getflashx.com'

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// --- Bundles ---------------------------------------------------------------

// Prefer the human size in the bundle name (handles 1000MB vs 1024MB providers),
// then gbAmount, then a MB→GB conversion. Never show raw MB for full-GB bundles.
export function deriveVolumeLabel(b) {
  const name = String(b.name || '')
  const gb = name.match(/(\d+(?:\.\d+)?)\s*GB/i)
  if (gb) return `${Math.round(parseFloat(gb[1]))}GB`
  // Only a sub-1GB MB figure is a real "MB" size; 1000MB+ is whole GB (decimal
  // providers) and is normalised from volumeInMB below.
  const mb = name.match(/(\d+)\s*MB/i)
  if (mb && Number(mb[1]) < 1000) return `${mb[1]}MB`
  if (b.gbAmount) return `${Math.round(b.gbAmount)}GB`
  return formatVolume(b.volumeInMB) || name || ''
}

function normalizeBundle(b, i) {
  // Always price from `sellPrice` — never `price`.
  const sellPrice = num(b.sellPrice)
  const volume = deriveVolumeLabel(b)
  return {
    id: b.id || b._id || `${b.network || ''}-${b.name || volume}-${i}`,
    network: b.network,
    name: b.name || volume,
    volume,
    volumeInMB: b.volumeInMB ?? null,
    sellPrice,
    description: b.description || '',
    validity: b.validity || b.expiry || b.duration || '',
    provider: b.provider || null,
    // Per-network availability (server-driven) — default available when absent.
    available: b.available !== false,
    unavailableMessage: b.unavailableMessage || null,
    raw: b,
  }
}

export async function fetchBundles(network) {
  let res
  try {
    res = await fetch(`${BASE}/data/bundles?network=${encodeURIComponent(network)}`, {
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new Error('Network error — check your connection and try again.')
  }
  if (!res.ok) throw new Error(`Couldn’t load bundles (${res.status}).`)
  const json = await res.json().catch(() => null)
  const list = Array.isArray(json?.bundles) ? json.bundles : Array.isArray(json) ? json : []
  return list
    .map(normalizeBundle)
    .filter((b) => b.sellPrice != null && b.sellPrice > 0)
    .sort((a, b) => a.sellPrice - b.sellPrice)
}

// --- Initiate purchase -----------------------------------------------------

export function findPaystackUrl(json) {
  return (
    json?.data?.authorization_url ||
    json?.authorization_url ||
    json?.paystackUrl ||
    json?.payment_url ||
    json?.paymentUrl ||
    json?.checkout_url ||
    json?.data?.url ||
    json?.url ||
    null
  )
}

export function findReference(json) {
  return (
    json?.reference ||
    json?.data?.reference ||
    json?.orderReference ||
    json?.data?.orderReference ||
    json?.order?.reference ||
    null
  )
}

/**
 * Start a purchase via the GhEasy backend, which initialises the Paystack
 * checkout. Returns the raw response ({ success, ... }); callers read the
 * authorization URL + reference from it (see findPaystackUrl / findReference).
 */
export async function initiatePurchase({ recipientPhone, networkType, volumeInMB, gbAmount, bundleName, referralCode }) {
  const res = await fetch(`${BASE}/gheasy/purchase`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipientPhone, networkType, volumeInMB, gbAmount, bundleName, referralCode }),
  })
  const data = await res.json().catch(() => ({}))
  if (!data.success) throw new Error(data.error || 'Failed to initiate purchase')
  return data
}

// --- Agent auth -------------------------------------------------------------

// Shared POST helper for /gheasy/auth/*. On failure it throws an Error whose
// `.status` carries the HTTP code so callers can branch (e.g. 409 = exists,
// 403 = joining fee unpaid).
async function agentAuthPost(path, body) {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    throw new Error('Network error — check your connection and try again.')
  }
  const data = await res.json().catch(() => ({}))
  if (!data.success) {
    const err = new Error(data.error || 'Something went wrong. Please try again.')
    err.status = res.status
    throw err
  }
  return data
}

// Send the SMS verification code for agent sign-up.
export const sendAgentOtp = (phone) => agentAuthPost('/gheasy/auth/send-otp', { phone })

// Register an agent → returns { paymentUrl } for the GHS joining fee (409 if the
// phone already has an account).
export const registerAgent = ({ phone, pin, storeName, otp, supportWhatsapp }) =>
  agentAuthPost('/gheasy/auth/register', { phone, pin, storeName, otp, supportWhatsapp })

// Log an agent in → { token, agent } (403 if joining fee unpaid / blocked).
export const loginAgent = ({ phone, pin }) => agentAuthPost('/gheasy/auth/login', { phone, pin })

// Restart the joining-fee checkout for a pending agent → { paymentUrl }.
export const resendAgentPayment = ({ phone, pin }) =>
  agentAuthPost('/gheasy/auth/resend-payment', { phone, pin })

// --- Unified login & free customer accounts --------------------------------

// One login for both tiers → { type:'agent'|'customer', token, agent|customer }.
// Throws with .status set (403 = agent registered but joining fee unpaid).
export const loginAccount = ({ phone, pin }) => agentAuthPost('/gheasy/auth/login', { phone, pin })

// Free customer signup (phone + PIN + name, no payment, active immediately).
export const registerCustomer = ({ phone, pin, name }) =>
  agentAuthPost('/gheasy/customer/register', { phone, pin, name })

export async function fetchCustomerMe(token) {
  const res = await fetch(`${BASE}/gheasy/customer/me`, { headers: { 'x-customer-token': token } })
  const data = await res.json().catch(() => ({}))
  if (!data.success) { const e = new Error(data.error || 'Could not load your account.'); e.status = res.status; throw e }
  return data
}

export async function fetchCustomerOrders(token) {
  const res = await fetch(`${BASE}/gheasy/customer/orders`, { headers: { 'x-customer-token': token } })
  const data = await res.json().catch(() => ({}))
  if (!data.success) throw new Error(data.error || 'Could not load orders.')
  return data.orders || []
}

// Upgrade a logged-in customer to a paid agent → { paymentUrl } for the GHS 60 fee.
export async function upgradeToAgent({ token, storeName, supportWhatsapp }) {
  const res = await fetch(`${BASE}/gheasy/customer/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-customer-token': token },
    body: JSON.stringify({ storeName, supportWhatsapp }),
  })
  const data = await res.json().catch(() => ({}))
  if (!data.success) throw new Error(data.error || 'Upgrade failed.')
  return data
}

// --- Order status ----------------------------------------------------------

const STATUS_MAP = {
  success: 'success',
  successful: 'success',
  completed: 'success',
  complete: 'success',
  delivered: 'success',
  paid: 'processing',
  pending: 'pending',
  processing: 'processing',
  initiated: 'pending',
  queued: 'processing',
  failed: 'failed',
  cancelled: 'failed',
  canceled: 'failed',
  refunded: 'failed',
  reversed: 'failed',
}

function normalizeStatus(raw) {
  const key = String(raw || '').toLowerCase().trim()
  return STATUS_MAP[key] || (key ? 'pending' : 'pending')
}

function normalizeOrder(o, reference) {
  const src = o || {}
  return {
    reference: src.reference || src.orderReference || src.id || reference,
    status: normalizeStatus(src.status || src.deliveryStatus || src.state),
    rawStatus: src.status || src.deliveryStatus || src.state || 'pending',
    network: src.network || src.networkKey || '',
    phone: src.phone || src.phoneNumber || src.recipient || '',
    bundle: src.name || src.bundleName || src.volume || '',
    volume: src.volume || src.bundleName || src.name || '',
    amount: num(src.amount ?? src.sellPrice ?? src.price),
    createdAt: src.createdAt || src.created_at || src.date || null,
    raw: src,
  }
}

export async function getOrder(reference) {
  const ref = String(reference || '').trim()
  if (!ref) throw new Error('Enter an order reference or phone number.')

  let res
  try {
    res = await fetch(`${BASE}/data/order/${encodeURIComponent(ref)}`, {
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new Error('Network error — check your connection and try again.')
  }

  const json = await res.json().catch(() => ({}))

  if (res.status === 404) return { found: false }
  if (!res.ok || json?.success === false) {
    const msg = json?.error || json?.message || `Couldn’t fetch that order (${res.status}).`
    if (/not\s*found|404/i.test(msg)) return { found: false }
    throw new Error(msg)
  }

  const order = json?.order || json?.data || json
  return { found: true, order: normalizeOrder(order, ref) }
}

// --- Referral (shared backend; looked up by phone for no-login Gheasy users) -
export async function fetchReferralByPhone(phone) {
  const res = await fetch(`${BASE}/referral/dashboard-by-phone/${encodeURIComponent(phone)}`, {
    headers: { Accept: 'application/json' },
  })
  const data = await res.json().catch(() => ({}))
  if (!data.success) throw new Error(data.error || 'Could not load referral data.')
  return data
}
