import { Link } from 'react-router-dom'
import { Wordmark } from './Logo.jsx'

const links = [
  { to: '/buy-data', label: 'Buy Data' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/faq', label: 'FAQ' },
  { to: '/agents', label: 'Agents' },
  { to: '/about', label: 'About' },
  { to: '/history', label: 'History' },
  { to: '/order-status', label: 'Track Order' },
]

// Desktop-only footer (md and up).
export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="hidden border-t border-border bg-surface md:block">
      <div className="wrap grid min-h-20 grid-cols-3 items-center gap-4 py-4">
        {/* Left — "easy" wordmark */}
        <Link to="/" className="justify-self-start" aria-label="easy — home">
          <Wordmark className="h-7" />
        </Link>

        {/* Center — links */}
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 justify-self-center text-sm">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className="text-muted transition-colors hover:text-brand">
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right — copyright */}
        <p className="justify-self-end text-right text-xs text-muted">
          © {year} GhEasy · Made in Ghana 🇬🇭
        </p>
      </div>
    </footer>
  )
}
