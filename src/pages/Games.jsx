import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { getAgentSession, getCustomerSession } from '../lib/store.js'
import { normalizePhone, prettyPhone } from '../lib/format.js'
import { AlertIcon, GiftIcon } from '../components/icons.jsx'

const BASE = 'https://api.getflashx.com'

// Wheel geometry — 5 segments × 72°, order MUST match the server's prize list.
// Fixed physical colors (a wheel is a "real object": same in light & dark).
const SEGMENTS = [
  { mb: 0, label: 'MISS', fill: '#26382c', ink: '#9fb8a8' },
  { mb: 100, label: '100MB', fill: '#14532D', ink: '#ffffff' },
  { mb: 200, label: '200MB', fill: '#166534', ink: '#ffffff' },
  { mb: 300, label: '300MB', fill: '#15803D', ink: '#ffffff' },
  { mb: 1000, label: '1GB', fill: '#22C55E', ink: '#052e16' },
]
const SEG = 360 / SEGMENTS.length
const CX = 140, CY = 140, R = 132

// Angle in degrees clockwise from 12 o'clock → point on the rim.
function polar(angle, radius = R) {
  const rad = ((angle - 90) * Math.PI) / 180
  return [CX + radius * Math.cos(rad), CY + radius * Math.sin(rad)]
}
function wedgePath(i) {
  const [x1, y1] = polar(i * SEG)
  const [x2, y2] = polar((i + 1) * SEG)
  return `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`
}

function Wheel({ rotation, spinning }) {
  return (
    <div className="relative mx-auto h-[280px] w-[280px]">
      {/* Pointer — fixed, wheel rotates beneath it */}
      <svg viewBox="0 0 40 30" className="absolute -top-1 left-1/2 z-10 h-[30px] w-10 -translate-x-1/2">
        <path d="M20 28 L8 4 H32 Z" fill="#22C55E" stroke="#052e16" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div
        className="h-full w-full rounded-full shadow-card"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 280 280" className="h-full w-full">
          <circle cx={CX} cy={CY} r={R + 5} fill="#0a1f12" />
          {SEGMENTS.map((s, i) => (
            <path key={s.mb} d={wedgePath(i)} fill={s.fill} stroke="#0a1f12" strokeWidth="2.5" />
          ))}
          {SEGMENTS.map((s, i) => {
            const mid = i * SEG + SEG / 2
            const [x, y] = polar(mid, 90)
            return (
              <text
                key={`t-${s.mb}`}
                x={x}
                y={y}
                fill={s.ink}
                fontSize="17"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="middle"
                transform={`rotate(${mid} ${x} ${y})`}
                style={{ fontFamily: 'inherit', letterSpacing: '0.02em' }}
              >
                {s.label}
              </text>
            )
          })}
          <circle cx={CX} cy={CY} r="27" fill="#050f05" stroke="#22C55E" strokeWidth="2.5" />
          <text x={CX} y={CY + 1} fill="#22C55E" fontSize="15" fontWeight="800" textAnchor="middle" dominantBaseline="middle">
            easy
          </text>
        </svg>
      </div>
    </div>
  )
}

export default function Games() {
  // Either tier plays — customer session first, then agent.
  const auth = useMemo(() => {
    const c = getCustomerSession()
    if (c?.token) return { headers: { 'x-customer-token': c.token } }
    const a = getAgentSession()
    if (a?.token) return { headers: { 'x-agent-token': a.token } }
    return null
  }, [])

  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(!!auth)
  const [error, setError] = useState('')
  const [rot, setRot] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null) // MB of the revealed outcome
  const [network, setNetwork] = useState('mtn')
  const [redeeming, setRedeeming] = useState(false)
  const [redeemMsg, setRedeemMsg] = useState('')
  const revealTimer = useRef(null)

  const loadMe = async () => {
    try {
      const res = await fetch(`${BASE}/gheasy/wheel/me`, { headers: auth.headers })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Could not load your spins.')
      setMe(d)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (auth) loadMe()
    return () => clearTimeout(revealTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const spin = async () => {
    if (spinning || !me || me.spins <= 0 || me.paused) return
    setResult(null)
    setRedeemMsg('')
    setError('')
    try {
      // Server decides the outcome BEFORE any animation — the wheel just plays it.
      const res = await fetch(`${BASE}/gheasy/wheel/spin`, { method: 'POST', headers: auth.headers })
      const d = await res.json()
      if (!d.success) {
        if (d.paused) setMe((m) => (m ? { ...m, paused: true } : m))
        throw new Error(d.error || 'Could not spin.')
      }
      const k = SEGMENTS.findIndex((s) => s.mb === d.outcomeMB)
      const jitter = Math.floor(Math.random() * 48) - 24 // visual only — result is fixed
      const base = rot - (rot % 360)
      setSpinning(true)
      setRot(base + 5 * 360 + ((360 - (k * SEG + SEG / 2)) % 360) + jitter)
      revealTimer.current = setTimeout(() => {
        setSpinning(false)
        setResult(d.outcomeMB)
        setMe((m) => (m ? { ...m, spins: d.spins, accumulatedMB: d.accumulatedMB, canRedeem: d.canRedeem } : m))
      }, 4300)
    } catch (e) {
      setSpinning(false)
      setError(e.message)
    }
  }

  const redeem = async () => {
    setRedeeming(true)
    setRedeemMsg('')
    try {
      const res = await fetch(`${BASE}/gheasy/wheel/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body: JSON.stringify({ network }),
      })
      const d = await res.json()
      if (!d.success) throw new Error(d.error || 'Could not redeem.')
      setRedeemMsg(d.message || 'Your 1GB is on its way!')
      await loadMe()
    } catch (e) {
      setRedeemMsg(e.message)
    } finally {
      setRedeeming(false)
    }
  }

  // ── Logged out — pitch (no play without an account) ──
  if (!auth) {
    return (
      <Page className="wrap-app pb-16 pt-6">
        <Seo title="easy Games — Spin & Win Free Data | easy" description="Every data purchase on easy earns a free spin. Win up to 1GB — free to play, prizes go straight to your number." />
        <h1 className="font-display text-2xl font-bold tracking-tight">easy Games</h1>
        <p className="mt-1 text-sm text-muted">Spin the wheel, win free data. Every purchase earns a spin.</p>
        <div className="pointer-events-none mt-6 opacity-90">
          <Wheel rotation={18} spinning={false} />
        </div>
        <div className="mt-6 rounded-3xl border border-brand/30 bg-brand/[0.06] p-5 text-center shadow-card">
          <GiftIcon className="mx-auto h-7 w-7 text-brand" />
          <p className="mt-2 text-sm font-bold">Log in to play</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
            easy Games is for easy accounts — free to join. Every data purchase earns 1 free spin, and prizes go to your own number.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button to="/login" variant="secondary">Log in</Button>
            <Button to="/register">Create free account</Button>
          </div>
        </div>
      </Page>
    )
  }

  const spins = me?.spins ?? 0
  const acc = me?.accumulatedMB ?? 0
  const target = me?.redeemAtMB ?? 1000
  const pct = Math.min(100, Math.round((acc / target) * 100))

  return (
    <Page className="wrap-app pb-16 pt-6">
      <Seo title="easy Games — Spin & Win Free Data | easy" noindex />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">easy Games</h1>
          <p className="mt-0.5 text-sm text-muted">Spin free. Win data. No catch.</p>
        </div>
        <span className="rounded-full border border-brand/40 bg-brand/10 px-3.5 py-2 text-sm font-bold text-brand">
          {spins} spin{spins === 1 ? '' : 's'}
        </span>
      </div>

      {loading && <p className="mt-8 text-center text-sm text-muted">Loading your spins…</p>}

      {!loading && (
        <>
          {me?.paused && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber-500/40 bg-amber-500/[0.08] p-3.5 text-sm">
              <AlertIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <span className="text-muted">The wheel is taking a short break. Your spins are safe — check back soon!</span>
            </div>
          )}

          <div className="mt-6">
            <Wheel rotation={rot} spinning={spinning} />
          </div>

          {/* Result */}
          {result !== null && !spinning && (
            <p className={`mt-5 rounded-2xl p-3.5 text-center text-sm font-bold ${result > 0 ? 'bg-brand/10 text-brand' : 'bg-surface text-muted'}`}>
              {result > 0
                ? `🎉 You won ${result === 1000 ? '1GB' : `${result}MB`}! Added to your balance.`
                : 'No win this time — your next purchase earns another spin!'}
            </p>
          )}
          {error && (
            <p className="mt-5 flex items-start justify-center gap-1.5 rounded-2xl bg-red-500/10 p-3 text-center text-xs font-medium text-red-500">
              <AlertIcon className="mt-px h-4 w-4 shrink-0" /> {error}
            </p>
          )}

          {/* Manual spin only — one tap, one spin */}
          <Button
            onClick={spin}
            disabled={spinning || spins <= 0 || !!me?.paused}
            loading={spinning}
            size="lg"
            className="mt-5 w-full"
          >
            {spinning ? 'Spinning…' : spins > 0 ? 'SPIN' : 'No spins left'}
          </Button>
          {spins <= 0 && !spinning && (
            <p className="mt-2 text-center text-xs text-muted">
              Every data purchase earns a free spin.{' '}
              <Link to="/buy-data" className="font-semibold text-brand">Buy data</Link>
            </p>
          )}

          {/* Accumulated balance → redeem at 1GB */}
          <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">Your winnings</p>
              <p className="text-xs font-semibold text-brand tnum">{acc}MB / {target}MB</p>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
            </div>
            {redeemMsg ? (
              <p className="mt-4 rounded-2xl bg-brand/10 p-3 text-sm font-medium text-brand">{redeemMsg}</p>
            ) : me?.canRedeem ? (
              <div className="mt-4 space-y-3">
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3.5 py-3 text-[15px] font-medium text-fg outline-none focus:border-brand"
                >
                  <option value="mtn">MTN</option>
                  <option value="telecel">Telecel</option>
                  <option value="airteltigo_ishare">AirtelTigo</option>
                </select>
                <Button onClick={redeem} loading={redeeming} className="w-full">
                  Redeem 1GB to {prettyPhone(normalizePhone(me?.phone || ''))}
                </Button>
                <p className="text-center text-[11px] text-muted">Prizes always go to YOUR number — they can’t be sent elsewhere.</p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">Reach {target}MB to redeem a real 1GB bundle to your own number.</p>
            )}
          </div>

          {/* Transparent odds — full disclosure before every spin */}
          <div className="mt-4 rounded-3xl border border-border bg-card p-5 shadow-card">
            <p className="text-sm font-bold">The odds — full disclosure</p>
            <div className="mt-3 space-y-1.5">
              {(me?.odds || []).map((o) => (
                <div key={o.mb} className="flex items-center justify-between text-sm">
                  <span className={o.mb === 0 ? 'text-muted' : 'font-semibold'}>
                    {o.mb === 0 ? 'Nothing (miss)' : o.mb === 1000 ? '1GB' : `${o.mb}MB`}
                  </span>
                  <span className="tnum text-muted">{o.chance}%</span>
                </div>
              ))}
            </div>
            <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted">
              Spins are free — earned with data purchases, never bought. One manual tap per spin, no auto-play. Wins accumulate; redeem 1GB to your own number.
            </p>
          </div>
        </>
      )}
    </Page>
  )
}
