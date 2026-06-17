import { NavLink, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wordmark } from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import { getAgentSession, clearAgentSession } from '../lib/store.js'
import { GridIcon, CartIcon } from './icons.jsx'

// Chrome for agent.gheasy.com — same logo/theme/fonts as the customer app, but
// navigationally separate (no customer Buy Data / bottom nav).

export function AgentHeader() {
  const navigate = useNavigate()
  const session = getAgentSession()
  const logout = () => {
    clearAgentSession()
    navigate('/login')
  }
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 glass px-4">
      <NavLink to="/" aria-label="easy — agent home">
        <Wordmark className="h-6" />
      </NavLink>
      <div className="flex items-center gap-2">
        <span className="rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted">
          Agent
        </span>
        {session && (
          <button
            onClick={logout}
            className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-fg transition-colors hover:border-brand/40"
          >
            Log out
          </button>
        )}
        <ThemeToggle className="h-9 w-9" />
      </div>
    </header>
  )
}

// Agent bottom nav (mobile): Dashboard + My Store (the agent's own store with
// their custom prices) — never the generic customer Buy Data page (Part 7).
export function AgentBottomNav() {
  const session = getAgentSession()
  const slug = session?.agent?.slug
  if (!session) return null
  const tabs = [
    { to: '/dashboard', label: 'Dashboard', Icon: GridIcon, end: true },
    ...(slug ? [{ to: `/store/${slug}`, label: 'My Store', Icon: CartIcon }] : []),
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 glass safe-bottom md:hidden">
      <div className={`mx-auto grid max-w-md ${tabs.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {tabs.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className="relative flex flex-col items-center gap-1 py-2.5">
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="agentNavIndicator"
                    className="absolute -top-px h-[3px] w-9 rounded-full bg-brand"
                    transition={{ type: 'spring', stiffness: 480, damping: 34 }}
                  />
                )}
                <Icon
                  className={`h-[25px] w-[25px] transition-colors ${isActive ? 'text-brand' : 'text-muted'}`}
                  strokeWidth={isActive ? 2.1 : 1.75}
                />
                <span
                  className={`text-[11px] font-medium leading-none transition-colors ${isActive ? 'text-brand' : 'text-muted'}`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
