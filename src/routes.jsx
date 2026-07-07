import { lazy } from 'react'
import { Navigate } from 'react-router-dom'
import App from './App.jsx'
import Home from './pages/Home.jsx'
import BuyData from './pages/BuyData.jsx'
import History from './pages/History.jsx'
import OrderStatus from './pages/OrderStatus.jsx'
import Refer from './pages/Refer.jsx'
import MyRewards from './pages/MyRewards.jsx'
import CustomerRegister from './pages/CustomerRegister.jsx'
import Account from './pages/Account.jsx'
import Games from './pages/Games.jsx'
// Code-split (G1): the agent & admin surfaces are client-only, behind auth, and
// off the customer hot path — lazy-load them so they don't weigh down the main
// customer bundle. Suspense boundary lives around the <Outlet/> in App.jsx.
const Agent = lazy(() => import('./pages/Agent.jsx'))
const AgentLogin = lazy(() => import('./pages/AgentLogin.jsx'))
const AgentDashboard = lazy(() => import('./pages/AgentDashboard.jsx'))
const Store = lazy(() => import('./pages/Store.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))
import More from './pages/More.jsx'
import About from './pages/About.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Faq from './pages/Faq.jsx'
import Agents from './pages/Agents.jsx'
import NetworkBundles from './pages/NetworkBundles.jsx'
import NotFound from './pages/NotFound.jsx'
import { isAgentHost } from './lib/host.js'
import { getAgentSession } from './lib/store.js'

// Index route is hostname-aware: agent.gheasy.com shows the agent entry
// (dashboard if logged in, else the agent landing); gheasy.com shows Home.
// During SSG (no window) this is always Home, so the customer site prerenders.
function RootRoute() {
  if (!isAgentHost()) return <Home />
  if (getAgentSession()) return <Navigate to="/dashboard" replace />
  return <Agent />
}

// React Router v6 data routes, consumed by vite-react-ssg (SSG) and the client.
export const routes = [
  {
    path: '/',
    element: <App />,
    entry: 'src/App.jsx',
    children: [
      { index: true, element: <RootRoute /> },

      // ── Agent (agent.gheasy.com) — simplified paths ──
      { path: 'login', element: <AgentLogin /> },
      { path: 'dashboard', element: <AgentDashboard /> },
      { path: 'store/:slug', element: <Store /> },
      // Legacy /agent* paths — normalised/redirected by DomainGuard.
      { path: 'agent', element: <Agent /> },
      { path: 'agent/login', element: <AgentLogin /> },
      { path: 'agent/dashboard', element: <AgentDashboard /> },

      // ── Customer (gheasy.com) ──
      { path: 'buy-data', element: <BuyData /> },
      { path: 'history', element: <History /> },
      { path: 'order-status', element: <OrderStatus /> },
      { path: 'refer', element: <Refer /> },
      { path: 'rewards', element: <MyRewards /> },
      { path: 'register', element: <CustomerRegister /> },
      { path: 'account', element: <Account /> },
      { path: 'games', element: <Games /> },
      { path: 'more', element: <More /> },
      { path: 'about', element: <About /> },
      { path: 'admin', element: <Admin /> },
      { path: 'how-it-works', element: <HowItWorks /> },
      { path: 'faq', element: <Faq /> },
      { path: 'agents', element: <Agents /> },
      { path: 'mtn-bundles', element: <NetworkBundles network="mtn" /> },
      { path: 'telecel-bundles', element: <NetworkBundles network="telecel" /> },
      { path: 'airteltigo-bundles', element: <NetworkBundles network="airteltigo" /> },

      { path: '*', element: <NotFound /> },
    ],
  },
]
