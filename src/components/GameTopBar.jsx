import { Link } from 'react-router-dom'
import { ArrowLeftIcon } from './icons.jsx'

// Fixed dark-green top bar for the full-page game routes (/games/wheel,
// /games/jump): ← back to /games on the left, game title centered. Sits at
// z-50 — above the app's sticky header (z-40) — and matches its height, so it
// reads as the page's own chrome. Going back never costs a life: lives are
// only spent by the PLAY button's /game/start call.
export default function GameTopBar({ title }) {
  return (
    <div
      className="fixed inset-x-0 top-0 z-50 border-b border-[#14532d] pt-safe"
      style={{ background: '#0a1f0e' }}
    >
      <div className="wrap-app relative flex h-14 items-center">
        <Link
          to="/games"
          aria-label="Back to Games"
          className="flex items-center gap-1.5 text-sm font-semibold"
          style={{ color: '#00FF88' }}
        >
          <ArrowLeftIcon className="h-5 w-5" /> Games
        </Link>
        <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 font-display text-base font-bold text-white">
          {title}
        </span>
      </div>
    </div>
  )
}
