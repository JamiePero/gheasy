// Lightweight localStorage-backed store — orders, profile, referral code.
// No login: everything lives on the device.

const ORDERS_KEY = 'gheasy-orders'
const PROFILE_KEY = 'gheasy-profile'
const REFERRAL_KEY = 'gheasy-referral'

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore (private mode / quota) */
  }
}

// --- Orders ----------------------------------------------------------------

export function getOrders() {
  const list = read(ORDERS_KEY, [])
  return Array.isArray(list) ? list : []
}

export function saveOrder(order) {
  const list = getOrders()
  const entry = {
    id: order.id || `o-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: order.createdAt || Date.now(),
    status: order.status || 'pending',
    source: order.source || 'App',
    ...order,
  }
  list.unshift(entry)
  write(ORDERS_KEY, list.slice(0, 50))
  return entry
}

export function updateOrder(match, patch) {
  const list = getOrders()
  let changed = false
  const next = list.map((o) => {
    const hit =
      (match.reference && o.reference && o.reference === match.reference) ||
      (match.id && o.id === match.id)
    if (hit) {
      changed = true
      return { ...o, ...patch }
    }
    return o
  })
  if (changed) write(ORDERS_KEY, next)
  return changed
}

export function clearOrders() {
  write(ORDERS_KEY, [])
}

// --- Profile ---------------------------------------------------------------

export function getProfile() {
  const p = read(PROFILE_KEY, {})
  return { name: '', phone: '', email: '', area: '', ...(p || {}) }
}

export function saveProfile(profile) {
  write(PROFILE_KEY, { ...getProfile(), ...profile })
}

// --- Referral --------------------------------------------------------------

export function getReferralCode() {
  let code = read(REFERRAL_KEY, null)
  if (!code || typeof code !== 'string') {
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '')
    code = 'EZ-' + (rand + '000000').slice(0, 6)
    write(REFERRAL_KEY, code)
  }
  return code
}
