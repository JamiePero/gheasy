import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Page from '../components/Page.jsx'
import Seo from '../components/Seo.jsx'

// /games landing — ONLY the two game selector cards. Each card navigates to
// its own full-page route (/games/wheel, /games/jump); nothing else renders
// here. Cards match the buy-page network selector styling: dark green, neon
// glow on hover, 160×120 placeholder graphic, name below in white bold.
const GAMES = [
  { id: 'wheel', name: 'easy Wheel', to: '/games/wheel' },
  { id: 'jump', name: 'easy Jump', to: '/games/jump' },
]

export default function Games() {
  const navigate = useNavigate()

  return (
    <Page className="wrap-app pb-16 pt-6">
      <Seo
        title="easy Games — Spin & Win Free Data | easy"
        description="Play easy Wheel and easy Jump. Every data purchase earns free plays — win real data bundles sent straight to your number."
      />
      <h1 className="font-display text-2xl font-bold tracking-tight">easy Games</h1>
      <p className="mt-1 text-sm text-muted">Pick a game. Win free data.</p>

      <div className="mt-5 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
        {GAMES.map((g) => (
          <motion.button
            key={g.id}
            type="button"
            aria-label={`Play ${g.name}`}
            onClick={() => navigate(g.to)}
            whileTap={{ scale: 0.96 }}
            className="relative overflow-hidden rounded-3xl border-2 border-[#14532d] bg-[#0a1f0e] p-3 shadow-[0_10px_26px_-16px_rgba(0,255,136,0.45)] transition-all duration-200 hover:shadow-[0_0_26px_rgba(0,255,136,0.4)]"
          >
            {/* Placeholder graphic — exactly 160×120px (@2x asset: 320×240) */}
            <div className="mx-auto grid h-[120px] w-[160px] place-items-center rounded-2xl border border-[#2b4a35]/60 bg-[#16241b]">
              <span className="text-xs font-medium text-[#7ba88a]">Graphic coming soon</span>
            </div>
            <p className="mt-3 text-center font-display text-base font-bold text-white">{g.name}</p>
          </motion.button>
        ))}
      </div>
    </Page>
  )
}
