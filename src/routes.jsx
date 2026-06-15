import App from './App.jsx'
import Home from './pages/Home.jsx'
import BuyData from './pages/BuyData.jsx'
import History from './pages/History.jsx'
import OrderStatus from './pages/OrderStatus.jsx'
import Refer from './pages/Refer.jsx'
import Agent from './pages/Agent.jsx'
import AgentLogin from './pages/AgentLogin.jsx'
import AgentDashboard from './pages/AgentDashboard.jsx'
import Store from './pages/Store.jsx'
import More from './pages/More.jsx'
import About from './pages/About.jsx'
import HowItWorks from './pages/HowItWorks.jsx'
import Faq from './pages/Faq.jsx'
import Agents from './pages/Agents.jsx'
import NetworkBundles from './pages/NetworkBundles.jsx'
import NotFound from './pages/NotFound.jsx'

// React Router v6 data routes, consumed by vite-react-ssg (SSG) and the client.
export const routes = [
  {
    path: '/',
    element: <App />,
    entry: 'src/App.jsx',
    children: [
      { index: true, element: <Home /> },
      { path: 'buy-data', element: <BuyData /> },
      { path: 'history', element: <History /> },
      { path: 'order-status', element: <OrderStatus /> },
      { path: 'refer', element: <Refer /> },
      { path: 'agent', element: <Agent /> },
      { path: 'agent/login', element: <AgentLogin /> },
      { path: 'agent/dashboard', element: <AgentDashboard /> },
      { path: 'store/:slug', element: <Store /> },
      { path: 'more', element: <More /> },
      { path: 'about', element: <About /> },
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
