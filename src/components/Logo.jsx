import { Link } from 'react-router-dom'

// Compact "e" mark on a dark-green app-icon chip (used as an avatar).
export function LogoMark({ className = 'h-9 w-9' }) {
  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden rounded-xl ring-1 ring-brand/30 ${className}`}
      style={{ background: 'linear-gradient(135deg,#0f2a1a,#06120c)' }}
    >
      <img src="/e-mark.png" alt="" draggable="false" className="h-[72%] w-[72%] object-contain" />
    </span>
  )
}

// The "easy" wordmark — white on dark theme, dark-green on light theme.
export function Wordmark({ className = 'h-6' }) {
  return (
    <>
      <img
        src="/easy-dark.png"
        alt="easy"
        draggable="false"
        className={`hidden w-auto object-contain dark:block ${className}`}
      />
      <img
        src="/easy-light.png"
        alt="easy"
        draggable="false"
        className={`block w-auto object-contain dark:hidden ${className}`}
      />
    </>
  )
}

export default function Logo({ to = '/', className = '', wordmarkClass = 'h-6', withMark = false }) {
  return (
    <Link to={to} className={`group inline-flex items-center gap-2 ${className}`} aria-label="easy — home">
      {withMark && <LogoMark className="h-8 w-8" />}
      <Wordmark className={wordmarkClass} />
    </Link>
  )
}
