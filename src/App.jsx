import { AnimatePresence } from 'framer-motion'
import { Route, Routes, useLocation } from 'react-router-dom'
import MobileHeader from './components/MobileHeader.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import BottomNav from './components/BottomNav.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import RouteTracker from './components/RouteTracker.jsx'
import Home from './pages/Home.jsx'
import BuyData from './pages/BuyData.jsx'
import History from './pages/History.jsx'
import OrderStatus from './pages/OrderStatus.jsx'
import Refer from './pages/Refer.jsx'
import Agent from './pages/Agent.jsx'
import AgentLogin from './pages/AgentLogin.jsx'
import AgentDashboard from './pages/AgentDashboard.jsx'
import More from './pages/More.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  const location = useLocation()
  return (
    <div className="relative flex min-h-dvh flex-col bg-bg">
      <ScrollToTop />
      <RouteTracker />
      <MobileHeader />
      <Navbar />
      <main className="w-full flex-1 pb-[88px] md:pb-0">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/buy-data" element={<BuyData />} />
            <Route path="/history" element={<History />} />
            <Route path="/order-status" element={<OrderStatus />} />
            <Route path="/refer" element={<Refer />} />
            <Route path="/agent" element={<Agent />} />
            <Route path="/agent/login" element={<AgentLogin />} />
            <Route path="/agent/dashboard" element={<AgentDashboard />} />
            <Route path="/more" element={<More />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}
