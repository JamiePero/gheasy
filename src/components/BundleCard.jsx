import { motion } from 'framer-motion'
import { formatCedis, getBundleStyle } from '../lib/format.js'
import { CheckIcon } from './icons.jsx'

export default function BundleCard({ bundle, active, onSelect }) {
  const style = getBundleStyle(bundle.network)
  const subtitle = bundle.description || bundle.validity || 'Data bundle'

  const card = (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      aria-pressed={active}
      className={`group relative flex h-full w-full flex-col items-start overflow-hidden rounded-3xl border bg-card p-4 text-left transition-all duration-200 ${
        active ? 'ring-2 ring-brand' : 'hover:-translate-y-0.5'
      }`}
      style={{ borderColor: style.gradientBorder ? 'transparent' : style.border }}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="font-display text-[26px] font-bold leading-none tracking-tight text-fg">
          {bundle.volume || bundle.name}
        </span>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-200 ${
            active ? 'scale-100 bg-brand text-white' : 'scale-0'
          }`}
        >
          <CheckIcon className="h-4 w-4" strokeWidth={3} />
        </span>
      </div>
      <span className="mt-1.5 line-clamp-1 text-xs text-muted">{subtitle}</span>
      <span className="mt-3 text-lg font-bold tnum" style={{ color: style.price }}>
        {formatCedis(bundle.sellPrice)}
      </span>
    </motion.button>
  )

  // AirtelTigo gets a red→blue gradient border (1.5px wrapper around the card).
  if (style.gradientBorder) {
    return (
      <div
        className="rounded-3xl p-[1.5px] transition-all duration-200"
        style={{ background: active ? '#22C55E' : style.gradient }}
      >
        {card}
      </div>
    )
  }
  return card
}
