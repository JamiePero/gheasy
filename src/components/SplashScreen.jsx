import { motion } from 'framer-motion'
import { LogoMark } from './Logo.jsx'

// Staggered start delays (seconds) so the rings flow outward continuously.
const RINGS = [0, 0.5, 1, 1.5, 2]

// Full-screen splash with organic sonar ripples radiating from the easy logo.
// Rings are centered purely by layout (inset:0 + margin:auto) and animate only
// scale+rotate+opacity — never translate or border-radius — so iOS Safari can't
// drop the centering/radius mid-animation and leave a stray sharp box.
export default function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] grid place-items-center overflow-hidden"
      style={{ backgroundColor: '#050f05' }}
    >
      <style>{`
        @keyframes easySplashRipple {
          0%   { transform: scale(0.3) rotate(0deg); opacity: 0.5; }
          60%  { opacity: 0.18; }
          100% { transform: scale(3.4) rotate(170deg); opacity: 0; }
        }
        @keyframes easySplashGlow {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.6; }
        }
        @keyframes easySplashPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.07); }
        }
        .easy-splash-ring {
          position: absolute;
          inset: 0;
          margin: auto;
          height: 190px;
          width: 190px;
          /* Static organic blob — no animated border-radius (avoids the iOS
             Safari glitch that renders a sharp square mid-animation). */
          border-radius: 42% 58% 70% 30% / 45% 45% 55% 55%;
          border: 2px solid rgba(34, 197, 94, 0.7);
          transform-origin: center;
          will-change: transform, opacity;
          animation: easySplashRipple 2.6s cubic-bezier(0.22, 1, 0.36, 1) infinite;
        }
        .easy-splash-glow {
          position: absolute;
          inset: 0;
          margin: auto;
          height: 240px;
          width: 240px;
          border-radius: 9999px;
          background: radial-gradient(circle, rgba(34, 197, 94, 0.45), transparent 70%);
          filter: blur(36px);
          animation: easySplashGlow 2.4s ease-in-out infinite;
        }
        .easy-splash-mark { animation: easySplashPulse 2.4s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .easy-splash-ring, .easy-splash-glow, .easy-splash-mark { animation: none; }
          .easy-splash-ring { opacity: 0.16; }
        }
      `}</style>

      <div className="relative grid h-48 w-48 place-items-center">
        <span className="easy-splash-glow" aria-hidden="true" />
        {RINGS.map((delay, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="easy-splash-ring"
            style={{ animationDelay: `${delay}s` }}
          />
        ))}
        <div className="easy-splash-mark relative z-10">
          <LogoMark className="h-24 w-24" />
        </div>
      </div>
    </motion.div>
  )
}
