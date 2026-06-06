import { AnimatePresence, motion } from 'framer-motion'
import { NETWORKS } from '../lib/format.js'
import { CheckIcon } from './icons.jsx'

const badgeSizes = {
  sm: 'h-9 w-9 text-[11px] rounded-xl',
  md: 'h-12 w-12 text-xs rounded-2xl',
  lg: 'h-16 w-16 text-sm rounded-2xl',
}

export function NetworkBadge({ network, size = 'md', className = '' }) {
  return (
    <span
      className={`grid place-items-center font-display font-bold leading-none ${badgeSizes[size]} ${className}`}
      style={{ background: network.color, color: network.ink }}
    >
      {network.short}
    </span>
  )
}

export default function NetworkPicker({ value, onChange, className = '' }) {
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
            onClick={() => onChange(n.id)}
            whileTap={{ scale: 0.95 }}
            className={`relative flex flex-col items-center gap-2.5 rounded-3xl border p-3 pt-4 text-center transition-all duration-200 ${
              active
                ? 'border-brand bg-brand/[0.06]'
                : 'border-border bg-card hover:border-brand/40'
            }`}
            style={active ? { boxShadow: `0 14px 34px -14px ${n.glow}` } : undefined}
          >
            <NetworkBadge network={n} size="md" />
            <span className="text-sm font-semibold leading-tight text-fg">{n.label}</span>
            <AnimatePresence>
              {active && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                  className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-brand text-white"
                >
                  <CheckIcon className="h-3.5 w-3.5" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}
