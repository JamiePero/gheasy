import { Link, NavLink } from 'react-router-dom'
import { Wordmark } from './Logo.jsx'
import Avatar from './Avatar.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import Button from './Button.jsx'
import { getProfile } from '../lib/store.js'
import { ArrowRightIcon } from './icons.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/buy-data', label: 'Buy Data' },
  { to: '/history', label: 'History' },
  { to: '/order-status', label: 'Track Order' },
  { to: '/about', label: 'About' },
]

// Desktop-only navbar (md and up). Mobile uses MobileHeader + BottomNav.
export default function Navbar() {
  const { avatar } = getProfile()
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/70 glass md:block">
      <nav className="wrap grid h-16 grid-cols-[1fr_auto_1fr] items-center gap-4">
        {/* Left — "easy" wordmark (theme-aware), same as the app */}
        <NavLink to="/" className="justify-self-start" aria-label="easy — home">
          <Wordmark className="h-7" />
        </NavLink>

        {/* Center — navigation links */}
        <div className="flex items-center justify-self-center">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-muted hover:text-fg'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right — theme toggle + account + CTA */}
        <div className="flex items-center gap-3 justify-self-end">
          <ThemeToggle />
          <Link
            to="/more"
            aria-label="Your account"
            title="Account"
            className="rounded-xl transition-opacity hover:opacity-90"
          >
            <Avatar src={avatar} className="h-9 w-9" />
          </Link>
          <Button to="/buy-data" size="sm" iconRight={<ArrowRightIcon className="h-4 w-4" />}>
            Buy Data
          </Button>
        </div>
      </nav>
    </header>
  )
}
