// Real network brand logos (trimmed, transparent PNGs in /public), shown as-is
// directly on the gradient cards.
const SRC = {
  mtn: '/net-mtn.png',
  telecel: '/net-telecel.png',
  airteltigo_ishare: '/net-at.png',
  airteltigo_bigtime: '/net-at.png',
}

export default function NetworkLogo({ network, className = '' }) {
  const src = SRC[network.id] || '/net-at.png'
  const h = network.id === 'mtn' ? 'h-10' : network.id === 'telecel' ? 'h-11' : 'h-12'
  return (
    <img
      src={src}
      alt={network.label}
      draggable="false"
      className={`${h} w-auto object-contain ${className}`}
    />
  )
}
