// Ghanaian mobile networks with full brand gradients.
export const NETWORKS = [
  {
    id: 'mtn',
    label: 'MTN',
    display: 'MTN',
    abbr: 'MTN',
    color: '#FFD700',
    ink: '#0A0F1E',
    gradient: 'linear-gradient(135deg, #FFD700, #FFA500)',
    glow: 'rgba(255,215,0,0.45)',
    blurb: "Ghana's largest network",
  },
  {
    id: 'telecel',
    label: 'Telecel',
    display: 'telecel',
    abbr: 'Tc',
    color: '#CC0000',
    ink: '#ffffff',
    gradient: 'linear-gradient(135deg, #CC0000, #7B0000)',
    glow: 'rgba(204,0,0,0.45)',
    blurb: 'Formerly Vodafone',
  },
  {
    id: 'airteltigo',
    label: 'AirtelTigo',
    display: 'at',
    abbr: 'AT',
    color: '#E63946',
    ink: '#ffffff',
    gradient: 'linear-gradient(135deg, #E63946, #023E8A)',
    glow: 'rgba(230,57,70,0.45)',
    blurb: 'Big-value bundles',
  },
]

export const getNetwork = (id) => NETWORKS.find((n) => n.id === id) || NETWORKS[0]

// Per-network bundle-card styling (price colour + border treatment).
export function getBundleStyle(networkId) {
  switch (networkId) {
    case 'mtn':
      return { price: '#FFD700', border: 'rgba(255,215,0,0.45)', gradientBorder: false }
    case 'telecel':
      return { price: '#CC0000', border: 'rgba(204,0,0,0.5)', gradientBorder: false }
    case 'airteltigo':
      return {
        price: '#ffffff',
        border: 'transparent',
        gradientBorder: true,
        gradient: 'linear-gradient(135deg, #E63946, #023E8A)',
      }
    default:
      return { price: '#22C55E', border: 'rgba(34,197,94,0.4)', gradientBorder: false }
  }
}

// Convert a volume in MB to a clean label. NEVER show raw MB for >= 1GB.
export function formatVolume(volumeInMB) {
  const n = Number(volumeInMB)
  if (!Number.isFinite(n) || n <= 0) return null
  if (n < 1024) return `${Math.round(n)}MB`
  return `${Math.round(n / 1024)}GB`
}

// Ghana Cedi formatting → ₵4.80
export function formatCedis(value) {
  const v = Number(value)
  if (!Number.isFinite(v)) return '₵0.00'
  return (
    '₵' +
    v.toLocaleString('en-GH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

// Normalise a Ghanaian phone number to local 0XXXXXXXXX form.
export function normalizePhone(raw = '') {
  let s = String(raw).replace(/[^\d+]/g, '')
  if (s.startsWith('+233')) s = '0' + s.slice(4)
  else if (s.startsWith('233') && s.length === 12) s = '0' + s.slice(3)
  return s
}

export function isValidGhPhone(raw = '') {
  return /^0\d{9}$/.test(normalizePhone(raw))
}

// Pretty-print a number as 0XX XXX XXXX for display.
export function prettyPhone(raw = '') {
  const s = normalizePhone(raw)
  if (!/^0\d{9}$/.test(s)) return raw
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`
}
