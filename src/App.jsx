import { Outlet } from 'react-router-dom'
import { ThemeProvider } from './theme.jsx'
import MobileHeader from './components/MobileHeader.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import BottomNav from './components/BottomNav.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import RouteTracker from './components/RouteTracker.jsx'
import WhatsAppButton from './components/WhatsAppButton.jsx'

// Root layout: providers + persistent chrome around the routed <Outlet/>.
// Routes themselves live in routes.jsx (consumed by vite-react-ssg + client).
export default function App() {
  return (
    <ThemeProvider>
      <div className="relative flex min-h-dvh flex-col bg-bg">
        <ScrollToTop />
        <RouteTracker />
        <MobileHeader />
        <Navbar />
        <main className="w-full flex-1 pb-[88px] md:pb-0">
          <Outlet />
        </main>
        <Footer />
        <BottomNav />
        <WhatsAppButton />
      </div>
    </ThemeProvider>
  )
}
