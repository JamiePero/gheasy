import { motion } from 'framer-motion'
import { formatCedis, getNetwork } from '../lib/format.js'
import { CheckIcon } from './icons.jsx'

// Clean GB label. Upstream data is inconsistent: `volume` can arrive as a binary
// figure ("7.81GB" = 8000/1024), sometimes only gbAmount or a "Telecel 5GB" name,
// and volumeInMB is decimal (1GB = 1000MB). Resolve everything to a whole-number
// GB (or MB below 1GB) so cards never show "7.81GB" or raw "1000MB".
function gbLabel(b) {
  // Prefer the leading number in the NAME (authoritative, e.g. "5GB (NON-EXPIRY)"),
  // rounding any binary decimal the provider ships, so cards never show "4.88GB".
  const fromName = String(b.name || '').match(/(\d+(?:\.\d+)?)\s*GB/i)
  if (fromName) return `${Math.round(parseFloat(fromName[1]))}GB`
  const fromVolume = String(b.volume || '').match(/(\d+(?:\.\d+)?)\s*GB/i)
  if (fromVolume) return `${Math.round(parseFloat(fromVolume[1]))}GB`
  if (b.gbAmount) return `${Math.round(b.gbAmount)}GB`
  const mb = Number(b.volumeInMB)
  if (Number.isFinite(mb) && mb > 0) return mb >= 1000 ? `${Math.round(mb / 1000)}GB` : `${Math.round(mb)}MB`
  return String(b.name || b.volume || '')
}

export default function BundleCard({ bundle, active, onSelect }) {
  const netLabel = bundle.networkConfig?.label || getNetwork(bundle.network)?.label || ''
  const subtitle = netLabel ? `${netLabel} Data Bundle` : 'Data Bundle'
  // A size the active provider can't serve — visible but not buyable, no price.
  const unavailable = bundle.available === false

  return (
    <motion.button
      type="button"
      onClick={unavailable ? undefined : onSelect}
      disabled={unavailable}
      whileTap={unavailable ? undefined : { scale: 0.97 }}
      aria-pressed={active}
      aria-disabled={unavailable}
      className={`group relative flex h-full w-full flex-col items-start overflow-hidden rounded-3xl border-2 p-4 text-left transition-all duration-200 ${
        unavailable
          ? 'cursor-not-allowed border-border bg-surface opacity-60'
          : active
            ? 'border-border bg-card ring-2 ring-brand shadow-glow'
            : 'border-border bg-card hover:-translate-y-0.5'
      }`}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <span className={`font-display text-[26px] font-bold leading-none tracking-tight ${unavailable ? 'text-muted' : 'text-fg'}`}>
          {gbLabel(bundle)}
        </span>
        {!unavailable && (
          <span
            className={`grid h-6 w-6 shrink-0 place-items-center rounded-full transition-all duration-200 ${
              active ? 'scale-100 bg-brand text-white' : 'scale-0'
            }`}
          >
            <CheckIcon className="h-4 w-4" strokeWidth={3} />
          </span>
        )}
      </div>
      <span className="mt-1.5 line-clamp-1 text-xs text-muted">{subtitle}</span>
      <span
        className={`mt-auto pt-3 font-display ${
          unavailable ? 'text-xs font-semibold text-muted' : 'text-lg font-bold tnum text-brand'
        }`}
      >
        {unavailable ? 'Temporarily unavailable' : formatCedis(bundle.sellPrice)}
      </span>
    </motion.button>
  )
}
