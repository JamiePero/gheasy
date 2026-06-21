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

// Root layout: providers + persistent chrome around the routed <Outlet/>.
// Chrome is hostname-aware — agent.gheasy.com gets the agent chrome, gheasy.com
// the customer chrome. Routes live in routes.jsx (consumed by vite-react-ssg).
export default function App() {
  const agentHost = isAgentHost()
  const [showSplash, setShowSplash] = useState(false)

  // Cold-load splash, shown once per browser session (not on internal nav).
  // Starts false so the prerendered HTML hydrates cleanly, then mounts post-hydration.
  useEffect(() => {
    let shown = true
    try {
      shown = sessionStorage.getItem('easy-splash-shown') === '1'
    } catch {
      /* sessionStorage blocked */
    }
    if (shown) return
    setShowSplash(true)
    try {
      sessionStorage.setItem('easy-splash-shown', '1')
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setShowSplash(false), 2000)
    return () => clearTimeout(t)
  }, [])

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
