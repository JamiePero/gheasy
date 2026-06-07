import { AnimatePresence, motion } from 'framer-motion'
import { NETWORKS } from '../lib/format.js'
import { track } from '../lib/analytics.js'
import { CheckIcon } from './icons.jsx'

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

// Full-colour network selector cards.
export default function NetworkPicker({ value, onChange, className = '' }) {
  const handle = (id) => {
    track('network_selected', { network: id })
    onChange(id)
  }

  return (
    <div
      className={`grid grid-cols-3 gap-3 ${className}`}
      role="radiogroup"
      aria-label="Choose a network"
    >
      {NETWORKS.map((n) => {
        const active = value === n.id
        return (
          <motion.button
            key={n.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => handle(n.id)}
            whileTap={{ scale: 0.95 }}
            className={`relative flex aspect-[5/4] flex-col items-center justify-center gap-1 overflow-hidden rounded-3xl p-3 text-center transition-all duration-200 ${
              active ? 'ring-2 ring-brand ring-offset-2 ring-offset-bg' : ''
            }`}
            style={{
              background: n.gradient,
              color: n.ink,
              boxShadow: active ? `0 18px 38px -12px ${n.glow}` : `0 10px 26px -16px ${n.glow}`,
            }}
          >
            <span className="font-display text-xl font-bold leading-none sm:text-2xl">
              {n.display}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide opacity-70 sm:text-[11px]">
              {n.label}
            </span>
            <AnimatePresence>
              {active && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white text-brand shadow-md"
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
