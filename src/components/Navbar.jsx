import { NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'
import ThemeToggle from './ThemeToggle.jsx'
import Button from './Button.jsx'
import { ArrowRightIcon } from './icons.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/buy-data', label: 'Buy Data' },
  { to: '/order-status', label: 'Order Status' },
  { to: '/about', label: 'About' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border/70 glass md:block">
      <nav className="wrap flex h-16 items-center justify-between">
        <Logo />
        <div className="flex items-center gap-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-brand' : 'text-muted hover:text-fg'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button to="/buy-data" size="sm" iconRight={<ArrowRightIcon className="h-4 w-4" />}>
            Buy Data
          </Button>
        </div>
      </nav>
    </header>
  )
}
