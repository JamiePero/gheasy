import { useEffect, useState } from 'react'
import Button from './Button.jsx'

// Standalone install affordance for the "easy Admin" PWA — rendered only on the
// /admin page (so it never appears on the customer app).
//
// • Android / desktop Chrome: the inline script in index.html captures
//   beforeinstallprompt early and stashes it on window.__adminInstallPrompt;
//   this component shows an "Install Admin App" button that calls prompt().
// • iOS Safari (no beforeinstallprompt): shows an "Add to Home Screen" hint.
// • Hidden entirely once running installed (standalone display mode), so it only
//   shows when NOT already installed.
//
// It also re-points the page manifest to the admin one for client-side
// navigations into /admin (hard loads are already handled before paint by the
// inline script), and restores the customer manifest on unmount.
const ADMIN_MANIFEST = '/admin-manifest.json'

function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(display-mode: standalone)').matches === true ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  if (typeof navigator === 'undefined') return false
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    // iPadOS 13+ identifies as Mac — detect via touch support.
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export default function AdminInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [standalone, setStandalone] = useState(false)
  const [ios, setIos] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)

  // SPA-navigation manifest swap (hard loads handled by the inline script).
  useEffect(() => {
    if (typeof document === 'undefined') return undefined
    const link = document.querySelector('link[rel="manifest"]')
    const prevHref = link?.getAttribute('href')
    if (link && prevHref !== ADMIN_MANIFEST) link.setAttribute('href', ADMIN_MANIFEST)
    const titleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    const prevTitle = titleMeta?.getAttribute('content')
    if (titleMeta) titleMeta.setAttribute('content', 'easy Admin')
    return () => {
      if (link && prevHref) link.setAttribute('href', prevHref)
      if (titleMeta && prevTitle) titleMeta.setAttribute('content', prevTitle)
    }
  }, [])

  useEffect(() => {
    setStandalone(isStandalone())
    setIos(isIOS())
    // The inline script may have captured the prompt before React mounted.
    if (window.__adminInstallPrompt) setDeferred(window.__adminInstallPrompt)
    const onReady = () => setDeferred(window.__adminInstallPrompt || null)
    const onBip = (e) => {
      e.preventDefault?.()
      window.__adminInstallPrompt = e
      setDeferred(e)
    }
    const onInstalled = () => {
      window.__adminInstallPrompt = null
      setDeferred(null)
      setStandalone(true)
    }
    window.addEventListener('admin-install-ready', onReady)
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('admin-install-ready', onReady)
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  if (standalone || dismissed) return null
  // Nothing actionable to show (no prompt available and not iOS) → render nothing.
  if (!deferred && !ios) return null

  const install = async () => {
    if (!deferred) return
    setInstalling(true)
    try {
      deferred.prompt()
      await deferred.userChoice?.catch(() => {})
    } finally {
      setInstalling(false)
      window.__adminInstallPrompt = null
      setDeferred(null)
    }
  }

  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/[0.06] p-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3l7 3v5c0 4.5-3 7-7 8-4-1-7-3.5-7-8V6z" />
          <circle cx="12" cy="11" r="1.5" fill="currentColor" stroke="none" />
          <path d="M12 12.4V15" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-fg">Install the Admin app</p>
        {deferred ? (
          <>
            <p className="mt-0.5 text-xs text-muted">Add the easy admin dashboard to your home screen for one-tap access.</p>
            <div className="mt-2.5 flex items-center gap-2">
              <Button onClick={install} loading={installing} size="sm">Install Admin App</Button>
              <button onClick={() => setDismissed(true)} className="rounded-full px-3 py-1.5 text-xs font-medium text-muted hover:text-fg">Not now</button>
            </div>
          </>
        ) : (
          <p className="mt-0.5 text-xs text-muted">
            On iPhone: tap the <span className="font-semibold text-fg">Share</span> icon, then{' '}
            <span className="font-semibold text-fg">Add to Home Screen</span>.
          </p>
        )}
      </div>
      <button onClick={() => setDismissed(true)} aria-label="Dismiss" className="shrink-0 text-muted transition-colors hover:text-fg">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  )
}
