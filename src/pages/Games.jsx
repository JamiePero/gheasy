import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import { getAgentSession, getCustomerSession } from '../lib/store.js'
import { normalizePhone, prettyPhone } from '../lib/format.js'
import { AlertIcon, GiftIcon } from '../components/icons.jsx'

const BASE = 'https://api.getflashx.com'

// Wheel geometry — 8 segments × 45°. Outcomes repeat (2× MISS/100MB/200MB) so
// the wheel feels fuller; the SERVER still returns just an outcome MB and the
// client picks one matching segment to land on (visual only). No two adjacent
// segments share a color. Fixed physical colors (same in light & dark).
const SEGMENTS = [
  { mb: 1000, label: '1GB', grad: 'wgold', glow: true }, // jackpot — gold
  { mb: 0, label: 'MISS', grad: 'wred' },
  { mb: 100, label: '100MB', grad: 'wteal' },
  { mb: 200, label: '200MB', grad: 'wgreenL' },
  { mb: 0, label: 'MISS', grad: 'wred' },
  { mb: 100, label: '100MB', grad: 'wteal' },
  { mb: 200, label: '200MB', grad: 'wgreenD' },
  { mb: 300, label: '300MB', grad: 'wpurple' },
]
const SEG = 360 / SEGMENTS.length // 45°
const CX = 140, CY = 140, R = 128

// Radial gradients (lighter at the hub → darker at the rim = convex feel).
// Dark royal jewel tones — metallic gold, crimson, deep teal, emeralds, royal
// purple. [id, center, mid, edge]
const GRADS = [
  ['wgold', '#F7DC6F', '#D4AF37', '#8C6D1F'],
  ['wred', '#EF4444', '#991B1B', '#5C0E0E'],
  ['wteal', '#2CB1CF', '#0E7490', '#0F3D4A'],
  ['wgreenL', '#34D399', '#15803D', '#0B3D20'],
  ['wgreenD', '#22C55E', '#166534', '#07270F'],
  ['wpurple', '#8B5CF6', '#5B21B6', '#3B0F73'],
]

// Embedded glitter — [angle°, radius, scale, opacity, gold?]. Rotates with the
// wheel (sparkles live IN the material), twinkling on staggered delays.
const SPARKLES = [
  [14, 108, 1.0, 0.9, 1], [33, 70, 0.6, 0.7, 0], [58, 112, 0.8, 0.8, 0],
  [79, 62, 0.55, 0.65, 1], [104, 100, 0.9, 0.85, 0], [126, 118, 0.6, 0.7, 0],
  [149, 76, 0.7, 0.75, 1], [170, 106, 1.0, 0.9, 0], [199, 64, 0.55, 0.7, 0],
  [224, 112, 0.75, 0.8, 1], [251, 80, 0.6, 0.7, 0], [274, 104, 0.9, 0.85, 0],
  [299, 118, 0.65, 0.75, 1], [322, 72, 0.8, 0.8, 0], [341, 96, 0.55, 0.7, 0],
]

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
      <style>{`
        @keyframes wheelSonar { 0% { transform: scale(1); opacity: .55 } 70% { transform: scale(1.4); opacity: 0 } 100% { transform: scale(1.4); opacity: 0 } }
        @keyframes wtwinkle { 0%, 100% { opacity: .18 } 50% { opacity: 1 } }
        @keyframes wheelShine { 0% { transform: translateX(-130%) } 55% { transform: translateX(130%) } 100% { transform: translateX(130%) } }
      `}</style>

      {/* Pointer — fixed, wheel rotates beneath it */}
      <svg viewBox="0 0 40 30" className="absolute -top-1 left-1/2 z-20 h-[30px] w-10 -translate-x-1/2" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.5))' }}>
        <path d="M20 28 L8 4 H32 Z" fill="#22C55E" stroke="#052e16" strokeWidth="2" strokeLinejoin="round" />
        <path d="M20 23 L12.5 7.5 H27.5 Z" fill="#4ADE80" opacity="0.55" />
      </svg>

      {/* Rotating wheel */}
      <div
        className="h-full w-full rounded-full"
        style={{
          transform: `rotate(${rotation}deg)`,
          transition: spinning ? 'transform 4.2s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
          willChange: 'transform',
          boxShadow: '0 14px 34px rgba(0,0,0,0.5), 0 3px 10px rgba(0,0,0,0.4)',
        }}
      >
        <svg viewBox="0 0 280 280" className="h-full w-full">
          <defs>
            {GRADS.map(([id, c0, c1, c2]) => (
              <radialGradient key={id} id={id} gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={R}>
                <stop offset="0.14" stopColor={c0} />
                <stop offset="0.55" stopColor={c1} />
                <stop offset="1" stopColor={c2} />
              </radialGradient>
            ))}
            <filter id="wglow" x="-40%" y="-40%" width="180%" height="180%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#FFD700" floodOpacity="0.8" />
            </filter>
          </defs>

          <circle cx={CX} cy={CY} r={R + 2} fill="#08160d" />

          {/* Wedges — gold (jackpot) drawn last so its warm glow sits on top */}
          {SEGMENTS.map((s, i) => (s.glow ? null : <path key={i} d={wedgePath(i)} fill={`url(#${s.grad})`} />))}
          {SEGMENTS.map((s, i) => (s.glow ? <path key={i} d={wedgePath(i)} fill={`url(#${s.grad})`} filter="url(#wglow)" /> : null))}

          {/* Crisp near-white dividers */}
          {SEGMENTS.map((_, i) => {
            const [x1, y1] = polar(i * SEG, 37)
            const [x2, y2] = polar(i * SEG, R)
            return <line key={`d-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(248,250,252,0.9)" strokeWidth="1.3" />
          })}

          {/* Labels — white, bold, dark outline so they read on every color */}
          {SEGMENTS.map((s, i) => {
            const mid = i * SEG + SEG / 2
            const flip = mid > 90 && mid < 270 // keep bottom-half text upright
            const [x, y] = polar(mid, 87)
            return (
              <text
                key={`t-${i}`}
                x={x}
                y={y}
                fill="#ffffff"
                fontSize="13.5"
                fontWeight="800"
                textAnchor="middle"
                dominantBaseline="middle"
                stroke="rgba(0,0,0,0.45)"
                strokeWidth="3"
                paintOrder="stroke"
                transform={`rotate(${flip ? mid + 180 : mid} ${x} ${y})`}
                style={{ fontFamily: 'inherit', letterSpacing: '0.04em' }}
              >
                {s.label}
              </text>
            )
          })}

          {/* Embedded glitter — tiny 4-point stars twinkling in the material */}
          {SPARKLES.map(([a, r, s, o, gold], i) => {
            const [x, y] = polar(a, r)
            return (
              <path
                key={`sp-${i}`}
                d={`M ${x} ${y - 4 * s} L ${x + 1.3 * s} ${y - 1.3 * s} L ${x + 4 * s} ${y} L ${x + 1.3 * s} ${y + 1.3 * s} L ${x} ${y + 4 * s} L ${x - 1.3 * s} ${y + 1.3 * s} L ${x - 4 * s} ${y} L ${x - 1.3 * s} ${y - 1.3 * s} Z`}
                fill={gold ? '#FFE9A0' : '#ffffff'}
                opacity={o}
                style={{ animation: `wtwinkle ${2.2 + (i % 3) * 0.7}s ease-in-out ${(i * 0.31).toFixed(2)}s infinite` }}
              />
            )
          })}

          {/* Beveled rim — dark ring, directional top light, outer edge */}
          <circle cx={CX} cy={CY} r={R + 6.5} fill="none" stroke="#08160d" strokeWidth="11" />
          <circle cx={CX} cy={CY} r={R + 1.5} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1.6" />
          <path d="M 27.85 75.25 A 129.5 129.5 0 0 1 252.15 75.25" fill="none" stroke="rgba(255,255,255,0.34)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx={CX} cy={CY} r={R + 11.4} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="1.8" />
        </svg>
      </div>

      {/* Stationary glass cover — glossy sheen over the spinning face. Sits
          ABOVE the rotating wheel (so it doesn't spin, like a real glass dome)
          and BELOW the hub button + pointer. */}
      <div className="pointer-events-none absolute inset-0 z-[5] overflow-hidden rounded-full">
        <svg viewBox="0 0 280 280" className="h-full w-full">
          <defs>
            <linearGradient id="wglassSheen" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
              <stop offset="0.55" stopColor="#ffffff" stopOpacity="0.16" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.1" />
            </linearGradient>
            <radialGradient id="wglassEdge" gradientUnits="userSpaceOnUse" cx={CX} cy={CY} r={R + 2}>
              <stop offset="0.78" stopColor="#ffffff" stopOpacity="0" />
              <stop offset="0.95" stopColor="#ffffff" stopOpacity="0.14" />
              <stop offset="1" stopColor="#ffffff" stopOpacity="0.3" />
            </radialGradient>
            <clipPath id="wglassClip">
              <circle cx={CX} cy={CY} r={R} />
            </clipPath>
          </defs>
          <g clipPath="url(#wglassClip)">
            {/* dome gloss — gradient ends at 10% white so its curved lower edge
                stays VISIBLE (the classic glass boundary line) */}
            <ellipse cx={CX} cy={CY - R * 0.55} rx={R * 1.06} ry={R * 0.72} fill="url(#wglassSheen)" />
            {/* specular hotspot, upper-left (light source) */}
            <ellipse
              cx={CX - 50}
              cy={CY - 64}
              rx="46"
              ry="21"
              fill="#ffffff"
              opacity="0.22"
              transform={`rotate(-28 ${CX - 50} ${CY - 64})`}
            />
            {/* soft counter-gleam near the bottom rim (bounced light) */}
            <ellipse cx={CX} cy={CY + R * 0.8} rx={R * 0.68} ry={R * 0.16} fill="#ffffff" opacity="0.08" />
            {/* refraction ring hugging the rim */}
            <circle cx={CX} cy={CY} r={R} fill="url(#wglassEdge)" />
          </g>
        </svg>
        {/* liquid shine — a light band sweeping across the glass */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.13) 47%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.13) 53%, transparent 60%)',
            animation: 'wheelShine 4.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          }}
        />
      </div>

      {/* Stationary hub — raised 3D button with the glowing "e" mark */}
      <div
        className="absolute left-1/2 top-1/2 z-10 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
        style={{
          width: 76,
          height: 76,
          // Liquid glass: translucent tint + backdrop blur of the wheel beneath.
          background: 'linear-gradient(160deg, rgba(26,77,44,0.55) 0%, rgba(6,26,13,0.68) 100%)',
          backdropFilter: 'blur(8px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(8px) saturate(1.6)',
          border: '1.5px solid rgba(134,239,172,0.35)',
          boxShadow:
            '0 8px 20px rgba(0,0,0,0.6), 0 0 26px rgba(34,197,94,0.38), inset 0 1.5px 3px rgba(255,255,255,0.4), inset 0 -8px 14px rgba(0,0,0,0.45)',
        }}
      >
        <img
          src="/e-mark.png"
          alt="easy"
          draggable="false"
          className="h-11 w-11 object-contain"
          // Match the brand reference: pure-white mark, white core glow + green halo.
          style={{
            filter:
              'brightness(1.25) drop-shadow(0 0 4px rgba(255,255,255,0.8)) drop-shadow(0 0 12px rgba(134,239,172,0.75)) drop-shadow(0 0 22px rgba(34,197,94,0.45))',
          }}
        />
        {/* crescent top highlight — light catching the glass edge */}
        <span className="pointer-events-none absolute inset-[3px] rounded-full" style={{ boxShadow: 'inset 0 7px 10px -6px rgba(255,255,255,0.55)' }} />
        <span
          className="pointer-events-none absolute inset-0 rounded-full border border-brand/40"
          style={{ animation: 'wheelSonar 2.4s ease-out infinite' }}
        />
      </div>
    </div>
  )
}

// TEMPORARY iOS diagnostics — tiny line at the page bottom showing exactly what
// this context can read: detected session type, which localStorage sessions
// exist (C=customer A=agent), which session cookies exist, and a private-mode
// probe. Remove once the iOS login issue is confirmed fixed.
function SessionDebug({ auth }) {
  let ls = '—'
  let ck = '—'
  let priv = ''
  try {
    const l = []
    if (localStorage.getItem('gheasy-customer-session')) l.push('C')
    if (localStorage.getItem('gheasy-agent-session')) l.push('A')
    ls = l.join('') || '—'
    try {
      localStorage.setItem('__probe', '1')
      localStorage.removeItem('__probe')
    } catch {
      priv = ' · private-mode?'
    }
  } catch {
    ls = '✗'
    priv = ' · storage-blocked'
  }
  try {
    const c = []
    if (document.cookie.includes('gheasy_csess=')) c.push('C')
    if (document.cookie.includes('gheasy_asess=')) c.push('A')
    ck = c.join('') || '—'
  } catch {
    ck = '✗'
  }
  return (
    <p className="mt-6 text-center text-[10px] leading-relaxed text-muted/60">
      debug · session: {auth ? auth.type : 'none'} · ls: {ls} · ck: {ck}{priv}
    </p>
  )
}

export default function Games() {
  // Either tier plays — read BOTH session stores (customer first, then agent).
  // Kept in STATE and re-checked on focus/visibility/storage, so logging in from
  // another tab — or returning to a stale tab after logging in — unlocks the
  // wheel without a manual reload.
  const readAuth = () => {
    const c = getCustomerSession()
    if (c?.token) return { headers: { 'x-customer-token': c.token }, type: 'customer' }
    const a = getAgentSession()
    if (a?.token) return { headers: { 'x-agent-token': a.token }, type: 'agent' }
    return null
  }
  const [auth, setAuth] = useState(readAuth)
  useEffect(() => {
    const sync = () => setAuth((prev) => {
      const next = readAuth()
      return JSON.stringify(next) === JSON.stringify(prev) ? prev : next
    })
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(() => !!readAuth())
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
    if (auth) {
      setLoading(true)
      loadMe()
    } else {
      setMe(null)
      setLoading(false)
    }
    return () => clearTimeout(revealTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth])

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
      // Outcomes repeat on the wheel — pick a random matching segment to land on
      // (purely visual; the server's outcome is already settled).
      const matches = SEGMENTS.map((s, i) => (s.mb === d.outcomeMB ? i : -1)).filter((i) => i >= 0)
      const k = matches[Math.floor(Math.random() * matches.length)]
      const jitter = Math.floor(Math.random() * 32) - 16 // stays well inside the 45° segment
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
        <SessionDebug auth={auth} />
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
      <SessionDebug auth={auth} />
    </Page>
  )
}
