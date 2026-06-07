// Ghanaian mobile networks with full brand gradients.
// `id` is the real getflashx API slug used to fetch bundles.
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
    id: 'airteltigo_ishare',
    label: 'AirtelTigo',
    display: 'at',
    abbr: 'AT',
    color: '#E63946',
    ink: '#ffffff',
    gradient: 'linear-gradient(135deg, #E63946, #023E8A)',
    glow: 'rgba(230,57,70,0.45)',
    blurb: 'iShare data',
  },
  {
    id: 'airteltigo_bigtime',
    label: 'AirtelTigo Bulk',
    display: 'at',
    abbr: 'AT',
    badge: 'BULK',
    color: '#E63946',
    ink: '#ffffff',
    gradient: 'linear-gradient(135deg, #E63946, #023E8A)',
    glow: 'rgba(230,57,70,0.45)',
    blurb: 'Bigtime bulk data',
  },
]

// Agent store economics
export const AGENT_BASE_PRICE = 4.4 // wholesale floor per GB
export const AGENT_FEE = 60 // one-time setup fee (GHS)

export const getNetwork = (id) => {
  if (!id) return NETWORKS[0]
  return (
    NETWORKS.find((n) => n.id === id) ||
    (String(id).startsWith('airteltigo') ? NETWORKS[2] : NETWORKS[0])
  )
}

// Per-network bundle-card styling (price colour + border treatment).
export function getBundleStyle(networkId) {
  const id = String(networkId || '')
  if (id === 'mtn') return { price: '#FFD700', border: 'rgba(255,215,0,0.45)', gradientBorder: false }
  if (id === 'telecel') return { price: '#CC0000', border: 'rgba(204,0,0,0.5)', gradientBorder: false }
  if (id.startsWith('airteltigo')) {
    return {
      price: '#ffffff',
      border: 'transparent',
      gradientBorder: true,
      gradient: 'linear-gradient(135deg, #E63946, #023E8A)',
    }
  }
  return { price: '#22C55E', border: 'rgba(34,197,94,0.4)', gradientBorder: false }
}

// Convert a volume in MB to a clean label. NEVER show raw MB for >= 1GB.
export function formatVolume(volumeInMB) {
  const n = Number(volumeInMB)
  if (!Number.isFinite(n) || n <= 0) return null
  const gb = Math.round(n / 1024)
  return gb >= 1 ? `${gb}GB` : `${Math.round(n)}MB`
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

// First name from a full name, for greetings.
export function firstName(name = '') {
  return String(name).trim().split(/\s+/)[0] || ''
}

// --- Network detection by phone prefix -------------------------------------
const PREFIXES = {
  mtn: ['024', '025', '053', '054', '055', '059'],
  telecel: ['020', '050'],
  airteltigo: ['026', '027', '056', '057'],
}

// Which network family a network id belongs to (both AirtelTigo variants → airteltigo).
export function networkFamily(id) {
  const s = String(id || '')
  if (s.startsWith('airteltigo')) return 'airteltigo'
  if (s === 'telecel') return 'telecel'
  if (s === 'mtn') return 'mtn'
  return null
}

// Detect the network family from a Ghanaian number's prefix.
export function detectNetworkFamily(raw = '') {
  const s = normalizePhone(raw)
  if (!/^0\d{9}$/.test(s)) return null
  const p = s.slice(0, 3)
  for (const fam of Object.keys(PREFIXES)) {
    if (PREFIXES[fam].includes(p)) return fam
  }
  return null
}

export const familyLabel = (fam) =>
  ({ mtn: 'MTN', telecel: 'Telecel', airteltigo: 'AirtelTigo' })[fam] || ''
