import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import { friendlyError } from '../lib/errors.js'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { fetchCustomerMe, fetchCustomerOrders, upgradeToAgent } from '../lib/api.js'
import {
  AGENT_FEE,
  firstName,
  formatCedis,
  getNetwork,
  isValidGhPhone,
  normalizePhone,
  prettyPhone,
} from '../lib/format.js'
import {
  clearCustomerSession,
  getAgentSession,
  getCustomerSession,
} from '../lib/store.js'
import { track } from '../lib/analytics.js'
import { AlertIcon, BriefcaseIcon, CopyIcon, GiftIcon, ReceiptIcon, ShareIcon, UsersIcon } from '../components/icons.jsx'

const BASE = 'https://api.getflashx.com'
// Mirrors the backend REFERRAL_CASH_* limits (the server stays authoritative).
const CASH_RATE = 4
const CASH_MIN_POINTS = 25
const CASH_MAX_POINTS = 150
const CASH_MIN_GHS = (CASH_MIN_POINTS / 10) * CASH_RATE
const POINTS_PER_GB = 10

const inp =
  'w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors border-border focus:border-brand'

function StatusBadge({ status }) {
  const s = String(status || '').toLowerCase()
  const tone = /success|delivered|complete/.test(s)
    ? 'bg-brand/10 text-brand'
    : /fail|cancel|refund|revers/.test(s)
      ? 'bg-red-500/10 text-red-500'
      : 'bg-amber-500/10 text-amber-500'
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>{s || 'pending'}</span>
}

export default function Account() {
  const navigate = useNavigate()
  const [session] = useState(() => getCustomerSession())
  const token = session?.token

  const [me, setMe] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [copied, setCopied] = useState('')
  const [network, setNetwork] = useState('mtn')
  const [redeeming, setRedeeming] = useState('')
  const [redeemMsg, setRedeemMsg] = useState('')

  const [showUpgrade, setShowUpgrade] = useState(false)
  const [upForm, setUpForm] = useState({ storeName: '', supportWhatsapp: '' })
  const [upLoading, setUpLoading] = useState(false)
  const [upError, setUpError] = useState('')

  // Route guard: agents go to the dashboard; logged-out users to login.
  useEffect(() => {
    if (getAgentSession()) { navigate('/dashboard', { replace: true }); return }
    if (!getCustomerSession()) { navigate('/login', { replace: true }) }
  }, [navigate])

  const load = async () => {
    if (!token) return
    try {
      const data = await fetchCustomerMe(token)
      setMe(data)
    } catch (e) {
      if (e.status === 401) { clearCustomerSession(); navigate('/login', { replace: true }); return }
      setError(friendlyError(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    fetchCustomerOrders(token).then(setOrders).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!session) return null

  const phone = session.customer?.phoneNumber || me?.customer?.phoneNumber || ''
  const name = me?.customer?.name || session.customer?.name || ''
  const code = me?.referral?.referralCode
  const link = code ? `https://gheasy.com/?ref=${code}` : ''
  const points = me?.referral?.points ?? 0
  const pendingPoints = me?.referral?.pendingPoints ?? 0
  const totalReferred = me?.referral?.totalReferred ?? 0
  const upgraded = me?.customer?.upgradedToAgent

  const canRedeemData = points >= POINTS_PER_GB
  const canRedeemCash = points >= CASH_MIN_POINTS
  const cashPoints = Math.min(points, CASH_MAX_POINTS)
  const cashValue = (cashPoints / 10) * CASH_RATE

  const copy = async (text, what) => {
    try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(''), 1500) } catch { /* blocked */ }
  }
  const share = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Join me on easy', text: `Use my code ${code} on easy`, url: link }) } catch { /* cancelled */ }
    } else copy(link, 'link')
  }

  const logout = () => { clearCustomerSession(); navigate('/') }

  const redeemData = async () => {
    setRedeeming('data'); setRedeemMsg('')
    try {
      const res = await fetch(`${BASE}/gheasy/referrer/redeem-data`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), network, gb: 1 }),
      })
      const d = await res.json().catch(() => ({}))
      if (!d.success) throw new Error(d.error || 'Could not redeem.')
      setRedeemMsg(d.message || 'Your data is on the way.')
      await load()
    } catch (e) { setRedeemMsg(friendlyError(e)) } finally { setRedeeming('') }
  }
  const redeemCash = async () => {
    setRedeeming('cash'); setRedeemMsg('')
    try {
      const res = await fetch(`${BASE}/gheasy/referrer/redeem-cash`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), points: cashPoints }),
      })
      const d = await res.json().catch(() => ({}))
      if (!d.success) throw new Error(d.error || 'Could not redeem.')
      setRedeemMsg(d.message || 'Your cash request was submitted.')
      await load()
    } catch (e) { setRedeemMsg(friendlyError(e)) } finally { setRedeeming('') }
  }

  const submitUpgrade = async () => {
    setUpError('')
    if (!upForm.storeName.trim()) { setUpError('Enter a store name.'); return }
    if (!isValidGhPhone(upForm.supportWhatsapp)) { setUpError('Enter a valid WhatsApp support number.'); return }
    setUpLoading(true)
    try {
      const data = await upgradeToAgent({
        token,
        storeName: upForm.storeName.trim(),
        supportWhatsapp: normalizePhone(upForm.supportWhatsapp),
      })
      track('customer_upgrade_initiated', {})
      if (!data.paymentUrl) throw new Error('No payment link was returned. Please try again.')
      window.location.href = data.paymentUrl
    } catch (e) {
      setUpError(friendlyError(e, 'Could not start the upgrade. Please try again.'))
      setUpLoading(false)
    }
  }

  return (
    <Page className="wrap-app pb-16 pt-6">
      <Seo title="My account | easy" noindex />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">My account</p>
          <h1 className="font-display text-2xl font-bold tracking-tight">Hi{name ? `, ${firstName(name)}` : ''} 👋</h1>
          <p className="mt-0.5 text-xs text-muted">{prettyPhone(normalizePhone(phone))}</p>
        </div>
        <button onClick={logout} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg">
          Log out
        </button>
      </div>

      {loading && <p className="mt-8 text-sm text-muted">Loading your account…</p>}
      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

      {!loading && me && (
        <>
          {upgraded && (
            <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-brand/30 bg-brand/[0.07] p-3.5 text-sm">
              <BriefcaseIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <span>You’ve upgraded to an agent. <Link to="/login" className="font-semibold text-brand">Log in</Link> to access your store dashboard.</span>
            </div>
          )}

          {/* Referral code */}
          <div className="mt-5 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your referral code</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-wide text-brand">{code || '—'}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => copy(code, 'code')} icon={<CopyIcon className="h-4 w-4" />}>
                {copied === 'code' ? 'Copied!' : 'Copy code'}
              </Button>
              <Button onClick={share} icon={<ShareIcon className="h-4 w-4" />}>Share &amp; earn</Button>
            </div>
            {link && (
              <button onClick={() => copy(link, 'link')} className="mt-4 break-all text-xs text-muted transition-colors hover:text-brand">
                {link}{copied === 'link' ? ' · Copied!' : ''}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <GiftIcon className="mx-auto h-5 w-5 text-brand" />
              <p className="mt-1 text-xs text-muted">Points</p>
              <p className="font-display text-2xl font-bold">{points}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <UsersIcon className="mx-auto h-5 w-5 text-brand" />
              <p className="mt-1 text-xs text-muted">Referred</p>
              <p className="font-display text-2xl font-bold">{totalReferred}</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="mt-1 text-xs text-muted">In review</p>
              <p className="font-display text-2xl font-bold">{pendingPoints}</p>
              <p className="text-[10px] leading-tight text-muted">cash pending</p>
            </div>
          </div>

          {/* Redeem */}
          <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-sm font-bold">Redeem your points</h3>
            <p className="mt-0.5 text-xs text-muted">
              {POINTS_PER_GB} points = 1GB data · or cash at {formatCedis(CASH_RATE)} per 10 points (min {formatCedis(CASH_MIN_GHS)} = {CASH_MIN_POINTS} points).
            </p>
            {redeemMsg ? (
              <p className="mt-4 rounded-2xl bg-brand/10 p-3 text-sm font-medium text-brand">{redeemMsg}</p>
            ) : (
              <>
                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold text-muted">Network (data is sent to YOUR number)</label>
                  <select value={network} onChange={(e) => setNetwork(e.target.value)} className={inp}>
                    <option value="mtn">MTN</option>
                    <option value="telecel">Telecel</option>
                    <option value="airteltigo_ishare">AirtelTigo</option>
                  </select>
                  <p className="mt-1 text-[11px] text-muted">Reward data always goes to {prettyPhone(normalizePhone(phone))} — it can’t be sent elsewhere.</p>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button variant="secondary" disabled={!canRedeemData || !!redeeming} loading={redeeming === 'data'} onClick={redeemData}>
                    1GB Data ({POINTS_PER_GB} pts)
                  </Button>
                  <Button disabled={!canRedeemCash || !!redeeming} loading={redeeming === 'cash'} onClick={redeemCash}>
                    {canRedeemCash ? `Cash · ${formatCedis(cashValue)}` : `Cash · min ${formatCedis(CASH_MIN_GHS)}`}
                  </Button>
                </div>
                {!canRedeemData && (
                  <p className="mt-3 text-center text-xs text-muted">Earn {POINTS_PER_GB - points} more point{POINTS_PER_GB - points === 1 ? '' : 's'} to redeem 1GB of data.</p>
                )}
                {canRedeemData && !canRedeemCash && (
                  <p className="mt-3 text-center text-xs text-muted">Cash redemption starts at {formatCedis(CASH_MIN_GHS)} ({CASH_MIN_POINTS} points).</p>
                )}
              </>
            )}
          </div>

          {/* Order history */}
          <div className="mt-6">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold"><ReceiptIcon className="h-4 w-4 text-brand" /> Your orders</h3>
            {orders.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border bg-card/60 p-5 text-center text-xs text-muted">
                No orders yet. <Link to="/buy-data" className="font-semibold text-brand">Buy data</Link> to get started.
              </p>
            ) : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.reference} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{o.bundleName || (o.network || '').toUpperCase()}</p>
                      <p className="truncate text-[11px] text-muted">{o.reference}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-sm font-bold tnum">{formatCedis(o.amount)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upgrade to agent */}
          {!upgraded && (
            <div className="mt-6 rounded-3xl border border-brand/30 bg-brand/[0.06] p-5 shadow-card">
              <div className="flex items-start gap-2.5">
                <BriefcaseIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-sm font-bold">Become an agent</p>
                  <p className="mt-0.5 text-xs text-muted">
                    Get your own store, set custom prices, and earn on every sale — for a one-time {formatCedis(AGENT_FEE)}. You keep your code and all {points} points.
                  </p>
                </div>
              </div>

              {!showUpgrade ? (
                <Button onClick={() => setShowUpgrade(true)} className="mt-4 w-full">Upgrade for {formatCedis(AGENT_FEE)}</Button>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">Store name</label>
                    <input value={upForm.storeName} onChange={(e) => setUpForm((f) => ({ ...f, storeName: e.target.value }))} placeholder="e.g. Ama Data Hub" className={inp} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted">WhatsApp support number</label>
                    <input value={upForm.supportWhatsapp} onChange={(e) => setUpForm((f) => ({ ...f, supportWhatsapp: e.target.value }))} inputMode="numeric" placeholder="024 123 4567" className={inp} />
                  </div>
                  {upError && <p className="text-xs text-red-500">{upError}</p>}
                  <Button onClick={submitUpgrade} loading={upLoading} className="w-full">Pay {formatCedis(AGENT_FEE)} &amp; activate store</Button>
                  <p className="text-center text-[11px] text-muted">Your referral points and code carry over — nothing is lost.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </Page>
  )
}
