import { Link } from 'react-router-dom'

export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center rounded-2xl shadow-[0_6px_18px_-6px_rgba(34,197,94,0.65)] ${className}`}
      style={{ background: 'linear-gradient(135deg,#4ADE80,#16A34A)' }}
    >
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="#fff" aria-hidden="true">
        <polygon points="12,3 14.2,9.2 20.8,9.4 15.6,13.4 17.4,19.8 12,16 6.6,19.8 8.4,13.4 3.2,9.4 9.8,9.2" />
      </svg>
    </span>
  )
}

export default function Logo({ to = '/', className = '', markClass, showText = true }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2.5 ${className}`}
      aria-label="GhEasy — home"
    >
      <LogoMark className={markClass || 'h-9 w-9'} />
      {showText && (
        <span className="font-display text-xl font-bold tracking-tight text-fg">
          Gh<span className="text-brand">Easy</span>
        </span>
      )}
    </Link>
  )
}
