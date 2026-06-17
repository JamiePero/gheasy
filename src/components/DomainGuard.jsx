import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAgentHost, AGENT_ORIGIN, CUSTOMER_ORIGIN } from '../lib/host.js'

// Keeps the two domains navigationally separate (Part 1):
//  • agent.gheasy.com serves only /, /login, /dashboard, /store/:slug
//  • gheasy.com serves the customer site, minus the agent routes
// Mismatched paths are redirected to the correct domain. Same-domain legacy
// /agent* paths are normalised to the simplified agent paths.
function isAgentPath(p) {
  return p === '/' || p === '/login' || p === '/dashboard' || p.startsWith('/store/')
}

export default function DomainGuard() {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (isAgentHost()) {
      // Normalise legacy /agent/* to the simplified agent-domain paths.
      if (pathname === '/agent') return navigate('/', { replace: true })
      if (pathname === '/agent/login') return navigate('/login', { replace: true })
      if (pathname === '/agent/dashboard') return navigate('/dashboard', { replace: true })
      // Anything that isn't an agent path belongs on the customer site.
      if (!isAgentPath(pathname)) window.location.replace(CUSTOMER_ORIGIN + pathname + search)
    } else {
      // Customer domain: agent-only paths live on the agent subdomain.
      if (pathname === '/agent') return void window.location.replace(`${AGENT_ORIGIN}/`)
      if (pathname === '/agent/login' || pathname === '/login') return void window.location.replace(`${AGENT_ORIGIN}/login`)
      if (pathname === '/agent/dashboard' || pathname === '/dashboard') return void window.location.replace(`${AGENT_ORIGIN}/dashboard`)
      if (pathname.startsWith('/store/')) window.location.replace(AGENT_ORIGIN + pathname + search)
    }
  }, [pathname, search, navigate])

  return null
}
