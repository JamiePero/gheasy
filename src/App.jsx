import { Suspense, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from './theme.jsx'
import MobileHeader from './components/MobileHeader.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import BottomNav from './components/BottomNav.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import RouteTracker from './components/RouteTracker.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'
import SplashScreen from './components/SplashScreen.jsx'
import DomainGuard from './components/DomainGuard.jsx'
import { AgentHeader, AgentBottomNav } from './components/AgentChrome.jsx'
import { isAgentHost } from './lib/host.js'
import { appReady } from './lib/appReady.js'
import { captureRefFromUrl, saveAgentSession, saveCustomerSession } from './lib/store.js'

// Clean full-screen maintenance notice shown to easy customers when the admin
// has toggled maintenance mode on (config/easy in Firestore).
function MaintenanceScreen({ message, eta }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center" style={{ backgroundColor: '#050f05' }}>
      <p className="font-display text-3xl font-bold tracking-wide text-brand">easy</p>
      <h1 className="mt-2 text-xl font-bold text-white">We’ll be right back</h1>
      <p className="max-w-sm text-sm text-[#9fb8a8]">
        {message || 'easy is undergoing maintenance. We will be back shortly. Thank you for your patience.'}
      </p>
      {eta && (
        <p className="text-xs text-[#5f8c6f]">
          Estimated time back: <span className="font-semibold text-white">{eta}</span>
        </p>
      )}
    </div>
  )
}

// Root layout: providers + persistent chrome around the routed <Outlet/>.
// Chrome is hostname-aware — agent.gheasy.com gets the agent chrome, gheasy.com
// the customer chrome. Routes live in routes.jsx (consumed by vite-react-ssg).
export default function App() {
  const agentHost = isAgentHost()
  const [showSplash, setShowSplash] = useState(false)
  const [maint, setMaint] = useState(null)

  // Cross-subdomain login handoff. The unified login can produce an account
  // whose session belongs on the OTHER origin (agent on agent.gheasy.com,
  // customer on gheasy.com). It redirects here with #sso=<token>&t=<type>;
  // adopt the session on this origin, strip the hash, then reload so the routed
  // page mounts with the session in place.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!window.location.hash.includes('sso=')) return
    const params = new URLSearchParams(window.location.hash.slice(1))
    const token = params.get('sso')
    const t = params.get('t')
    if (!token) return
    const finish = () => {
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      window.location.reload()
    }
    const url = t === 'agent'
      ? 'https://api.getflashx.com/gheasy/agent/dashboard'
      : 'https://api.getflashx.com/gheasy/customer/me'
    const header = t === 'agent' ? 'x-agent-token' : 'x-customer-token'
    fetch(url, { headers: { [header]: token } })
      .then((r) => r.json())
      .then((d) => {
        if (t === 'agent' && d.success && d.agent) saveAgentSession({ token, agent: d.agent })
        else if (t === 'customer' && d.success) saveCustomerSession({ token, customer: { phoneNumber: d.customer.phoneNumber, name: d.customer.name } })
      })
      .catch(() => {})
      .finally(finish)
  }, [])

  // Maintenance gate — easy customers see a clean screen when admin toggles it
  // on; /admin stays accessible so it can be turned back off.
  useEffect(() => {
    captureRefFromUrl()
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return
    fetch('https://api.getflashx.com/gheasy/maintenance-status')
      .then((r) => r.json())
      .then((d) => { if (d && d.maintenance) setMaint(d) })
      .catch(() => {})
  }, [])

  // Cold-load splash, shown once per browser session (not on internal nav).
  // Starts false so the prerendered HTML hydrates cleanly, then mounts post-hydration.
  useEffect(() => {
    const removeBoot = () => {
      try {
        document.getElementById('boot-splash')?.remove()
      } catch {
        /* ignore */
      }
    }
    let shown = true
    try {
      shown = sessionStorage.getItem('easy-splash-shown') === '1'
    } catch {
      /* sessionStorage blocked */
    }
    if (shown) {
      removeBoot() // already shown this session → reveal the app immediately
      return
    }
    try {
      sessionStorage.setItem('easy-splash-shown', '1')
    } catch {
      /* ignore */
    }
    setShowSplash(true)

    // Fade out only when BOTH the 3s minimum AND the content are ready.
    // appReady is capped at 8s so a slow/never-firing signal can't hang the splash.
    let cancelled = false
    const minTimer = new Promise((r) => setTimeout(r, 3000))
    const contentReady = Promise.race([appReady, new Promise((r) => setTimeout(r, 8000))])
    Promise.all([minTimer, contentReady]).then(() => {
      if (cancelled) return
      removeBoot() // reveal the app behind the fading splash
      setShowSplash(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (maint) {
    return (
      <ThemeProvider>
        <MaintenanceScreen message={maint.message} eta={maint.estimatedTime} />
      </ThemeProvider>
    )
  }

  return (
    <ThemeProvider>
      <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>
      <div
        className="relative flex min-h-dvh flex-col bg-bg"
        // iOS safe-area: keep content clear of the notch/rounded corners on the
        // sides (top is handled by the sticky header's pt-safe, bottom by the
        // nav's safe-bottom + main's padding).
        style={{ paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}
      >
        <ScrollToTop />
        <RouteTracker />
        <DomainGuard />
        {agentHost ? (
          <AgentHeader />
        ) : (
          <>
            <MobileHeader />
            <Navbar />
          </>
        )}
        <main className="w-full flex-1 pb-[calc(88px_+_env(safe-area-inset-bottom))] md:pb-0">
          <Suspense fallback={<div className="grid min-h-[60vh] place-items-center text-sm text-muted">Loading…</div>}>
            <Outlet />
          </Suspense>
        </main>
        {agentHost ? (
          <AgentBottomNav />
        ) : (
          <>
            <Footer />
            <BottomNav />
          </>
        )}
        <WhatsAppButton />
      </div>
    </ThemeProvider>
  )
}
