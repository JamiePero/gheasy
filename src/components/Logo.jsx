import { Link } from 'react-router-dom'

// The GhEasy "e" mark sits on a dark-green app-icon chip so the white glyph
// stays visible in both light and dark themes.
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-xl ring-1 ring-brand/30 ${className}`}
      style={{ background: 'linear-gradient(135deg,#0f2a1a,#06120c)' }}
    >
      <img
        src="/easytra.png"
        alt=""
        draggable="false"
        className="h-[82%] w-[82%] object-contain"
      />
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
