import { motion } from 'framer-motion'
import { formatCedis, getNetwork } from '../lib/format.js'
import { CheckIcon } from './icons.jsx'

// Clean GB label. Providers are inconsistent: RemaData ships `volume` as a binary
// figure ("7.81GB" = 8000/1024), DataHub ships gbAmount or a "Telecel 5GB" name,
// and volumeInMB is decimal (1GB = 1000MB). Resolve everything to a whole-number
// GB (or MB below 1GB) so cards never show "7.81GB" or raw "1000MB".
function gbLabel(b) {
  const named = String(b.volume || b.name || '').match(/(\d+(?:\.\d+)?)\s*GB/i)
  if (named) return `${Math.round(parseFloat(named[1]))}GB`
  if (b.gbAmount) return `${Math.round(b.gbAmount)}GB`
  const mb = Number(b.volumeInMB)
  if (Number.isFinite(mb) && mb > 0) return mb >= 1000 ? `${Math.round(mb / 1000)}GB` : `${Math.round(mb)}MB`
  return String(b.volume || b.name || '')
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
