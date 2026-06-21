import { motion } from 'framer-motion'
import { LogoMark } from './Logo.jsx'

// Staggered start delays (seconds) so the rings flow outward one after another,
// continuously, for the ~2s the splash is shown.
const RINGS = [0, 0.5, 1, 1.5, 2]

// Full-screen splash with organic sonar ripples radiating from the easy logo.
// Shown once per session on cold load (see App.jsx); fades out via AnimatePresence.
export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[100] grid place-items-center overflow-hidden"
      style={{ backgroundColor: '#050f05' }}
    >
      <style>{`
        @keyframes easySplashRipple {
          0%   { transform: translate(-50%, -50%) scale(0.3) rotate(0deg); opacity: 0.5; }
          60%  { opacity: 0.18; }
          100% { transform: translate(-50%, -50%) scale(3.4) rotate(170deg); opacity: 0; }
        }
        /* Morphing border-radius keeps the rings wavy/organic, not perfect circles. */
        @keyframes easySplashMorph {
          0%, 100% { border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%; }
          50%      { border-radius: 63% 37% 34% 66% / 57% 63% 37% 43%; }
        }
        @keyframes easySplashPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.07); }
        }
        @keyframes easySplashGlow {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.6; }
        }
        .easy-splash-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 190px;
          width: 190px;
          border: 2px solid rgba(34, 197, 94, 0.7);
          will-change: transform, opacity, border-radius;
          animation:
            easySplashRipple 2.6s cubic-bezier(0.22, 1, 0.36, 1) infinite,
            easySplashMorph 3.2s ease-in-out infinite;
        }
        .easy-splash-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          height: 240px;
          width: 240px;
          transform: translate(-50%, -50%);
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.45), transparent 70%);
          filter: blur(36px);
          animation: easySplashGlow 2.4s ease-in-out infinite;
        }
        .easy-splash-mark { animation: easySplashPulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .easy-splash-ring, .easy-splash-mark, .easy-splash-glow { animation: none; }
          .easy-splash-ring { opacity: 0.16; }
        }
      `}</style>

      <div className="relative grid place-items-center">
        <span className="easy-splash-glow" aria-hidden="true" />
        {RINGS.map((delay, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="easy-splash-ring"
            style={{ animationDelay: `${delay}s, ${delay}s` }}
          />
        ))}
        <div className="easy-splash-mark relative z-10">
          <LogoMark className="h-24 w-24" />
        </div>
      </div>
    </motion.div>
  )
}
