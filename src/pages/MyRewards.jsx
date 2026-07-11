import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import { friendlyError } from '../lib/errors.js'
import Button from '../components/Button.jsx'
import { getProfile, saveProfile } from '../lib/store.js'
import { formatCedis, isValidGhPhone, normalizePhone, prettyPhone } from '../lib/format.js'
import { CopyIcon, GiftIcon, ShareIcon, UsersIcon } from '../components/icons.jsx'

const BASE = 'https://api.getflashx.com'
// Mirrors the backend REFERRAL_CASH_* limits (the server is authoritative).
const CASH_RATE = 4
const CASH_MIN_POINTS = 25
const CASH_MAX_POINTS = 150
const CASH_MIN_GHS = (CASH_MIN_POINTS / 10) * CASH_RATE
const POINTS_PER_GB = 10

const inp =
  'w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors border-border focus:border-brand'

export default function MyRewards() {
  const [phone, setPhone] = useState(() => getProfile().phone || '')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')
  const [network, setNetwork] = useState('mtn')
  const [redeeming, setRedeeming] = useState('')
  const [redeemMsg, setRedeemMsg] = useState('')

  const fetchRewards = async (raw) => {
    const res = await fetch(`${BASE}/gheasy/referrer/${encodeURIComponent(normalizePhone(raw))}`)
    const d = await res.json().catch(() => ({}))
    if (!d.success) throw new Error(d.error || 'Could not load your rewards.')
    return d
  }

  const lookup = async (e) => {
    e?.preventDefault()
    setError('')
    setRedeemMsg('')
    if (!isValidGhPhone(phone)) {
      setError('Enter a valid Ghana number.')
      return
    }
    setLoading(true)
    try {
      const d = await fetchRewards(phone)
      setData(d)
      saveProfile({ phone: normalizePhone(phone) })
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setLoading(false)
    }
  }

  // Auto-load if we already know the customer's phone.
  useEffect(() => {
    if (isValidGhPhone(phone)) lookup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const reload = async () => {
    try { setData(await fetchRewards(phone)) } catch { /* keep current */ }
  }

  const code = data?.referralCode
  const link = data?.referralLink || (code ? `https://gheasy.com/?ref=${code}` : '')
  const points = data?.points ?? 0
  const pendingPoints = data?.pendingPoints ?? 0
  const totalReferred = data?.totalReferred ?? 0
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

  const redeemData = async () => {
    setRedeeming('data')
    setRedeemMsg('')
    try {
      const res = await fetch(`${BASE}/gheasy/referrer/redeem-data`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), network, gb: 1 }),
      })
      const d = await res.json().catch(() => ({})).catch(() => ({}))
      if (!d.success) throw new Error(d.error || 'Could not redeem.')
      setRedeemMsg(d.message || 'Your data is on the way.')
      await reload()
    } catch (e) { setRedeemMsg(friendlyError(e)) } finally { setRedeeming('') }
  }
  const redeemCash = async () => {
    setRedeeming('cash')
    setRedeemMsg('')
    try {
      const res = await fetch(`${BASE}/gheasy/referrer/redeem-cash`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: normalizePhone(phone), points: cashPoints }),
      })
      const d = await res.json().catch(() => ({})).catch(() => ({}))
      if (!d.success) throw new Error(d.error || 'Could not redeem.')
      setRedeemMsg(d.message || 'Your cash request was submitted.')
      await reload()
    } catch (e) { setRedeemMsg(friendlyError(e)) } finally { setRedeeming('') }
  }

  return (
    <Page className="wrap-app pb-12 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">My Rewards</h1>
      <p className="mt-1 text-sm text-muted">Check your referral points by phone number — no login needed.</p>

      <form onSubmit={lookup} className="mt-5 flex gap-2">
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="numeric"
          autoComplete="tel"
          placeholder="024 123 4567"
          className={inp}
        />
        <Button type="submit" loading={loading}>Check</Button>
      </form>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

      {data && !data.found && (
        <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/60 p-7 text-center">
          <GiftIcon className="mx-auto h-7 w-7 text-brand" />
          <p className="mt-2 text-sm font-semibold">No rewards yet for this number</p>
          <p className="mt-1 text-xs text-muted">Buy data on easy and you’ll get a referral code to share — earn points on every friend who buys.</p>
          <Button to="/buy-data" className="mt-4">Buy Data</Button>
        </div>
      )}

      {data && data.found && (
        <>
          <div className="mt-6 rounded-3xl border border-border bg-card p-6 text-center shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your referral code</p>
            <p className="mt-2 font-display text-3xl font-bold tracking-wide text-brand">{code}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => copy(code, 'code')} icon={<CopyIcon className="h-4 w-4" />}>
                {copied === 'code' ? 'Copied!' : 'Copy code'}
              </Button>
              <Button onClick={share} icon={<ShareIcon className="h-4 w-4" />}>Share &amp; earn</Button>
            </div>
            <button onClick={() => copy(link, 'link')} className="mt-4 break-all text-xs text-muted transition-colors hover:text-brand">
              {link}{copied === 'link' ? ' · Copied!' : ''}
            </button>
          </div>

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

          <p className="mt-4 text-center text-xs text-muted">
            Want to refer more friends?{' '}
            <Link to="/buy-data" className="font-semibold text-brand">Buy & share</Link>
          </p>
        </>
      )}
    </Page>
  )
}
