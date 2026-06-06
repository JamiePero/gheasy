// Ghanaian mobile networks. Colours mirror the values returned by the
// GhEasy API (/data/bundles) so the UI stays consistent with the backend.
export const NETWORKS = [
  {
    id: 'mtn',
    label: 'MTN',
    short: 'MTN',
    color: '#FFD700',
    ink: '#1A1400',
    glow: 'rgba(255,215,0,0.45)',
    blurb: "Ghana's largest network",
  },
  {
    id: 'telecel',
    label: 'Telecel',
    short: 'TC',
    color: '#FF0000',
    ink: '#FFFFFF',
    glow: 'rgba(255,0,0,0.42)',
    blurb: 'Formerly Vodafone',
  },
  {
    id: 'airteltigo',
    label: 'AirtelTigo',
    short: 'AT',
    color: '#C0392B',
    ink: '#FFFFFF',
    glow: 'rgba(192,57,43,0.45)',
    blurb: 'Big-value bundles',
  },
]

export const getNetwork = (id) => NETWORKS.find((n) => n.id === id) || NETWORKS[0]

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

// Normalise a Ghanaian phone number to local 0XXXXXXXXX form
export function normalizePhone(raw = '') {
  let s = String(raw).replace(/[^\d+]/g, '')
  if (s.startsWith('+233')) s = '0' + s.slice(4)
  else if (s.startsWith('233') && s.length === 12) s = '0' + s.slice(3)
  return s
}

export function isValidGhPhone(raw = '') {
  return /^0\d{9}$/.test(normalizePhone(raw))
}

// Pretty-print a number as 0XX XXX XXXX for display
export function prettyPhone(raw = '') {
  const s = normalizePhone(raw)
  if (!/^0\d{9}$/.test(s)) return raw
  return `${s.slice(0, 3)} ${s.slice(3, 6)} ${s.slice(6)}`
}
