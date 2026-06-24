import { useSyncExternalStore } from 'react'
import { WHATSAPP_NUMBER, WHATSAPP_DEFAULT_TEXT } from '../config.js'
import { subscribeSupport, getSupportContact } from '../lib/support.js'

// Two-tone WhatsApp logo: a brand-green speech bubble (currentColor) with an
// explicit WHITE handset — so the receiver stays crisp on the dark frosted
// button instead of vanishing as a negative-space cutout (the old single-path
// glyph read as a green blob on the dark glass).
function WhatsAppGlyph({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Z"
      />
      <path
        fill="#fff"
        d="M17.47 14.38c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.17-1.34-.8-.72-1.34-1.6-1.5-1.87-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.01-.22-.53-.44-.46-.61-.47h-.52c-.18 0-.47.07-.72.34-.25.27-.95.93-.95 2.27 0 1.34.97 2.63 1.11 2.81.14.18 1.92 2.93 4.65 4.11.65.28 1.16.45 1.55.58.65.21 1.25.18 1.72.11.52-.08 1.6-.65 1.83-1.29.23-.63.23-1.18.16-1.29-.07-.11-.25-.18-.52-.32Z"
      />
    </svg>
  )
}

// Ghana local "0XXXXXXXXX" -> international "233XXXXXXXXX" for wa.me links.
function waDigits(num) {
  let d = String(num || '').replace(/\D/g, '')
  if (d.startsWith('0')) d = '233' + d.slice(1)
  return d
}

// Floating WhatsApp support button — a 56px circular frosted-glass pill with a
// soft green glow. Centering is layout-only (grid place-items-center) so the
// 28px icon can't drift or clip inside the 56px circle. bottom-[168px] on mobile
// clears the bottom nav (~88px) and the floating Pay bar (~96px) on
// Store/BuyData; bottom-6 on desktop. On an agent store page the number is
// overridden with the agent's own support line (lib/support.js); everywhere
// else it falls back to the default easy support number.
export default function WhatsAppButton() {
  const override = useSyncExternalStore(subscribeSupport, getSupportContact, () => null)
  const digits = waDigits(override?.number || WHATSAPP_NUMBER)
  if (!digits) return null
  const message = override?.message || WHATSAPP_DEFAULT_TEXT
  const href = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={override ? 'Chat with this store on WhatsApp' : 'Chat with GhEasy on WhatsApp'}
      title="WhatsApp support"
      className="fixed bottom-[168px] right-4 z-50 grid h-14 w-14 place-items-center rounded-full border border-brand/40 bg-[#050f05]/60 shadow-[0_4px_24px_rgba(34,197,94,0.45)] backdrop-blur-md transition-transform duration-200 hover:scale-105 active:scale-95 md:bottom-6"
    >
      <WhatsAppGlyph className="h-7 w-7 text-brand" />
    </a>
  )
}
