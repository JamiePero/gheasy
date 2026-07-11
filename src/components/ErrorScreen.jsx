import { useEffect, useState } from 'react'
import { useRouteError } from 'react-router-dom'
import { LogoMark } from './Logo.jsx'
import { WHATSAPP_NUMBER } from '../config.js'

const WA_HREF = `https://wa.me/${String(WHATSAPP_NUMBER).replace(/\D/g, '')}?text=${encodeURIComponent(
  'Hi easy, the app showed an error screen.',
)}`

// Full-screen branded error state — replaces every "Unexpected Application
// Error!" / raw JS error users could previously see. Deliberately dependency-
// light (no framer-motion, no Button component) so it still renders when
// whatever crashed the app is unavailable. NEVER shows technical details;
// those go to console.error only.
export default function ErrorScreen({ autoRetry = false }) {
  const [retrying, setRetrying] = useState(false)

  useEffect(() => {
    if (!autoRetry) return
    let cancelled = false
    try {
      // One auto-retry per session — a persistent failure must never reload-loop.
      if (sessionStorage.getItem('easy-error-auto-retried') === '1') return
      sessionStorage.setItem('easy-error-auto-retried', '1')
    } catch {
      return
    }
    setRetrying(true)
    const t = setTimeout(() => {
      if (!cancelled) window.location.reload()
    }, 3000)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [autoRetry])

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center gap-3 px-6 text-center"
      style={{ backgroundColor: '#050f05' }}
    >
      <LogoMark className="h-16 w-16" />
      <h1 className="mt-3 text-xl font-bold text-white">Something went wrong</h1>
      <p className="max-w-xs text-sm" style={{ color: '#9fb8a8' }}>
        Please try again.
      </p>
      {retrying ? (
        <p className="mt-3 text-sm font-semibold" style={{ color: '#22C55E' }}>
          Retrying…
        </p>
      ) : (
        <button
          onClick={() => window.location.reload()}
          className="mt-3 h-12 rounded-2xl px-10 text-[15px] font-semibold text-white transition-opacity active:opacity-80"
          style={{ backgroundColor: '#22C55E', boxShadow: '0 0 24px rgba(34,197,94,0.35)' }}
        >
          Refresh
        </button>
      )}
      <a
        href={WA_HREF}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 text-xs underline-offset-2 hover:underline"
        style={{ color: '#5f8c6f' }}
      >
        If this keeps happening, contact support
      </a>
    </div>
  )
}

// React Router errorElement — catches route render errors, loader errors and
// failed lazy-chunk imports (replaces the router's default "Unexpected
// Application Error!" page). Logs the real error for debugging, shows the
// clean screen, and auto-retries once (a stale chunk after a redeploy is
// fixed by exactly one reload).
export function RouteErrorScreen() {
  const error = useRouteError()
  useEffect(() => {
    console.error('[easy] route error:', error)
  }, [error])
  return <ErrorScreen autoRetry />
}
