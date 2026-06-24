import { useEffect, useState } from 'react'
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

  // Maintenance gate — easy customers see a clean screen when admin toggles it
  // on; /admin stays accessible so it can be turned back off.
  useEffect(() => {
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
      <div className="relative flex min-h-dvh flex-col bg-bg">
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
        <main className="w-full flex-1 pb-[88px] md:pb-0">
          <Outlet />
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
