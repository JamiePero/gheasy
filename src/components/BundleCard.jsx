import { motion } from 'framer-motion'
import { formatCedis } from '../lib/format.js'
import { CheckIcon } from './icons.jsx'

export default function BundleCard({ bundle, active, onSelect }) {
  const subtitle = bundle.description || bundle.validity || 'Data bundle'
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      aria-pressed={active}
      className={`group relative flex flex-col items-start overflow-hidden rounded-3xl border p-4 text-left transition-all duration-200 ${
        active
          ? 'border-brand bg-brand/[0.06] ring-1 ring-brand shadow-glow-sm'
          : 'border-border bg-card hover:-translate-y-0.5 hover:border-brand/40'
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="font-display text-[26px] font-bold leading-none tracking-tight text-fg">
          {bundle.volume || bundle.name}
        </span>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all ${
            active ? 'scale-100 bg-brand text-white' : 'scale-0'
          }`}
        >
          <CheckIcon className="h-4 w-4" strokeWidth={3} />
        </span>
      </div>
      <span className="mt-1.5 line-clamp-1 text-xs text-muted">{subtitle}</span>
      <span className="mt-3 text-lg font-bold tnum text-brand">{formatCedis(bundle.sellPrice)}</span>
    </motion.button>
  )
}
