import { motion } from 'framer-motion'
import { formatCedis, getNetwork } from '../lib/format.js'
import { CheckIcon } from './icons.jsx'

// Clean GB label: RemaData ships `volume` ("7.81GB"); DataHub ships gbAmount /
// a "Telecel 5GB" name. Never show raw MB.
function gbLabel(b) {
  if (b.volume) return b.volume
  if (b.gbAmount) return `${b.gbAmount}GB`
  const m = String(b.name || '').match(/(\d+(?:\.\d+)?)\s*GB/i)
  if (m) return `${m[1]}GB`
  if (b.volumeInMB) return `${(b.volumeInMB / 1024).toFixed(2)}GB`
  return b.name || ''
}

export default function BundleCard({ bundle, active, onSelect }) {
  const netLabel = bundle.networkConfig?.label || getNetwork(bundle.network)?.label || ''
  const subtitle = netLabel ? `${netLabel} Data Bundle` : 'Data Bundle'

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      aria-pressed={active}
      className={`group relative flex h-full w-full flex-col items-start overflow-hidden rounded-3xl border-2 border-border bg-card p-4 text-left transition-all duration-200 ${
        active ? 'ring-2 ring-brand shadow-glow' : 'hover:-translate-y-0.5'
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className="font-display text-[26px] font-bold leading-none tracking-tight text-fg">
          {gbLabel(bundle)}
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
      <span className="mt-auto pt-3 font-display text-lg font-bold tnum text-brand">
        {formatCedis(bundle.sellPrice)}
      </span>
    </motion.button>
  )
}
