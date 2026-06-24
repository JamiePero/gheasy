import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import { getAgentSession, getProfile, getReferralCode, saveProfile } from '../lib/store.js'
import { formatCedis, isValidGhPhone } from '../lib/format.js'
import { fetchReferralByPhone } from '../lib/api.js'
import { track } from '../lib/analytics.js'
import {
  ArrowLeftIcon,
  ClockIcon,
  CopyIcon,
  GiftIcon,
  ShareIcon,
  UsersIcon,
} from '../components/icons.jsx'

const inp = (err) =>
  `w-full rounded-2xl border bg-card px-3.5 py-3 text-[15px] font-medium text-fg outline-none transition-colors placeholder:font-normal placeholder:text-muted/50 ${
    err ? 'border-red-400' : 'border-border focus:border-brand'
  }`

const hasAccount = (p) => Boolean(p.name?.trim() && isValidGhPhone(p.phone))

// Referral CASH redemption — mirrors the backend REFERRAL_CASH_* limits (the
// server is authoritative and re-checks on redemption).
const CASH_RATE = 4 // ₵ per 10 points
const CASH_MIN_POINTS = 25 // ₵10 minimum redemption
const CASH_MAX_POINTS = 150 // ₵60 per-request cap
const CASH_MIN_GHS = (CASH_MIN_POINTS / 10) * CASH_RATE // ₵10
const CASH_MAX_GHS = (CASH_MAX_POINTS / 10) * CASH_RATE // ₵60

function AccountGate({ onDone }) {
  const [form, setForm] = useState(() => {
    const p = getProfile()
    return { name: p.name || '', phone: p.phone || '', email: p.email || '' }
  })
  const [tried, setTried] = useState(false)
  const phoneOk = isValidGhPhone(form.phone)
  const valid = form.name.trim() && phoneOk
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    setTried(true)
    if (!valid) return
    saveProfile({
      name: form.name.trim(),
      phone: form.phone,
      ...(form.email.trim() ? { email: form.email.trim() } : {}),
    })
    track('account_created', {})
    onDone()
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10 text-brand">
        <GiftIcon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-xl font-bold">Create your account</h2>
      <p className="mt-1 text-sm text-muted">
        Set up a free account so your referral rewards can be tracked and paid to you.
      </p>
      <form onSubmit={submit} className="mt-5 space-y-4">
        <div>
          <label className="mb-2 block text-sm font-semibold">Full name</label>
          <input value={form.name} onChange={set('name')} placeholder="Your full name" className={inp(tried && !form.name.trim())} />
          {tried && !form.name.trim() && <p className="mt-1.5 text-xs text-red-500">Required</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Phone number</label>
          <input value={form.phone} onChange={set('phone')} inputMode="numeric" placeholder="024 123 4567" className={inp(tried && !phoneOk)} />
          {tried && !phoneOk && <p className="mt-1.5 text-xs text-red-500">Enter a valid Ghana number.</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">
            Email <span className="font-normal text-muted">(optional)</span>
          </label>
          <input value={form.email} onChange={set('email')} type="email" placeholder="you@email.com" className={inp(false)} />
        </div>
        <Button type="submit" size="lg" className="w-full">
          Create account &amp; start earning
        </Button>
        <p className="text-center text-xs text-muted">No password needed — saved securely on your device.</p>
      </form>
    </div>
  )
}

function ReferContent({ agent }) {
  const phone = agent?.phoneNumber || getProfile().phone || ''
  const [refData, setRefData] = useState(null)
  // Fallback code shown while the backend loads, or for users without a shared
  // users doc. Real code (and points) come from fetchReferralByPhone below.
  const [localCode] = useState(() => (agent ? agent.agentId : getReferralCode()))
  const [copied, setCopied] = useState('')

  // Pull the user's real referral data (points, code, referrals) from the shared
  // backend, keyed by phone — Gheasy is no-login so it has no users doc id.
  useEffect(() => {
    if (!phone) return
    let alive = true
    fetchReferralByPhone(phone)
      .then((data) => {
        if (alive) setRefData(data)
      })
      .catch(() => {
        /* keep defaults (0 points, local code) on failure */
      })
    return () => {
      alive = false
    }
  }, [phone])

  const code = refData?.referralCode || localCode
  const link = `https://gheasy.com/?ref=${code}`

  const copy = async (text, what) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      /* clipboard blocked */
    }
  }

  const share = async () => {
    track('refer_shared', { code })
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join me on easy', text: `Use my code ${code} on easy`, url: link })
      } catch {
        /* cancelled */
      }
    } else {
      copy(link, 'link')
    }
  }

  const points = refData?.points ?? 0
  const totalReferrals = refData?.totalReferrals ?? 0
  const referrals = refData?.referrals ?? []
  const pendingCount = referrals.filter((r) => r.status !== 'credited').length
  const goal = 10
  const stats = [
    { Icon: GiftIcon, label: 'Points', value: points },
    { Icon: UsersIcon, label: 'Friends', value: totalReferrals, sub: 'referred' },
    { Icon: ClockIcon, label: 'Pending', value: pendingCount, sub: 'awaiting purchase' },
  ]

  // Redemption. 1GB data reward = 10 points. Cash = ₵4 per 10 points, with a
  // ₵10 (25-point) minimum and ₵60 (150-point) per-request cap — enforced by the
  // server; mirrored here so users don't tap into an error.
  const canRedeem = points >= goal
  const cashPoints = Math.min(points, CASH_MAX_POINTS)
  const cashValue = (cashPoints / 10) * CASH_RATE
  const canRedeemCash = points >= CASH_MIN_POINTS
  const [redeeming, setRedeeming] = useState('')
  const [redeemMsg, setRedeemMsg] = useState('')
  const redeemCash = async () => {
    setRedeeming('cash')
    setRedeemMsg('')
    try {
      const res = await fetch('https://api.getflashx.com/gheasy/redeem-cash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, points: cashPoints, userId: code }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Request failed')
      setRedeemMsg(data.message || 'Your cash redemption request has been submitted.')
    } catch (e) {
      setRedeemMsg(e.message || 'Could not submit your request. Please try again.')
    } finally {
      setRedeeming('')
    }
  }

  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-card">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your referral code</p>
        <p className="mt-2 font-display text-3xl font-bold tracking-wide text-brand">{code}</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => copy(code, 'code')} icon={<CopyIcon className="h-4 w-4" />}>
            {copied === 'code' ? 'Copied!' : 'Copy code'}
          </Button>
          <Button onClick={share} icon={<ShareIcon className="h-4 w-4" />}>
            Share link
          </Button>
        </div>
        <button onClick={() => copy(link, 'link')} className="mt-4 break-all text-xs text-muted transition-colors hover:text-brand">
          {link}
          {copied === 'link' ? ' · Copied!' : ''}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 text-center">
            <s.Icon className="mx-auto h-5 w-5 text-brand" />
            <p className="mt-1 text-xs text-muted">{s.label}</p>
            <p className="font-display text-2xl font-bold">{s.value}</p>
            {s.sub && <p className="text-[10px] leading-tight text-muted">{s.sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm">
          <span className="font-bold">{points}</span> <span className="text-muted">/ {goal} points to redeem</span>
        </p>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${Math.min(100, (points / goal) * 100)}%` }} />
        </div>
        <p className="mt-3 text-sm text-muted">
          {canRedeem ? (
            <>
              You have enough points — redeem <span className="font-semibold text-fg">1GB free data</span> below.
            </>
          ) : (
            <>
              Earn {goal - points} more points to get <span className="font-semibold text-fg">1GB free data</span>.
            </>
          )}
        </p>
        <p className="mt-2 text-xs text-muted">
          Points are credited when your referred friend makes their first purchase. 10 points = 1GB.
        </p>
      </div>

      {/* Redeem rewards — 1GB data or its cash value */}
      <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
        <h3 className="text-sm font-bold">Redeem your points</h3>
        <p className="mt-0.5 text-xs text-muted">
          10 points = 1GB data · or cash at {formatCedis(CASH_RATE)} per 10 points (min {formatCedis(CASH_MIN_GHS)} = {CASH_MIN_POINTS} points).
        </p>
        {redeemMsg ? (
          <p className="mt-4 rounded-2xl bg-brand/10 p-3 text-sm font-medium text-brand">{redeemMsg}</p>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                disabled={!canRedeem || !!redeeming}
                onClick={() =>
                  setRedeemMsg('Your 1GB data reward request has been submitted and is being processed.')
                }
              >
                Redeem 1GB Data
              </Button>
              <Button disabled={!canRedeemCash || !!redeeming} loading={redeeming === 'cash'} onClick={redeemCash}>
                {canRedeemCash ? `Cash · ${formatCedis(cashValue)}` : `Cash · min ${formatCedis(CASH_MIN_GHS)}`}
              </Button>
            </div>
            {!canRedeemCash ? (
              <p className="mt-3 text-center text-xs text-muted">
                Cash redemption starts at <span className="font-semibold text-fg">{formatCedis(CASH_MIN_GHS)}</span> ({CASH_MIN_POINTS} points).
                {' '}Earn {Math.max(0, CASH_MIN_POINTS - points)} more point{CASH_MIN_POINTS - points === 1 ? '' : 's'} to cash out.
              </p>
            ) : points > CASH_MAX_POINTS ? (
              <p className="mt-3 text-center text-xs text-muted">
                Up to <span className="font-semibold text-fg">{formatCedis(CASH_MAX_GHS)}</span> ({CASH_MAX_POINTS} points) per request — redeem the rest next time.
              </p>
            ) : null}
          </>
        )}
      </div>

      <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-muted">Your referrals</h2>
      {referrals.length === 0 ? (
        <div className="mt-3 rounded-3xl border border-dashed border-border bg-card/60 p-7 text-center">
          <p className="text-sm text-muted">No referrals yet — share your code!</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {referrals.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-card p-3 text-sm"
            >
              <span className="font-medium text-fg">{r.referredPhone}</span>
              <span
                className={`text-xs font-semibold ${r.status === 'credited' ? 'text-brand' : 'text-amber-500'}`}
              >
                {r.status === 'credited' ? `+${r.points} pts` : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function Refer() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(() => getProfile())
  // Agents register through the agent system (separate session), not the local
  // profile flow — treat a logged-in agent as an already-registered referrer.
  const agent = getAgentSession()?.agent || null
  const registered = Boolean(agent) || hasAccount(profile)

  return (
    <Page className="wrap-app pb-12 pt-6">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-fg"
      >
        <ArrowLeftIcon className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Refer a Friend</h1>
      <p className="text-sm text-muted">Earn data when friends join easy</p>

      <div className="mt-6">
        {registered ? <ReferContent agent={agent} /> : <AccountGate onDone={() => setProfile(getProfile())} />}
      </div>
    </Page>
  )
}
