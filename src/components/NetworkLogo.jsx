// Inline, file-free network brand marks, drawn in the network's ink colour so
// they sit cleanly on the gradient card. If you drop the official PNGs into
// /public (e.g. /logo-mtn.png) you can swap these for <img> later.
export default function NetworkLogo({ network, className = '' }) {
  const id = network.id
  const ink = network.ink

  if (id === 'mtn') {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-[50%] border-[3px] px-3.5 py-1 font-display text-lg font-extrabold leading-none tracking-tight ${className}`}
        style={{ borderColor: ink, color: ink }}
      >
        MTN
      </span>
    )
  }

  if (id === 'telecel') {
    return (
      <span
        className={`font-display text-2xl font-extrabold lowercase leading-none ${className}`}
        style={{ color: ink }}
      >
        telecel
      </span>
    )
  }

  // AirtelTigo (iShare + Bigtime)
  return (
    <span className={`text-center leading-none ${className}`} style={{ color: ink }}>
      <span className="font-display text-3xl font-extrabold lowercase tracking-tight">at</span>
      <span className="mt-1 block text-[8px] font-medium italic opacity-90">life is simple</span>
    </span>
  )
}
