import { AnimatePresence, motion } from 'framer-motion'
import { NETWORKS } from '../lib/format.js'
import { track } from '../lib/analytics.js'
import { CheckIcon } from './icons.jsx'
import NetworkLogo from './NetworkLogo.jsx'

const badgeSizes = {
  sm: 'h-9 w-9 text-[11px] rounded-xl',
  md: 'h-12 w-12 text-xs rounded-2xl',
  lg: 'h-16 w-16 text-sm rounded-2xl',
}

// Small gradient chip used in summaries / order details.
export function NetworkBadge({ network, size = 'md', className = '' }) {
  return (
    <span
      className={`grid place-items-center font-display font-bold leading-none ${badgeSizes[size]} ${className}`}
      style={{ background: network.gradient, color: network.ink }}
    >
      {network.abbr}
    </span>
  )
}

// Full-colour network selector cards with brand logos.
export default function NetworkPicker({ value, onChange, className = '' }) {
  const handle = (id) => {
    track('network_selected', { network: id })
    onChange(id)
  }

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`} role="radiogroup" aria-label="Choose a network">
      {NETWORKS.map((n) => {
        const active = value === n.id
        return (
          <motion.button
            key={n.id}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={n.label}
            onClick={() => handle(n.id)}
            whileTap={{ scale: 0.96 }}
            className={`relative flex aspect-[16/10] items-center justify-center overflow-hidden rounded-3xl p-3 transition-all duration-200 ${
              active ? 'ring-2 ring-brand ring-offset-2 ring-offset-bg' : ''
            }`}
            style={{
              background: n.gradient,
              color: n.ink,
              boxShadow: active ? `0 18px 38px -12px ${n.glow}` : `0 10px 26px -16px ${n.glow}`,
            }}
          >
            <NetworkLogo network={n} />
            {n.badge && (
              <span className="absolute left-2.5 top-2.5 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold tracking-wide text-white">
                {n.badge}
              </span>
            )}
            <AnimatePresence>
              {active && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full bg-white text-brand shadow-md"
                >
                  <CheckIcon className="h-4 w-4" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
