import { Link } from 'react-router-dom'
import { LogoMark, Wordmark } from './Logo.jsx'

const links = [
  { to: '/buy-data', label: 'Buy Data' },
  { to: '/history', label: 'History' },
  { to: '/refer', label: 'Refer' },
  { to: '/about', label: 'About' },
]

// Desktop-only footer (md and up) — clean single row.
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="hidden border-t border-border bg-surface md:block">
      <div className="wrap grid h-20 grid-cols-3 items-center gap-4">
        {/* Left — "e" mark + "easy" wordmark */}
        <Link to="/" className="flex items-center gap-2.5 justify-self-start" aria-label="easy — home">
          <LogoMark className="h-8 w-8" />
          <Wordmark className="h-7" />
        </Link>

        {/* Center — links */}
        <nav className="flex items-center gap-6 justify-self-center text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted transition-colors hover:text-brand">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right — copyright */}
        <p className="justify-self-end text-xs text-muted">© {year} easy · Made in Ghana 🇬🇭</p>
      </div>
    </footer>
  )
}
