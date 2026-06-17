// Subdomain split: the agent experience lives on agent.gheasy.com, customers on
// gheasy.com. One Vite app, hostname-based routing/layout.

export const AGENT_HOST = 'agent.gheasy.com'
export const CUSTOMER_ORIGIN = 'https://gheasy.com'
export const AGENT_ORIGIN = 'https://agent.gheasy.com'

// True when running on the agent subdomain. SSG/prerender (no window) is always
// the customer build. Any `agent.*` host (incl. previews) counts as agent.
export function isAgentHost() {
  if (typeof window === 'undefined') return false
  const h = window.location.hostname
  return h === AGENT_HOST || h.startsWith('agent.')
}
