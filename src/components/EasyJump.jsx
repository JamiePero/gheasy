import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import Button from './Button.jsx'
import { HeartIcon, XIcon, AlertIcon } from './icons.jsx'
import { friendlyError } from '../lib/errors.js'

const BASE = 'https://api.getflashx.com'
const NEON = '#00FF88'

// ── Countdown to the next UTC midnight (when the board resets & prizes award) ──
function msToMidnightUTC() {
  const now = new Date()
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0)
  return next - now.getTime()
}
function fmtCountdown(ms) {
  if (ms < 0) ms = 0
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m}m`
}

// Portal so the full-screen game overlay + toast escape any transformed ancestor
// (the page uses motion wrappers, which would otherwise trap position:fixed).
function BodyPortal({ children }) {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

function RankBadge({ rank }) {
  const color = rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : rank === 3 ? '#CD7F32' : null
  if (color) {
    return (
      <span className="grid h-6 w-6 place-items-center rounded-full text-xs font-extrabold" style={{ background: color, color: '#1a1a1a' }}>
        {rank}
      </span>
    )
  }
  return <span className="inline-block w-6 pl-1.5 text-sm font-semibold text-muted tnum">{rank}</span>
}

export default function EasyJump({ auth }) {
  const [status, setStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [board, setBoard] = useState(null)
  const [nickInput, setNickInput] = useState('')
  const [savingNick, setSavingNick] = useState(false)
  const [nickError, setNickError] = useState('')
  const [nickDismissed, setNickDismissed] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [starting, setStarting] = useState(false)
  const [buying, setBuying] = useState(false)
  const [result, setResult] = useState(null)
  const [toast, setToast] = useState('')
  const [countdown, setCountdown] = useState(() => fmtCountdown(msToMidnightUTC()))

  const iframeRef = useRef(null)
  const tokenRef = useRef(null)
  const submittingRef = useRef(false)

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/gheasy/game/status`, { headers: auth.headers })
      const d = await res.json().catch(() => ({}))
      if (d.success) setStatus(d)
    } catch (e) {
      /* keep the last good status */
    } finally {
      setStatusLoading(false)
    }
  }, [auth])

  const loadBoard = useCallback(async () => {
    try {
      const res = await fetch(`${BASE}/gheasy/game/leaderboard`, { headers: auth.headers })
      const d = await res.json().catch(() => ({}))
      if (d.success) setBoard(d)
    } catch (e) {
      /* keep the last good board */
    }
  }, [auth])

  useEffect(() => {
    loadStatus()
    loadBoard()
  }, [loadStatus, loadBoard])

  // Live leaderboard — refresh every 30s.
  useEffect(() => {
    const id = setInterval(loadBoard, 30000)
    return () => clearInterval(id)
  }, [loadBoard])

  // Countdown ticks every second.
  useEffect(() => {
    const id = setInterval(() => setCountdown(fmtCountdown(msToMidnightUTC())), 1000)
    return () => clearInterval(id)
  }, [])

  // Auto-dismiss the toast.
  useEffect(() => {
    if (!toast) return
    const id = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(id)
  }, [toast])

  const saveNickname = async () => {
    const name = nickInput.trim()
    if (!name) {
      setNickError('Enter a nickname.')
      return
    }
    setSavingNick(true)
    setNickError('')
    try {
      const res = await fetch(`${BASE}/gheasy/game/nickname`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...auth.headers },
        body: JSON.stringify({ nickname: name }),
      })
      const d = await res.json().catch(() => ({}))
      if (!d.success) throw new Error(d.error || 'Could not save your nickname.')
      setNickInput('')
      await loadStatus()
      await loadBoard()
    } catch (e) {
      setNickError(friendlyError(e))
    } finally {
      setSavingNick(false)
    }
  }

  // Called by the embedded game (window.__easyGameEnd) when the player dies.
  const handleGameEnd = useCallback(
    async (rawScore) => {
      if (submittingRef.current) return
      submittingRef.current = true
      const score = Math.max(0, Math.floor(Number(rawScore) || 0))
      const token = tokenRef.current
      let rank = null
      try {
        const res = await fetch(`${BASE}/gheasy/game/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...auth.headers },
          body: JSON.stringify({ token, score }),
        })
        const d = await res.json().catch(() => ({}))
        if (d.success) rank = d.rank
      } catch (e) {
        /* still show the result card even if the submit failed */
      }
      tokenRef.current = null
      setPlaying(false)
      setResult((prev) => ({
        score,
        // The board keeps only the higher score, so best-today = max(new, old).
        bestToday: Math.max(score, status?.todayScore || 0),
        rank,
      }))
      loadStatus()
      loadBoard()
      submittingRef.current = false
    },
    [auth, status, loadStatus, loadBoard],
  )

  // ₵1 lives pack — redirect to Paystack checkout; the webhook grants the lives
  // and the callback lands back on /games, where status reloads on mount.
  const buyLives = async () => {
    if (buying) return
    setBuying(true)
    setToast('')
    try {
      const res = await fetch(`${BASE}/gheasy/game/buy-lives`, { method: 'POST', headers: auth.headers })
      const d = await res.json().catch(() => ({}))
      if (!d.success || !d.paymentUrl) throw new Error(d.error || 'Could not start the payment.')
      window.location.href = d.paymentUrl
      // keep `buying` true — we're leaving the page
    } catch (e) {
      setToast(friendlyError(e))
      setBuying(false)
    }
  }

  const startGame = async () => {
    if (starting) return
    setStarting(true)
    setToast('')
    setResult(null)
    try {
      const res = await fetch(`${BASE}/gheasy/game/start`, { method: 'POST', headers: auth.headers })
      const d = await res.json().catch(() => ({}))
      if (!d.success) {
        // 403 → no lives (or any other reason the server declined).
        setToast(d.error || 'Could not start the game.')
        return
      }
      tokenRef.current = d.token
      submittingRef.current = false
      setStatus((s) => (s ? { ...s, lives: d.livesRemaining } : s))
      setPlaying(true)
    } catch (e) {
      setToast(friendlyError(e))
    } finally {
      setStarting(false)
    }
  }

  // Bridge the host ↔ game once the overlay iframe has loaded, then auto-start
  // so the life just spent goes straight into a live game (no second gate).
  const onIframeLoad = () => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    try {
      win.__easyGameToken = tokenRef.current
      win.__easyGameEnd = (score) => handleGameEnd(score)
      const btn = win.document?.getElementById('playBtn')
      if (btn) btn.click()
    } catch (e) {
      /* same-origin so this should not throw; the game's own PLAY still works */
    }
  }

  const closeOverlay = () => {
    setPlaying(false)
    tokenRef.current = null
    submittingRef.current = false
    // The life was already spent at start; refresh so the counter is accurate.
    loadStatus()
  }

  if (statusLoading && !status) {
    return <p className="mt-8 text-center text-sm text-muted">Loading easy Jump…</p>
  }

  const lives = status?.lives ?? 0
  const showNickPrompt = status && status.displayName === null && !nickDismissed
  const prizes = board?.prizes || { first: '1GB', second: '500MB', third: '100MB' }
  const entries = board?.entries || []
  const top = entries.slice(0, 10)
  const meInTop = top.some((e) => e.isMe)
  const hasMore = entries.length > 10
  const showMyRow = !meInTop && status?.todayScore != null && status?.todayRank != null

  return (
    <div className="mt-6">
      {/* ── Lives ── */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your lives</p>
            <div className="mt-1.5 flex items-center gap-1.5">
              {lives > 0 && lives <= 5 ? (
                Array.from({ length: lives }).map((_, i) => (
                  <HeartIcon key={i} className="h-7 w-7" fill={NEON} stroke={NEON} />
                ))
              ) : (
                <>
                  <HeartIcon
                    className={`h-7 w-7 ${lives > 0 ? '' : 'text-muted'}`}
                    fill={lives > 0 ? NEON : 'none'}
                    stroke={lives > 0 ? NEON : 'currentColor'}
                  />
                  <span className="text-2xl font-extrabold tnum" style={{ color: lives > 0 ? NEON : undefined }}>
                    × {lives}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right text-xs text-muted">
            <p>3 lives per</p>
            <p>data purchase</p>
          </div>
        </div>

        {lives === 0 && (
          <div
            className="mt-3 flex items-start gap-2.5 rounded-2xl border p-3.5 text-sm"
            style={{ borderColor: 'rgba(249,115,22,0.4)', background: 'rgba(249,115,22,0.08)' }}
          >
            <AlertIcon className="mt-0.5 h-5 w-5 shrink-0" style={{ color: '#f97316' }} />
            <span className="text-muted">
              You’re out of lives. Every data purchase earns <b className="text-fg">3 lives</b>.{' '}
              <Link to="/buy-data" className="font-semibold text-brand">
                Buy data
              </Link>
            </span>
          </div>
        )}

        {/* ₵1 lives pack — deliberately quieter than the PLAY button */}
        <button
          onClick={buyLives}
          disabled={buying}
          className="mt-3 w-full rounded-2xl border bg-transparent py-2.5 text-sm font-semibold transition-opacity disabled:opacity-50"
          style={{ borderColor: 'rgba(0,255,136,0.5)', color: NEON }}
        >
          {buying ? 'Starting payment…' : '🎮 Buy 3 lives — ₵1.00'}
        </button>
      </div>

      {/* ── Nickname prompt (only when there's no registered name and no nickname) ── */}
      {showNickPrompt && (
        <div className="mt-4 rounded-3xl border border-brand/30 bg-brand/[0.06] p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Pick a nickname</p>
              <p className="mt-0.5 text-xs text-muted">This is how you’ll appear on the leaderboard.</p>
            </div>
            <button
              onClick={() => setNickDismissed(true)}
              aria-label="Skip"
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-surface"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={nickInput}
              onChange={(e) => setNickInput(e.target.value)}
              maxLength={20}
              placeholder="e.g. KwakuFPS"
              className="min-w-0 flex-1 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-[15px] font-medium text-fg outline-none focus:border-brand"
            />
            <Button onClick={saveNickname} loading={savingNick} disabled={savingNick}>
              Save
            </Button>
          </div>
          {nickError && <p className="mt-2 text-xs font-medium text-red-500">{nickError}</p>}
        </div>
      )}

      {/* ── Leaderboard ── */}
      <div className="mt-4 rounded-3xl border border-border bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold">
            <span aria-hidden>🏆</span> Today’s Leaderboard
          </h2>
          <span className="whitespace-nowrap rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-muted">
            Resets in {countdown}
          </span>
        </div>

        {/* Prize strip */}
        <div className="mt-3 flex items-center justify-center gap-5 rounded-2xl bg-surface py-2.5 text-sm font-semibold">
          <span>🥇 {prizes.first}</span>
          <span>🥈 {prizes.second}</span>
          <span>🥉 {prizes.third}</span>
        </div>

        {/* Table */}
        {entries.length === 0 ? (
          <p className="mt-4 py-4 text-center text-sm text-muted">
            No scores yet today — be the first to climb the board!
          </p>
        ) : (
          <table className="mt-3 w-full border-separate border-spacing-y-1 text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted">
                <th className="pb-1 pl-2 font-semibold">Rank</th>
                <th className="pb-1 font-semibold">Name</th>
                <th className="pb-1 pr-2 text-right font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {top.map((e) => (
                <tr key={e.rank} className={e.isMe ? 'bg-brand/10' : ''}>
                  <td className="rounded-l-xl py-2 pl-2 align-middle">
                    <RankBadge rank={e.rank} />
                  </td>
                  <td className="py-2 align-middle font-medium">
                    {e.displayName}
                    {e.isMe && <span className="ml-1.5 text-xs font-semibold text-brand">(you)</span>}
                  </td>
                  <td className="rounded-r-xl py-2 pr-2 text-right align-middle font-bold tnum">{e.score}</td>
                </tr>
              ))}
              {hasMore && (
                <tr>
                  <td colSpan={3} className="py-1 text-center text-muted">
                    …
                  </td>
                </tr>
              )}
              {showMyRow && (
                <tr className="bg-brand/10">
                  <td className="rounded-l-xl py-2 pl-2 align-middle">
                    <RankBadge rank={status.todayRank} />
                  </td>
                  <td className="py-2 align-middle font-medium">
                    {status.displayName || 'You'}
                    <span className="ml-1.5 text-xs font-semibold text-brand">(you)</span>
                  </td>
                  <td className="rounded-r-xl py-2 pr-2 text-right align-middle font-bold tnum">{status.todayScore}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Play ── */}
      <Button onClick={startGame} loading={starting} disabled={lives <= 0 || starting} size="lg" className="mt-6 w-full">
        {lives > 0 ? `PLAY (${lives} ${lives === 1 ? 'life' : 'lives'})` : 'No lives left'}
      </Button>
      {lives <= 0 && !starting && (
        <p className="mt-2 text-center text-xs text-muted">
          Every data purchase earns 3 lives.{' '}
          <Link to="/buy-data" className="font-semibold text-brand">
            Buy data
          </Link>
        </p>
      )}

      {/* ── Result card ── */}
      {result && (
        <div className="mt-5 rounded-3xl border border-brand/30 bg-brand/[0.06] p-5 text-center shadow-card">
          <p className="text-sm font-semibold text-muted">Game over</p>
          <p className="mt-1 font-display text-4xl font-extrabold" style={{ color: NEON }}>
            {result.score}
          </p>
          <p className="text-xs text-muted">Score</p>
          <div className="mt-3 flex justify-center gap-8 text-sm">
            <div>
              <p className="font-bold tnum">{result.bestToday}</p>
              <p className="text-xs text-muted">Your best today</p>
            </div>
            {result.rank != null && (
              <div>
                <p className="font-bold tnum">#{result.rank}</p>
                <p className="text-xs text-muted">Rank</p>
              </div>
            )}
          </div>
          {lives > 0 ? (
            <Button onClick={startGame} loading={starting} className="mt-4 w-full">
              Play again ({lives} {lives === 1 ? 'life' : 'lives'})
            </Button>
          ) : (
            <p className="mt-4 text-xs text-muted">Out of lives — buy data to earn 3 more.</p>
          )}
        </div>
      )}

      {/* ── Full-screen game overlay ── */}
      {playing && (
        <BodyPortal>
          <div className="fixed inset-0 z-[999] bg-black">
            <button
              onClick={closeOverlay}
              aria-label="Close game"
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur"
            >
              <XIcon className="h-6 w-6" />
            </button>
            <iframe
              ref={iframeRef}
              src="/easy_jump.html"
              title="easy Jump"
              onLoad={onIframeLoad}
              className="h-full w-full border-0"
              allow="autoplay; fullscreen"
            />
          </div>
        </BodyPortal>
      )}

      {/* ── Toast ── */}
      {toast && (
        <BodyPortal>
          <div className="fixed inset-x-4 bottom-6 z-[1000] mx-auto max-w-sm rounded-2xl bg-fg px-4 py-3 text-center text-sm font-medium text-bg shadow-lg">
            {toast}
          </div>
        </BodyPortal>
      )}
    </div>
  )
}
