import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getAgentSession } from '../lib/store.js'

export default function MobileHeader() {
  const { pathname } = useLocation()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [agentSession] = useState(() => getAgentSession())
  const agent = agentSession?.agent
  const storeInitials =
    (agent?.storeName || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'E'

  useEffect(() => {
    // Detect iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const standalone = window.navigator.standalone
    if (ios && !standalone) {
      setIsIOS(true)
      setShowBanner(true)
    }

    // Android / Chrome install prompt
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
      setShowBanner(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (installPrompt) {
      installPrompt.prompt()
      const { outcome } = await installPrompt.userChoice
      if (outcome === 'accepted') setShowBanner(false)
      setInstallPrompt(null)
    }
  }

  if (pathname === '/') return null

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 glass px-4 md:hidden">
        <Logo wordmarkClass="h-6" />
        <div className="flex items-center gap-2">
          {agent ? (
            <Link
              to="/agent/dashboard"
              aria-label="Agent dashboard"
              className="flex items-center gap-1.5 rounded-full border border-border bg-card py-1 pl-1 pr-2.5"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-brand text-[11px] font-bold text-white">
                {storeInitials}
              </span>
              <span className="max-w-[84px] truncate text-xs font-semibold text-fg">{agent.storeName}</span>
            </Link>
          ) : null}
          <ThemeToggle className="h-9 w-9" />
        </div>
      </header>

      {showBanner && (
        <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-surface px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <img src="/easytra.png" className="h-9 w-9 rounded-xl" alt="easy" />
            <div>
              <p className="text-sm font-semibold text-fg">Add easy to Home Screen</p>
              <p className="text-xs text-muted">
                {isIOS ? 'Tap Share then "Add to Home Screen"' : 'Install for faster access'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isIOS && installPrompt && (
              <button
                onClick={handleInstall}
                className="rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white"
              >
                Install
              </button>
            )}
            <button
              onClick={() => setShowBanner(false)}
              className="text-lg text-muted leading-none"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}