// Real network brand logos (trimmed, transparent PNGs in /public).
// - MTN (black) sits on the gold gradient
// - Telecel (white) sits on the red gradient
// - AirtelTigo "at" (multi-colour) gets a white chip so it stays legible on
//   the red→blue gradient
const SRC = {
  mtn: '/net-mtn.png',
  telecel: '/net-telecel.png',
  airteltigo_ishare: '/net-at.png',
  airteltigo_bigtime: '/net-at.png',
}

export default function NetworkLogo({ network, className = '' }) {
  const src = SRC[network.id] || '/net-at.png'

  if (network.id.startsWith('airteltigo')) {
    return (
      <span className={`grid place-items-center rounded-2xl bg-white px-3 py-2 shadow-sm ${className}`}>
        <img src={src} alt={network.label} className="h-12 w-auto object-contain" draggable="false" />
      </span>
    )
  }

  return (
    <img
      src={src}
      alt={network.label}
      className={`${network.id === 'mtn' ? 'h-10' : 'h-11'} w-auto object-contain ${className}`}
      draggable="false"
    />
  )
}
