// Lightweight localStorage-backed store — orders, profile, referral code.
// No login: everything lives on the device.

const ORDERS_KEY = 'gheasy-orders'
const PROFILE_KEY = 'gheasy-profile'
const REFERRAL_KEY = 'gheasy-referral'
const AGENT_KEY = 'gheasy-agent'

function read(key, fallback) {
  // Guard for prerender/SSR where localStorage is unavailable.
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
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

// --- Incoming referral code (?ref=) ----------------------------------------
const REF_CODE_KEY = 'gheasy-ref-code'

// Capture ?ref=EZ-XXXX from the URL on load so it rides along to the purchase.
export function captureRefFromUrl() {
  if (typeof window === 'undefined') return
  try {
    const ref = new URLSearchParams(window.location.search).get('ref')
    if (ref && ref.trim()) localStorage.setItem(REF_CODE_KEY, ref.trim().toUpperCase())
  } catch {
    /* ignore */
  }
}

export function getStoredRefCode() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null
  try {
    return localStorage.getItem(REF_CODE_KEY) || null
  } catch {
    return null
  }
}

// Clear the stored ref after it's been attached to a purchase, so it can't
// re-credit on a later purchase by the same person.
export function clearStoredRefCode() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  try { localStorage.removeItem(REF_CODE_KEY) } catch { /* ignore */ }
}

// --- Agent store -----------------------------------------------------------

export function getAgentStore() {
  return read(AGENT_KEY, null)
}

export function saveAgentStore(store) {
  const next = { ...(read(AGENT_KEY, {}) || {}), ...store }
  write(AGENT_KEY, next)
  return next
}

// --- Agent session (login token + profile) ---------------------------------
const AGENT_SESSION_KEY = 'gheasy-agent-session'

// Persisted in localStorage, so the agent stays logged in across app closes.
// Only treat it as a valid login when it has both a token and an agent profile.
export function getAgentSession() {
  const session = read(AGENT_SESSION_KEY, null)
  if (session && typeof session === 'object' && session.token && session.agent) return session
  // Cookie fallback: iOS PWA ↔ Safari contexts AND agents visiting gheasy.com
  // (their localStorage session lives on the agent.gheasy.com origin).
  const ck = readSessionCookie(AGENT_COOKIE)
  if (ck && ck.token && ck.agent) {
    write(AGENT_SESSION_KEY, ck)
    return ck
  }
  return null
}

export function isAgentLoggedIn() {
  return getAgentSession() !== null
}

export function saveAgentSession(session) {
  write(AGENT_SESSION_KEY, session)
  setAccountCookie(session?.agent || null)
  setSessionCookie(
    AGENT_COOKIE,
    session
      ? {
          token: session.token,
          agent: {
            agentId: session.agent?.agentId || '',
            storeName: session.agent?.storeName || '',
            slug: session.agent?.slug || '',
            phoneNumber: session.agent?.phoneNumber || '',
          },
        }
      : null,
  )
}

// Logout — clears the persisted agent session, the cached store, and the hint
// cookie, so the Login button reliably comes back.
export function clearAgentSession() {
  write(AGENT_SESSION_KEY, null)
  write(AGENT_KEY, null)
  setAccountCookie(null)
  setSessionCookie(AGENT_COOKIE, null)
}

// --- Session cookies (iOS PWA ↔ Safari + cross-subdomain) -------------------
// iOS gives the installed PWA a SEPARATE localStorage from Safari, so a login
// done in one context is invisible in the other (and Private mode blocks
// localStorage entirely). First-party cookies ARE shared across those contexts
// — and across gheasy.com ↔ agent.gheasy.com — so each session is mirrored
// into a cookie and read back whenever localStorage comes up empty, then
// re-hydrated into localStorage where possible.
const CUSTOMER_COOKIE = 'gheasy_csess'
const AGENT_COOKIE = 'gheasy_asess'

function setSessionCookie(name, value) {
  if (typeof document === 'undefined') return
  try {
    if (!value) {
      document.cookie = `${name}=; Path=/; Max-Age=0; Domain=.gheasy.com; Secure; SameSite=Lax`
      document.cookie = `${name}=; Path=/; Max-Age=0`
      return
    }
    const val = encodeURIComponent(JSON.stringify(value))
    const age = 60 * 60 * 24 * 30 // 30 days — matches the server session TTL
    document.cookie = `${name}=${val}; Path=/; Max-Age=${age}; Domain=.gheasy.com; Secure; SameSite=Lax`
    document.cookie = `${name}=${val}; Path=/; Max-Age=${age}` // localhost / same-origin fallback
  } catch {
    /* cookies blocked */
  }
}

function readSessionCookie(name) {
  if (typeof document === 'undefined') return null
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
    return m ? JSON.parse(decodeURIComponent(m[1])) : null
  } catch {
    return null
  }
}

// --- Customer session (free customer accounts) -----------------------------
// Written to BOTH localStorage and a session cookie on login.
const CUSTOMER_SESSION_KEY = 'gheasy-customer-session'

export function getCustomerSession() {
  const s = read(CUSTOMER_SESSION_KEY, null)
  if (s && typeof s === 'object' && s.token && s.customer) return s
  // localStorage empty (fresh PWA context / private mode) → cookie fallback.
  const ck = readSessionCookie(CUSTOMER_COOKIE)
  if (ck && ck.token && ck.customer) {
    write(CUSTOMER_SESSION_KEY, ck) // re-hydrate for next time (no-op if blocked)
    return ck
  }
  return null
}

export function isCustomerLoggedIn() {
  return getCustomerSession() !== null
}

export function saveCustomerSession(session) {
  write(CUSTOMER_SESSION_KEY, session)
  setSessionCookie(
    CUSTOMER_COOKIE,
    session
      ? { token: session.token, customer: { phoneNumber: session.customer?.phoneNumber || '', name: session.customer?.name || '' } }
      : null,
  )
}

export function clearCustomerSession() {
  write(CUSTOMER_SESSION_KEY, null)
  setSessionCookie(CUSTOMER_COOKIE, null)
}

// --- Cross-subdomain account hint ------------------------------------------
// The auth session (with token) stays per-origin in localStorage. So the
// customer site (gheasy.com) can tell an account is signed in on
// agent.gheasy.com, we also drop a lightweight, token-free cookie scoped to
// .gheasy.com. This is additive — it never affects the token/auth flow.
const ACCT_COOKIE = 'gheasy_acct'

function setAccountCookie(agent) {
  if (typeof document === 'undefined') return
  try {
    if (!agent) {
      document.cookie = `${ACCT_COOKIE}=; Path=/; Max-Age=0; Domain=.gheasy.com; Secure; SameSite=Lax`
      document.cookie = `${ACCT_COOKIE}=; Path=/; Max-Age=0`
      return
    }
    const val = encodeURIComponent(JSON.stringify({ storeName: agent.storeName || '' }))
    const yr = 60 * 60 * 24 * 365
    document.cookie = `${ACCT_COOKIE}=${val}; Path=/; Max-Age=${yr}; Domain=.gheasy.com; Secure; SameSite=Lax`
    document.cookie = `${ACCT_COOKIE}=${val}; Path=/; Max-Age=${yr}` // localhost / same-origin fallback
  } catch {
    /* cookies blocked */
  }
}

function readAccountCookie() {
  if (typeof document === 'undefined') return null
  try {
    const m = document.cookie.match(new RegExp('(?:^|; )' + ACCT_COOKIE + '=([^;]*)'))
    return m ? JSON.parse(decodeURIComponent(m[1])) : null
  } catch {
    return null
  }
}

// Logged-in hint for the customer UI — works cross-subdomain. Prefers the full
// local session (same origin, has the token), else the shared cookie.
export function getAccountHint() {
  const session = getAgentSession()
  if (session?.agent) return { type: 'agent', storeName: session.agent.storeName || '', name: session.agent.storeName || '' }
  // Same-origin agents also have their store cached under a separate key, which
  // the home "Manage your store" card reads — so the Login button must honour it
  // too, or the page shows the store AND a Login button at the same time.
  const store = getAgentStore()
  if (store?.storeName) return { type: 'agent', storeName: store.storeName, name: store.storeName }
  // Free customer account (gheasy.com, same origin).
  const customer = getCustomerSession()
  if (customer?.customer) return { type: 'customer', name: customer.customer.name || '', storeName: '' }
  // Cross-subdomain (agent signed in on agent.gheasy.com): the lightweight cookie.
  return readAccountCookie()
}
