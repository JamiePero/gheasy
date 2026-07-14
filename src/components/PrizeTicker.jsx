import { useEffect, useState } from 'react'

const BASE = 'https://api.getflashx.com'

// Thin neon marquee of recent easy Jump prize winners. Sits directly below the
// home ad carousel. Hides itself entirely when there are no winners yet, and
// refreshes every 5 minutes. Content scrolls right→left on a seamless CSS loop.
export default function PrizeTicker({ className = '' }) {
  const [items, setItems] = useState([])

  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        const res = await fetch(`${BASE}/gheasy/game/prize-log`)
        const d = await res.json().catch(() => ({}))
        if (alive && d?.success && Array.isArray(d.log)) setItems(d.log)
      } catch (e) {
        /* silent — an unreachable endpoint just leaves the ticker hidden */
      }
    }
    load()
    const id = setInterval(load, 5 * 60 * 1000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [])

  if (!items.length) return null

  const line = items.map((it) => `🏆 ${it.displayName} won ${it.prize}`)
  // Duplicate the sequence so the translateX(-50%) loop wraps seamlessly.
  const doubled = [...line, ...line]

  return (
    <div className={`prize-ticker ${className}`} role="marquee" aria-label="Recent easy Jump winners">
      <div className="prize-ticker-inner">
        {doubled.map((t, i) => (
          <span key={i} className="prize-ticker-item">
            {t}
            <span className="prize-ticker-sep"> · </span>
          </span>
        ))}
      </div>
      <style>{`
        .prize-ticker {
          overflow: hidden;
          height: 36px;
          display: flex;
          align-items: center;
          white-space: nowrap;
          background: #0a1f0e;
          border-radius: 12px;
        }
        .prize-ticker-inner {
          display: inline-flex;
          align-items: center;
          animation: tickerScroll 40s linear infinite;
          will-change: transform;
        }
        .prize-ticker-item {
          color: #00FF88;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.01em;
        }
        .prize-ticker-sep {
          color: rgba(0, 255, 136, 0.45);
          padding: 0 6px;
        }
        @keyframes tickerScroll {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .prize-ticker-inner { animation-duration: 90s; }
        }
      `}</style>
    </div>
  )
}
