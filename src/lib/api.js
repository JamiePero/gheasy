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
function deriveVolumeLabel(b) {
  const name = String(b.name || '')
  const gb = name.match(/(\d+(?:\.\d+)?)\s*GB/i)
  if (gb) return `${Math.round(parseFloat(gb[1]))}GB`
  const mb = name.match(/(\d+)\s*MB/i)
  if (mb) return `${mb[1]}MB`
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

function findPaystackUrl(json) {
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

function findReference(json) {
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
 * Start a Paystack checkout for a bundle, using the exact field names the
 * getflashx backend expects. No-login customers are sent as userId "guest".
 */
export async function initiatePurchase({ network, phone, bundle }) {
  const callbackUrl = `${window.location.origin}/order-status`
  const payload = {
    userId: 'guest',
    recipientPhone: phone,
    networkType: network, // mtn | telecel | airteltigo_ishare | airteltigo_bigtime
    volumeInMB: bundle.volumeInMB,
    bundleName: bundle.name, // e.g. "1GB"
    callbackUrl, // Paystack returns the customer to /order-status
  }
  // gbAmount is only present on DataHub bundles.
  const gbAmount = bundle.raw?.gbAmount ?? bundle.gbAmount
  if (gbAmount != null) payload.gbAmount = gbAmount

  let res
  try {
    res = await fetch(`${BASE}/data/initiate-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    throw new Error('Network error — check your connection and try again.')
  }

  const json = await res.json().catch(() => ({}))
  if (!res.ok || json?.success === false) {
    throw new Error(json?.error || json?.message || `Payment couldn’t be started (${res.status}).`)
  }

  const url = findPaystackUrl(json)
  if (!url) throw new Error('No payment link was returned. Please try again in a moment.')
  return { url, reference: findReference(json), raw: json }
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
