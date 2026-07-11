import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { clearAgentSession, getAgentSession, saveAgentSession } from '../lib/store.js'
import { friendlyError } from '../lib/errors.js'
import { formatCedis, isValidGhPhone, normalizePhone } from '../lib/format.js'
import { CheckIcon, CopyIcon, GiftIcon, ReceiptIcon, WalletIcon } from '../components/icons.jsx'

const BASE = 'https://api.getflashx.com'

// Build the customPrices key for a bundle — MUST match the backend store endpoint.
// MTN keys by volumeInMB (`mtn_<volumeInMB>`); other networks key by GB
// (`<network>_<gbAmount>`).
function bundleKeyOf(b) {
  return b.gbAmount != null ? `${b.network}_${b.gbAmount}` : `mtn_${b.volumeInMB}`
}

export default function AgentDashboard() {
  const navigate = useNavigate()
  const [session] = useState(() => getAgentSession())
  const [copied, setCopied] = useState(false)
  const agent = session?.agent
  const token = session?.token

  // ── Cashout state ──────────────────────────────────────────────────────────
  const [showCashout, setShowCashout] = useState(false)
  const [cashoutAmount, setCashoutAmount] = useState('')
  const [momoNumber, setMomoNumber] = useState('')
  const [momoNetwork, setMomoNetwork] = useState('mtn')
  const [cashoutLoading, setCashoutLoading] = useState(false)
  const [cashoutError, setCashoutError] = useState('')
  const [cashoutSuccess, setCashoutSuccess] = useState('')

  // ── Pricing state ──────────────────────────────────────────────────────────
  const [showPricing, setShowPricing] = useState(false)
  const [bundles, setBundles] = useState([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [bundlesError, setBundlesError] = useState('')
  const [customPrices, setCustomPrices] = useState({})
  const [savingKey, setSavingKey] = useState(null)
  const [saveSuccess, setSaveSuccess] = useState(null)
  const [fees, setFees] = useState({}) // bundleKey -> live calculate-fees breakdown
  const [feesLoading, setFeesLoading] = useState({})
  const feeTimers = useRef({})

  // ── Support WhatsApp settings ──────────────────────────────────────────────
  // Pre-filled from the logged-in session. Agents who registered before this
  // field existed start empty and their store falls back to the main easy line.
  const [supportNumber, setSupportNumber] = useState(() => agent?.supportWhatsapp || '')
  const [supportSaving, setSupportSaving] = useState(false)
  const [supportMsg, setSupportMsg] = useState(null) // { ok: boolean, text: string }

  // ── Referral side — agents have it too; read the gheasy_referrers ledger by phone.
  const [referral, setReferral] = useState(null)
  useEffect(() => {
    if (!agent?.phoneNumber) return
    fetch(`${BASE}/gheasy/referrer/${encodeURIComponent(agent.phoneNumber)}`)
      .then((r) => r.json())
      .then((d) => { if (d.success) setReferral(d) })
      .catch(() => {})
  }, [agent?.phoneNumber])

  // Fresh dashboard data — the session is captured at login and goes stale, so
  // refetch earnings/orders on mount (Part 6).
  const [live, setLive] = useState(null)
  const [refundProgress, setRefundProgress] = useState(null)
  // Price-floor migration notice — dismissible, shows once (localStorage), and
  // the server flag also clears on their next price save.
  const [priceNoticeDismissed, setPriceNoticeDismissed] = useState(() => {
    try { return localStorage.getItem('easy-price-floor-notice-dismissed') === '1' } catch { return false }
  })
  useEffect(() => {
    if (!token) return
    let alive = true
    fetch(`${BASE}/gheasy/agent/dashboard`, { headers: { 'x-agent-token': token } })
      .then((r) => r.json())
      .then((data) => {
        if (alive && data.success && data.agent) setLive(data.agent)
      })
      .catch(() => {
        /* keep the stale session values on failure */
      })
    // ₵60 Refund Challenge progress — dedicated endpoint; it also idempotently
    // files the refund request the moment the target is reached.
    fetch(`${BASE}/gheasy/agent/refund-progress`, { headers: { 'x-agent-token': token } })
      .then((r) => r.json())
      .then((d) => { if (alive && d.success) setRefundProgress(d) })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [token])

  // ── Arriving from Paystack callback (not logged in yet) ───────────────────
  if (!agent) {
    return (
      <Page className="wrap-app pb-12 pt-10">
        <div className="rounded-3xl border border-brand/40 bg-brand/[0.07] p-8 text-center shadow-card">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand text-white">
            <CheckIcon className="h-8 w-8" strokeWidth={3} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Payment received 🎉</h1>
          <p className="mx-auto mt-2 max-w-sm text-muted">
            Your easy store is being activated. Log in with your phone and PIN to manage it.
          </p>
          <Button to="/login" className="mx-auto mt-6">
            Log in to your store
          </Button>
        </div>
      </Page>
    )
  }

  const view = live || agent
  const storeUrl = live?.storeUrl || `https://agent.gheasy.com/store/${agent.slug}`

  const logout = () => {
    clearAgentSession()
    navigate('/agent/login')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* blocked */ }
  }

  // ── Load bundles for pricing editor ───────────────────────────────────────
  async function loadBundles() {
    setBundlesLoading(true)
    setBundlesError('')
    if (!agent?.slug) {
      setBundlesError('Your store link is missing. Please log out and log in again.')
      setBundlesLoading(false)
      return
    }
    const url = `${BASE}/gheasy/store/${agent.slug}`
    console.log('[easy] loadBundles GET', url)
    try {
      const res = await fetch(url)
      const text = await res.text()
      console.log('[easy] loadBundles ←', res.status, text.slice(0, 300))
      let data = {}
      try {
        data = JSON.parse(text)
      } catch {
        /* non-JSON response */
      }
      if (!res.ok || !data.success) {
        setBundlesError(data.error || `Could not load bundles (HTTP ${res.status}).`)
        return
      }
      setBundles(data.bundles || [])
      // Pre-fill custom prices from agent data (basePrice falls back to sellPrice).
      const prices = {}
      ;(data.bundles || []).forEach((b) => {
        const key = bundleKeyOf(b)
        const basePrice = b.basePrice ?? b.sellPrice
        if (key && b.sellPrice !== basePrice) prices[key] = String(b.sellPrice)
      })
      setCustomPrices(prices)
    } catch (e) {
      console.error('[easy] loadBundles fetch threw:', e)
      setBundlesError(`Couldn’t reach the server (${e.message}). Check your connection and try again.`)
    } finally {
      setBundlesLoading(false)
    }
  }

  function togglePricing() {
    if (!showPricing && bundles.length === 0) loadBundles()
    setShowPricing((v) => !v)
  }

  async function savePrice(bundleKey, basePrice) {
    const raw = customPrices[bundleKey]
    const price = parseFloat(raw)
    if (!raw || isNaN(price) || price < basePrice) {
      alert(`${formatCedis(basePrice)} minimum — can't sell below easy's price`)
      return
    }
    setSavingKey(bundleKey)
    try {
      const res = await fetch(`${BASE}/gheasy/agent/pricing`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-agent-token': token },
        body: JSON.stringify({ bundleKey, price }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || `Save failed (HTTP ${res.status}).`)
      setSaveSuccess(bundleKey)
      setTimeout(() => setSaveSuccess(null), 2000)
      loadBundles() // refresh so the bundle list reflects the saved price
    } catch (e) {
      console.error('[easy] savePrice error:', e)
      alert(`Couldn’t save price: ${friendlyError(e, 'please try again.')}`)
    } finally {
      setSavingKey(null)
    }
  }

  // ── Live fee breakdown as the agent types a customer price ─────────────────
  function onPriceChange(key, value, bundle) {
    setCustomPrices((p) => ({ ...p, [key]: value }))
    const price = parseFloat(value)
    clearTimeout(feeTimers.current[key])
    if (!Number.isFinite(price) || price <= 0) {
      setFees((f) => {
        if (!(key in f)) return f
        const next = { ...f }
        delete next[key]
        return next
      })
      setFeesLoading((s) => ({ ...s, [key]: false }))
      return
    }
    setFeesLoading((s) => ({ ...s, [key]: true }))
    feeTimers.current[key] = setTimeout(async () => {
      try {
        const res = await fetch(`${BASE}/gheasy/agent/calculate-fees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            agentPrice: price,
            networkType: bundle.network,
            volumeInMB: bundle.volumeInMB,
            gbAmount: bundle.gbAmount,
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (data.success) {
          setFees((f) => ({ ...f, [key]: data }))
        } else {
          setFees((f) => {
            const next = { ...f }
            delete next[key]
            return next
          })
        }
      } catch {
        /* network error — leave the breakdown hidden */
      } finally {
        setFeesLoading((s) => ({ ...s, [key]: false }))
      }
    }, 450)
  }

  // ── Cashout ───────────────────────────────────────────────────────────────
  async function handleCashout() {
    setCashoutError('')
    setCashoutSuccess('')
    const amount = parseFloat(cashoutAmount)
    if (!amount || amount < 10) { setCashoutError('Minimum cashout is GHS 10.'); return }
    if (!momoNumber || momoNumber.length < 10) { setCashoutError('Enter a valid MoMo number.'); return }
    setCashoutLoading(true)
    try {
      const res = await fetch(`${BASE}/gheasy/agent/cashout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-agent-token': token },
        body: JSON.stringify({ amount, momoNumber, momoNetwork }),
      })
      const data = await res.json().catch(() => ({}))
      if (!data.success) throw new Error(data.error || 'Cashout failed. Try again.')
      setCashoutSuccess(`GHS ${data.netAmount?.toFixed(2)} will be sent to ${momoNumber} next business day.`)
      setCashoutAmount('')
      setMomoNumber('')
    } catch (e) {
      setCashoutError(friendlyError(e, 'Cashout failed. Try again.'))
    } finally {
      setCashoutLoading(false)
    }
  }

  // ── Save support WhatsApp number ───────────────────────────────────────────
  async function saveSupportNumber() {
    setSupportMsg(null)
    if (!isValidGhPhone(supportNumber)) {
      setSupportMsg({ ok: false, text: 'Enter a valid Ghana number, e.g. 024 123 4567.' })
      return
    }
    setSupportSaving(true)
    try {
      const clean = normalizePhone(supportNumber)
      const res = await fetch(`${BASE}/gheasy/agent/store`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-agent-token': token },
        body: JSON.stringify({ supportWhatsapp: clean }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.error || `Save failed (HTTP ${res.status}).`)
      // Persist to the local session so it survives reloads and the store page uses it.
      if (session) saveAgentSession({ ...session, agent: { ...agent, supportWhatsapp: clean } })
      setSupportNumber(clean)
      setSupportMsg({ ok: true, text: 'Saved. Your store support button now reaches this number.' })
    } catch (e) {
      setSupportMsg({ ok: false, text: friendlyError(e, 'Couldn’t save. Please try again.') })
    } finally {
      setSupportSaving(false)
    }
  }

  // Group bundles by network for pricing editor
  const networkGroups = bundles.reduce((acc, b) => {
    const net = b.network || 'other'
    if (!acc[net]) acc[net] = []
    acc[net].push(b)
    return acc
  }, {})

  return (
    <Page className="wrap-app pb-12 pt-6">
      <Seo title="Agent dashboard | easy" noindex />
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Agent · {agent.agentId}</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">{agent.storeName}</h1>
        </div>
        <button onClick={logout} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg">
          Log out
        </button>
      </div>

      {/* Stats */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <WalletIcon className="h-5 w-5 text-brand" />
          <p className="mt-2 text-xs text-muted">Earnings balance</p>
          <p className="font-display text-2xl font-bold tnum text-brand">{formatCedis(view.earningsBalance || 0)}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <ReceiptIcon className="h-5 w-5 text-brand" />
          <p className="mt-2 text-xs text-muted">Total orders</p>
          <p className="font-display text-2xl font-bold tnum">{view.totalOrders || 0}</p>
        </div>
      </div>

      {/* ₵60 Refund Challenge — server-driven progress. Hidden entirely once the
          60-day window closes without hitting the target (no failure message). */}
      {refundProgress && refundProgress.eligible && (
        <div className="mt-4 rounded-3xl border border-brand/40 bg-gradient-to-br from-brand/[0.12] to-brand/[0.03] p-5 shadow-card">
          {refundProgress.targetHit ? (
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand/20 text-brand">
                <GiftIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-extrabold">🎉 You did it!</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {refundProgress.refunded
                    ? `Your ${'₵' + refundProgress.refundAmount} joining fee has been refunded to your MoMo. Thank you for growing easy!`
                    : `Your refund request has been submitted — we’ll send ${'₵' + refundProgress.refundAmount} to your MoMo within 2 business days.`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold">🏆 {'₵' + refundProgress.refundAmount} Refund Challenge</p>
                <span className="text-xs font-semibold text-muted">{refundProgress.daysRemaining} day{refundProgress.daysRemaining === 1 ? '' : 's'} left</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                Bring {refundProgress.target} new customers in your first 60 days and we refund your joining fee.
              </p>
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-brand">{refundProgress.uniqueCustomers} / {refundProgress.target} new customers</span>
                  <span className="text-muted">{Math.max(0, refundProgress.target - refundProgress.uniqueCustomers)} to go</span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-surface">
                  <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, Math.round((refundProgress.uniqueCustomers / refundProgress.target) * 100))}%` }} />
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Price-floor migration notice — one line, dismissible */}
      {live?.priceFloorNotice && !priceNoticeDismissed && (
        <div className="mt-4 flex items-start justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/[0.08] p-3.5 text-xs text-muted">
          <span>One or more of your prices was updated to match easy’s minimum price. You can adjust them anytime.</span>
          <button
            onClick={() => {
              setPriceNoticeDismissed(true)
              try { localStorage.setItem('easy-price-floor-notice-dismissed', '1') } catch { /* ignore */ }
            }}
            aria-label="Dismiss"
            className="text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* Store link */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm font-semibold">Your store link</p>
        <p className="mt-1 break-all text-sm text-muted">{storeUrl}</p>
        <Button onClick={copyLink} variant="secondary" size="sm" icon={<CopyIcon className="h-4 w-4" />} className="mt-3">
          {copied ? 'Copied!' : 'Copy link'}
        </Button>
      </div>

      {/* Referral — agents earn referral points too (read from gheasy_referrers) */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-1.5 text-sm font-semibold"><GiftIcon className="h-4 w-4 text-brand" /> Your referral code</p>
          {referral?.referralCode && (
            <span className="font-display text-lg font-bold tracking-wide text-brand">{referral.referralCode}</span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">Share your code — earn points when a new number buys. Redeem for data or cash.</p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-surface p-3 text-center">
            <p className="text-xs text-muted">Points</p>
            <p className="font-display text-xl font-bold">{referral?.points ?? 0}</p>
          </div>
          <a
            href="https://gheasy.com/rewards"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded-2xl border border-brand/40 bg-brand/10 p-3 text-center text-sm font-semibold text-brand transition-colors hover:bg-brand/20"
          >
            Redeem points
          </a>
        </div>
      </div>

      {/* WhatsApp support number — your store's support button reaches YOU */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <p className="text-sm font-semibold">WhatsApp support number</p>
        <p className="mt-0.5 text-xs text-muted">
          The support button on your store opens a chat to this number — keep it set to your own WhatsApp so customers reach you, not the main easy line.
        </p>
        <div className="mt-3 flex gap-2">
          <input
            type="tel"
            inputMode="numeric"
            placeholder="024 123 4567"
            value={supportNumber}
            onChange={(e) => { setSupportNumber(e.target.value); setSupportMsg(null) }}
            className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
          />
          <Button onClick={saveSupportNumber} loading={supportSaving} size="sm" className="shrink-0">
            Save
          </Button>
        </div>
        {supportMsg && (
          <p className={`mt-2 text-xs ${supportMsg.ok ? 'text-brand' : 'text-red-500'}`}>{supportMsg.text}</p>
        )}
        {!supportNumber.trim() && !supportMsg && (
          <p className="mt-2 text-xs text-amber-500">No number set — your store uses the main easy support line until you save one.</p>
        )}
      </div>

      {/* Cashout */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Request cashout</p>
          <button onClick={() => setShowCashout((v) => !v)} className="text-xs text-brand font-medium">
            {showCashout ? 'Cancel' : 'Withdraw'}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted">10% commission · processed next business day</p>

        {showCashout && (
          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted">Amount (GHS)</label>
              <input
                type="number"
                min="10"
                placeholder="e.g. 50"
                value={cashoutAmount}
                onChange={(e) => setCashoutAmount(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">MoMo number</label>
              <input
                type="tel"
                placeholder="024 123 4567"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">MoMo network</label>
              <select
                value={momoNetwork}
                onChange={(e) => setMomoNetwork(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-brand"
              >
                <option value="mtn">MTN MoMo</option>
                <option value="telecel">Telecel Cash</option>
                <option value="airteltigo">AirtelTigo Money</option>
              </select>
            </div>
            {Number.isFinite(parseFloat(cashoutAmount)) && parseFloat(cashoutAmount) > 0 && (
              <div className="rounded-2xl bg-surface p-3 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>You receive</span>
                  <span className="tnum text-brand">{formatCedis(parseFloat(cashoutAmount))}</span>
                </div>
                <p className="mt-0.5 text-[11px] text-muted">Full amount — no withdrawal fee.</p>
              </div>
            )}
            {cashoutError && <p className="text-xs text-red-500">{cashoutError}</p>}
            {cashoutSuccess && <p className="text-xs text-brand">{cashoutSuccess}</p>}
            <Button onClick={handleCashout} loading={cashoutLoading} size="sm" className="w-full">
              Submit cashout request
            </Button>
          </div>
        )}
      </div>

      {/* Pricing editor */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Set your prices</p>
            <p className="mt-0.5 text-xs text-muted">Set prices above the base price to earn more per sale.</p>
          </div>
          <button onClick={togglePricing} className="text-xs text-brand font-medium shrink-0 ml-3">
            {showPricing ? 'Close' : 'Edit'}
          </button>
        </div>

        {showPricing && (
          <div className="mt-4 space-y-6">
            {bundlesLoading && bundles.length === 0 && <p className="text-xs text-muted">Loading bundles...</p>}
            {bundlesError && (
              <div className="rounded-2xl bg-red-500/10 p-3 text-xs text-red-500">
                <p className="font-medium">Couldn’t load your bundles</p>
                <p className="mt-0.5">{bundlesError}</p>
                <button onClick={loadBundles} className="mt-2 font-semibold underline">Try again</button>
              </div>
            )}
            {!bundlesLoading && !bundlesError && bundles.length === 0 && (
              <p className="text-xs text-muted">No bundles available right now.</p>
            )}
            {Object.entries(networkGroups).map(([net, netBundles]) => (
              <div key={net}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {net.replace(/_/g, ' ')}
                </p>
                <div className="space-y-2">
                  {netBundles.map((b) => {
                    const key = bundleKeyOf(b)
                    const fb = fees[key]
                    return (
                      <div key={key}>
                        <p className="mb-0.5 text-[10px] text-muted">
                          Suggested: {formatCedis(Math.round((b.basePrice ?? b.sellPrice) * 1.1 * 10) / 10)}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="w-16 shrink-0 text-xs text-muted">{b.name?.match(/\d+GB/i)?.[0] || b.name}</span>
                          <span className="text-xs text-muted">Min: {formatCedis(b.basePrice || b.sellPrice)}</span>
                          <input
                            type="number"
                            step="0.01"
                            placeholder={String(b.sellPrice)}
                            value={customPrices[key] || ''}
                            onChange={(e) => onPriceChange(key, e.target.value, b)}
                            className="w-24 rounded-xl border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-brand"
                          />
                          <button
                            onClick={() => savePrice(key, b.basePrice || b.sellPrice)}
                            disabled={savingKey === key}
                            className="rounded-xl bg-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                          >
                            {savingKey === key ? '...' : saveSuccess === key ? '✓' : 'Save'}
                          </button>
                        </div>
                        {feesLoading[key] && <p className="mt-1 text-[11px] text-muted">Calculating…</p>}
                        {fb && fb.belowFloor && (
                          <p className="mt-1 text-[11px] font-semibold text-red-500">
                            {formatCedis(fb.floorPrice)} minimum — can’t sell below easy’s price
                          </p>
                        )}
                        {fb && !fb.belowFloor && (
                          <div className="mt-1.5 space-y-0.5 rounded-xl bg-surface/70 p-2.5 text-[11px]">
                            <div className="flex justify-between"><span>Your selling price</span><span className="tnum">{formatCedis(fb.agentPrice)}</span></div>
                            <div className="flex justify-between text-muted"><span>Platform fee (5.5%)</span><span className="tnum">+{formatCedis(fb.platformFee)}</span></div>
                            <div className="flex justify-between text-muted"><span>Transaction fee</span><span className="tnum">+{formatCedis(fb.transactionFee)}</span></div>
                            <div className="flex justify-between border-t border-border pt-0.5 font-semibold"><span>Customer pays</span><span className="tnum">{formatCedis(fb.customerPays)}</span></div>
                            <div className="mt-1 flex justify-between text-muted"><span>easy base price</span><span className="tnum">−{formatCedis(fb.easyWholesale)}</span></div>
                            <div className="flex justify-between text-muted"><span>Your 50% margin</span><span className="tnum">+{formatCedis(fb.agentEarnings)}</span></div>
                            <div className="flex justify-between text-muted"><span>easy’s 50%</span><span className="tnum">+{formatCedis(fb.easyEarnings)}</span></div>
                            <div className="flex justify-between border-t border-border pt-0.5 font-semibold"><span>Your earnings this sale</span><span className="tnum text-brand">{formatCedis(fb.agentEarnings)}</span></div>
                            <div className="flex justify-between text-muted"><span>Withdrawal fee</span><span className="tnum text-brand">Free ✓</span></div>
                            <div className="flex justify-between font-semibold"><span>You receive</span><span className="tnum text-brand">{formatCedis(fb.agentTakeHome)} (full amount)</span></div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-muted">Share your link — you earn on every sale.</p>
    </Page>
  )
}