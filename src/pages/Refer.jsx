import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAgentSession, getCustomerSession } from '../lib/store.js'

// LEGACY ROUTE. The old page here displayed a device-generated EZ- code that
// was never registered server-side, so codes shared from it credited nobody.
// Real, server-minted codes live in gheasy_referrers and are surfaced on:
//   • /account — logged-in customers (agents are forwarded to their dashboard,
//     which carries the same referral card)
//   • /rewards — no-login phone lookup
// This route now just forwards to the right one. Kept (rather than deleted) so
// old bookmarks and previously shared /refer links keep working.
export default function Refer() {
  const navigate = useNavigate()
  useEffect(() => {
    const loggedIn = getCustomerSession() || getAgentSession()
    navigate(loggedIn ? '/account' : '/rewards', { replace: true })
  }, [navigate])
  return null
}
