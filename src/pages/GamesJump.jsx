import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Button from '../components/Button.jsx'
import Seo from '../components/Seo.jsx'
import GameTopBar from '../components/GameTopBar.jsx'
import EasyJump from '../components/EasyJump.jsx'
import { getAgentSession, getCustomerSession } from '../lib/store.js'
import { GiftIcon } from '../components/icons.jsx'

// Full-page easy Jump route (/games/jump): fixed top bar + the whole game
// panel — lives, nickname prompt, leaderboard, PLAY and the in-page game
// overlay all live here. /games itself only shows the two selector cards.
export default function GamesJump() {
  // Same shared-session detection as the wheel page (customer first, agent
  // second; localStorage + .gheasy.com cookie; re-read on mount for PWA
  // cold-launches).
  const readAuth = () => {
    const c = getCustomerSession()
    if (c?.token) return { headers: { 'x-customer-token': c.token }, type: 'customer' }
    const a = getAgentSession()
    if (a?.token) return { headers: { 'x-agent-token': a.token }, type: 'agent' }
    return null
  }
  const [auth, setAuth] = useState(null)
  const [checked, setChecked] = useState(false)
  useEffect(() => {
    const sync = () =>
      setAuth((prev) => {
        const next = readAuth()
        return JSON.stringify(next) === JSON.stringify(prev) ? prev : next
      })
    sync()
    setChecked(true)
    window.addEventListener('focus', sync)
    document.addEventListener('visibilitychange', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('focus', sync)
      document.removeEventListener('visibilitychange', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return (
    <Page className="wrap-app pb-16 pt-6">
      <Seo title="easy Jump — Daily Leaderboard, Win Free Data | easy" noindex />
      <GameTopBar title="easy Jump" />

      {!checked ? (
        <p className="mt-8 text-center text-sm text-muted">Loading…</p>
      ) : !auth ? (
        <div className="mt-6 rounded-3xl border border-brand/30 bg-brand/[0.06] p-5 text-center shadow-card">
          <GiftIcon className="mx-auto h-7 w-7 text-brand" />
          <p className="mt-2 text-sm font-bold">Log in to play</p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-muted">
            easy Jump is for easy accounts — free to join. Every data purchase earns 3 lives, and the top 3 scores each day win real data prizes.
          </p>
          <Button to="/register" className="mt-4 w-full">Create a free account</Button>
          <p className="mt-3 text-xs text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand">Log in</Link>
          </p>
        </div>
      ) : (
        <EasyJump auth={auth} />
      )}
    </Page>
  )
}
